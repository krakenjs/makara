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

        content = this._get(locale.country || '*', locale.language || '*', name);
        if (!content) {
            fileInfo = this.bundleResolver.resolve(name, locale);
            content = this._createBundle(fileInfo);
            this._set(locale.country || '*', locale.language || '*', name, content);
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
    },

    _get: function () {
        var hash;

        if (!this.cache) {
            return undefined;
        }

        hash = util.md5.apply(undefined, arguments);
        return this.bundles[hash];
    },

    _set: function () {
        var args, value, hash;

        args = Array.prototype.slice.call(arguments);
        value = args.pop();

        if (this.cache) {
            hash = util.md5.apply(undefined, args);
            this.bundles[hash] = value;
        }

        return value;
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