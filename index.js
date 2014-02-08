/*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2014 eBay Software Foundation                                │
│                                                                             │
│hh ,'""`.                                                                    │
│  / _  _ \  Licensed under the Apache License, Version 2.0 (the "License");  │
│  |(@)(@)|  you may not use this file except in compliance with the License. │
│  )  __  (  You may obtain a copy of the License at                          │
│ /,'))((`.\                                                                  │
│(( ((  )) ))    http://www.apache.org/licenses/LICENSE-2.0                   │
│ `\ `)(' /'                                                                  │
│                                                                             │
│   Unless required by applicable law or agreed to in writing, software       │
│   distributed under the License is distributed on an "AS IS" BASIS,         │
│   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
│   See the License for the specific language governing permissions and       │
│   limitations under the License.                                            │
\*───────────────────────────────────────────────────────────────────────────*/
'use strict';


var dustjs = require('dustjs-linkedin'),
    engine = require('adaro'),
    cache = require('./lib/cache'),
    views = require('./lib/view'),
    provider = require('./lib/provider'),
    translator = require('./lib/translator');


function isExpress(obj) {
    return typeof obj === 'function' && obj.handle && obj.set;
}


var proto = {

    getBundle: function (name, locale, callback) {
        this.contentProvider.getBundle(name, locale).load(callback);
    },

    localize: function (name, locale, views, callback) {
        this.templateTranslator.localize(name, locale, views, callback);
    }

};


exports.create = function (app, i18n, specialization) {
    var contentProvider, templateTranslator, ext, current, settings, viewCache, renderer, module;

    if (!isExpress(app)) {
        i18n = app;
        app = undefined;
    }

    i18n.templateRoot = app ? app.get('views') : i18n.templateRoot;
    contentProvider = exports.createProvider(i18n);
    templateTranslator = exports.createTranslator(contentProvider, i18n);

    if (app) {
        ext = app.get('view engine');

        if (views.hasOwnProperty(ext)) {
            // For i18n we silently switch to the JS engine for all requests, passing config but disabling cache
            // since we add our own caching layer below. (Clone it first so we don't muck with the original object.)
            current = app.engines['.' + ext];
            settings = (current && current.settings) || {};
            settings.cache = false;

            dustjs.onLoad = views[ext].create(app, templateTranslator);

            if (!!i18n.cache) {
                viewCache = cache.create(dustjs.onLoad, contentProvider.fallbackLocale);
                dustjs.onLoad = viewCache.get.bind(viewCache);
            }

            if (specialization) {
                module = require('karka');
                renderer = module.create(specialization, engine.js(settings)).renderer;
            } else {
                renderer = engine.js(settings);
            }
            app.engine(ext, renderer);
        }
    }

    return Object.create(proto, {

        cache: {
            enumerable: true,
            writable: false,
            value: !!i18n.cache
        },

        contentProvider: {
            enumerable: true,
            writable: false,
            value: contentProvider
        },

        templateTranslator: {
            enumerable: true,
            writable: false,
            value: templateTranslator
        }

    });
};


exports.createTranslator = function (provider, config) {
    return translator.create(provider, (config.templateRoot || config.templatePath));
};


exports.createProvider = function (config) {
    var contentRoot, fallbackLocale, enableMetadata;

    contentRoot = config.contentPath || config.contentRoot;
    fallbackLocale = config.fallback || config.fallbackLocale;
    enableMetadata = config.enableMetadata || config.enableHtmlMetadata;

    return provider.create(contentRoot, fallbackLocale, config.cache, enableMetadata);
};
