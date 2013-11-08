/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
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


exports.create = function (app, config) {
    var contentProvider, templateTranslator, ext, current, settings, viewCache;

    if (!isExpress(app)) {
        config = app;
        app = undefined;
    }

    config.templateRoot = app ? app.get('views') : config.templateRoot;
    contentProvider = exports.createProvider(config);
    templateTranslator = exports.createTranslator(contentProvider, config);

    if (app) {
        ext = app.get('view engine');

        if (views.hasOwnProperty(ext)) {
            // For i18n we silently switch to the JS engine for all requests, passing config but disabling cache
            // since we add our own caching layer below. (Clone it first so we don't muck with the original object.)
            current = app.engines['.' + ext];
            settings = (current && current.settings) || {};
            settings.cache = false;

            app.engine(ext, engine.js(settings));
            dustjs.onLoad = views[ext].create(app, templateTranslator);

            if (!!config.cache) {
                viewCache = cache.create(dustjs.onLoad, contentProvider.fallbackLocale);
                dustjs.onLoad = viewCache.get.bind(viewCache);
            }
        }
    }

    return Object.create(proto, {

        cache: {
            enumerable: true,
            writable: false,
            value: !!config.cache
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