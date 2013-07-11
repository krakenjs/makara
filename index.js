'use strict';


var dustjs = require('dustjs-linkedin'),
    engine = require('express-dustjs'),
    cache = require('./lib/cache'),
    views = require('./lib/view'),
    translator = require('./lib/translator'),
    provider = require('./lib/provider');


var proto = {

    configureExpress: function (app, config) {
        var ext, viewCache, trans;

        // For i18n we silently switch to the JS engine for all requests.
        ext = app.get('view engine');
        app.engine(ext, engine.js({ cache: false }));

        trans = translator.create(this.contentProvider, app.get('views'), !!config.enableHtmlMetadata);
        dustjs.onLoad = views[ext].create(app, trans);

        if (this.cache) {
            viewCache = cache.create(dustjs.onLoad, this.contentProvider.fallbackLocale);
            dustjs.onLoad = viewCache.get.bind(viewCache);
        }
    },

    getBundle: function (name, locale, callback) {
        this.contentProvider.getBundle(name, locale).load(callback);
    }

};



exports.create = function (config) {
    var contentRoot, fallbackLocale;

    contentRoot = config.contentPath || config.contentRoot;
    fallbackLocale = config.fallback || config.fallbackLocale;

    return Object.create(proto, {

        cache: {
            enumerable: true,
            writable: false,
            value: !!config.cache
        },

        contentProvider: {
            enumerable: true,
            writable: false,
            value: provider.create(contentRoot, fallbackLocale)
        }

    });
};
