'use strict';

var path = require('path'),
    util = require('../util'),
    finder = require('tagfinder'),
    metadata = require('../handler/metadata'),
    handlerFactory = require('../handler/default');


var proto = {

    get fallbackLocale() {
        return this.contentProvider.fallbackLocale;
    },

    localize: function (name, locale, templateRoot, callback) {
        var template, bundle, handler;

        locale = util.parseLangTag(locale);
        if (typeof templateRoot === 'function') {
            callback = templateRoot;
            templateRoot = undefined;
        }

        template = path.join(templateRoot || this.templateRoot, name + '.dust');
        bundle = this.contentProvider.getBundle(name, locale);

        handler = handlerFactory.create(bundle);
        if (this.htmlMetadataEnabled) {
            handler = metadata.decorate(handler);
        }

        finder.parse(template, handler, callback);
    }

};

exports.create = function (provider, templateRoot, enableHtmlMetadata) {
    return Object.create(proto, {

        contentProvider: {
            enumerable: true,
            writable: false,
            value: provider
        },

        templateRoot: {
            enumerable: true,
            writable: false,
            value: templateRoot
        },

        htmlMetadataEnabled: {
            enumerable: true,
            writable: false,
            value: enableHtmlMetadata
        }

    });
};