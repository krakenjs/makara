'use strict';

var util = require('../util'),
    bundle = require('./bundle'),
    resolver = require('../resolver');


var proto = {

    get fallbackLocale() {
        return this.bundleResolver.fallbackLocale;
    },

    getBundle: function (name, locale) {
        var content, fileInfo;

        locale = util.parseLangTag(locale);

        content = this.bundles[locale.country];
        content = content && content[locale.language];
        content = content && content[name];

        if (!content) {
            fileInfo = this.bundleResolver.resolve(name, locale);
            if (this.cache) {
                content = this.bundles[locale.country] || (this.bundles[locale.country] = Object.create(null));
                content = content[locale.language] || (content[locale.language] = Object.create(null));
                content = content[name] = bundle.create(fileInfo);
            } else {
                content = bundle.create(fileInfo);
            }
        }

        return content;
    }

};


exports.create = function (contentRoot, fallbackLocale, cache) {

    return Object.create(proto, {

        bundles: {
            enumerable: true,
            writable: false,
            value: Object.create(null)
        },

        bundleResolver: {
            enumerable: true,
            writable: false,
            value: resolver.create({ root: contentRoot, ext: 'properties', fallback: fallbackLocale })
        },

        cache: {
            enumerable: true,
            writable: false,
            value: !!cache
        }

    });

};