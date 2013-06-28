'use strict';

var dustjs = require('dustjs-linkedin'),
    engine = require('express-dustjs'),
    cache = require('../cache');

var impls = {
    dust: require('./dust'),
    js: require('./js')
};

exports.init = function (app, config) {
    var ext = app.get('view engine');
    app.engine(ext, engine.js({ cache: false }));

    dustjs.onLoad = impls[ext].create(app, config);
    cache.decorate(dustjs, config);
};