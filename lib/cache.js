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

            that._set(locality.country || '*', locality.language || '*', name, data);
            callback(null, data);
        });
    },


    reset: function () {
        this._data = Object.create(null);
    },


    _get: function () {
        var hash = util.md5.apply(undefined, arguments);
        return this._data[hash];
    },


    _set: function () {
        var args, value, hash;

        args = Array.prototype.slice.call(arguments);
        value = args.pop();
        hash = util.md5.apply(undefined, args);

        this._data[hash] = value;
    }
};


exports.create = function (provider, fallback) {
    assert(provider, 'No data provider implementation found.');

    return Object.create(cache, {

        _data: {
            writable: true,
            value: Object.create(null)
        },

        _dataProvider: {
            writable: true,
            value: provider
        },

        _fallback: {
            writable: true,
            value: util.parseLangTag(fallback)
        }

    });
};