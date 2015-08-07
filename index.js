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
"use strict";

var makeViewClass = require('engine-munger');

var WeakMap = require('es6-weak-map');
var bundalo = require('bundalo');
var aproba = require('aproba');

var associated = new WeakMap();

module.exports = function setupViewClass(options) {
    var opts = {};
    opts['.properties'] = {};
    opts['.js'] = {};
    opts['.dust'] = {};

    var bundler;

    if (options.i18n) {
        opts['.properties'].root = [].concat(options.i18n.contentPath);
        opts['.properties'].i18n = {
            formatPath: options.i18n.formatPath || formatPath,
            fallback: options.i18n.fallback
        };

        bundler = bundalo({
            contentPath: options.i18n.contentPath
        });
    }

    if (options.specialization) {
        opts['.properties'].specialization = options.specialization;
        opts['.js'].specialization = options.specialization;
        opts['.dust'].specialization = options.specialization;
    }

    var hasConfiguredApp = false;
    return function (req, res, next) {
        if (!hasConfiguredApp) {
            req.app.set('view', makeViewClass(opts));
            hasConfiguredApp = true;
        }

        associated.set(req, {
            get: function (bundle, model, cb) {
                aproba('*OF', arguments);
                if (!bundler) {
                    return cb(new Error('i18n is not configured'));
                } else {
                    return bundler.get({bundle: bundle, locality: req.locale || options.i18n.fallback, model: model}, cb);
                }
            }
        });

        res.on('finish', function () {
            associated.delete(req);
        });

        res.once('error', function (err) {
            associated.delete(req);

            if (res.listeners('error').length === 0) {
                res.emit('error', err);
            }
        });

        next();
    };
};

function getBundler(req) {
    var bundler = associated.get(req);
    if (!bundler) {
        throw new Error("No bundle reader available");
    } else {
        return bundler;
    }
}

function formatPath(locale) {
    if (!locale || !locale.langtag || !locale.langtag.language) {
        var e = new Error("locale must be a bcp47-style object");
        e.code = 'EINVALIDTYPE'
        throw e;
    } else {
        return locale.langtag.region + '/' + locale.langtag.language.language;
    }
}

module.exports.js = require('adaro').js;
module.exports.dust = require('adaro').dust;
module.exports.getBundler = getBundler;
module.exports.formatPath = formatPath;
