'use strict';


var dustjs = require('dustjs-linkedin'),
    engine = require('express-dustjs'),
    cache = require('./lib/cache'),
    views = require('./lib/view');


exports.init = function (app, config) {
    var ext, tmplCache;

    // For i18n we silently switch to the JS engine for all requests.
    ext = app.get('view engine');
    app.engine(ext, engine.js({ cache: false }));

    dustjs.onLoad = views[ext].create(app, config);
    if (config.cache) {
        tmplCache = cache.create(dustjs.onLoad, config.fallback);
        dustjs.onLoad = tmplCache.get.bind(tmplCache);
    }
};



