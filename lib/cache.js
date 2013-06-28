'use strict';

var util = require('./util'),
    assert = require('assert');



var cache = {

    get dataProvider() {
        return this._dataProvider;
    },


    set dataProvider(value) {
        this._dataProvider = value;
    },


    get fallback() {
        return this._fallback;
    },


    set fallback(value) {
        this._fallback = value;
    },


    get: function (name, context, callback) {
        var that, subContext, locality, value;

        that = this;
        subContext = (typeof context.get === 'function' && context.get('context')) || context;
        locality = subContext.locality || this._fallback;
        value = this._get(locality.country || '*', locality.language || '*', name);

        if (value !== undefined) {
            callback(null, value);
            return;
        }

        this._dataProvider(name, context, function (err, data) {
            if (err) {
                callback(err);
                return;
            }

            that._set(locality.country, locality.language, name, data);
            callback(null, data);
        });
    },


    reset: function () {
        this._data = Object.create(null);
    },


    _get: function () {
        var value;

        value = this._data;
        Array.prototype.slice.call(arguments).some(function (key) {
            value = value[key] || undefined;
            return !value;
        });

        return value;
    },


    _set: function () {
        var args, keys, value, dest;

        args = Array.prototype.slice.call(arguments);
        keys = args;
        value = args.pop();
        dest = this._data;

        keys.forEach(function (key, idx, arr) {
            if (idx === arr.length - 1) {
                dest[key] = value;
            } else {
                dest = dest[key] || (dest[key] = Object.create(null));
            }
        });
    }
};


exports.create = function (engine, config) {
    assert(engine, 'No Dust.js implementation found.');
    assert(config, 'No configuration found.');

    return Object.create(cache, {
        _data: { writable: true, value: Object.create(null) },
        _dataProvider: { writable: true, value: engine.onLoad },
        _fallback: { writable: true, value: util.parseLangTag(config.fallback) }
    });
};


exports.decorate = function (engine, config) {
    if (config.cache) {
        var instance = exports.create(engine, config);
        engine.onLoad = instance.get.bind(instance);
    }
};