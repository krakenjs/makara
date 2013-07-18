'use strict';

var path = require('path'),
    util = require('../util'),
    finder = require('tagfinder'),
    handlerFactory = require('../handler/default');


var proto = {

    get fallbackLocale() {
        return this.contentProvider.fallbackLocale;
    },

    localize: function (name, locale, templateRoot, callback) {
        var template, bundle, handler;

        locale = locale ? util.parseLangTag(locale) : undefined;
        if (typeof templateRoot === 'function') {
            callback = templateRoot;
            templateRoot = undefined;
        }

        template = path.join(templateRoot || this.templateRoot, name + '.dust');
        bundle = this.contentProvider.getBundle(name, locale);

        handler = handlerFactory.create(bundle);
        finder.parse(template, handler, callback);
    }

};

exports.create = function (provider, templateRoot) {
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
        }

    });
};