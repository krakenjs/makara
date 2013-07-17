'use strict';

var util = require('../util'),
    bundle = require('./bundle'),
    metadata = require('./metadata'),
    resolver = require('../resolver');


var proto = {

    get fallbackLocale() {
        return this.bundleResolver.fallbackLocale;
    },

    getBundle: function (name, locale) {
        var content, fileInfo;

        locale = locale ? util.parseLangTag(locale) : this.fallbackLocale;

        content = this.bundles[locale.country];
        content = content && content[locale.language];
        content = content && content[name];

        if (!content) {
            fileInfo = this.bundleResolver.resolve(name, locale);
            if (this.cache) {
                content = this.bundles[locale.country] || (this.bundles[locale.country] = Object.create(null));
                content = content[locale.language] || (content[locale.language] = Object.create(null));
                content = content[name] = this._createBundle(fileInfo);
            } else {
                content = this._createBundle(fileInfo);
            }
        }

        return content;
    },

    _createBundle: function (fileInfo) {
        var content;

        content = bundle.create(fileInfo);
        if (this.htmlMetadataEnabled) {
            content = metadata.decorate(content);
        }

        return content;
    }
};


exports.create = function (contentRoot, fallbackLocale, cache, enableHtmlMetadata) {

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
        },

        htmlMetadataEnabled: {
            enumerable: true,
            writable: false,
            value: !!enableHtmlMetadata

        }

    });

};