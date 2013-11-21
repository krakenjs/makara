 /*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2013 eBay Software Foundation                                │
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

var util = require('../util'),
    bundle = require('./bundle'),
    metadata = require('./metadata'),
    resolver = require('../resolver');


var proto = {

    get fallbackLocale() {
        return this.bundleResolver.fallbackLocale;
    },

    getBundle: function (name, locale) {
        var content, fileInfo;

        locale = locale ? util.parseLangTag(locale) : this.fallbackLocale;

        content = this._get(locale.country || '*', locale.language || '*', name);
        if (!content) {
            fileInfo = this.bundleResolver.resolve(name, locale);
            content = this._createBundle(fileInfo);
            this._set(locale.country || '*', locale.language || '*', name, content);
        }

        return content;
    },

    _createBundle: function (fileInfo) {
        var content;

        content = bundle.create(fileInfo);
        if (this.htmlMetadataEnabled) {
            content = metadata.decorate(content);
        }

        return content;
    },

    _get: function () {
        var hash;

        if (!this.cache) {
            return undefined;
        }

        hash = util.md5.apply(undefined, arguments);
        return this.bundles[hash];
    },

    _set: function () {
        var args, value, hash;

        args = Array.prototype.slice.call(arguments);
        value = args.pop();

        if (this.cache) {
            hash = util.md5.apply(undefined, args);
            this.bundles[hash] = value;
        }

        return value;
    }
};


exports.create = function (contentRoot, fallbackLocale, cache, enableHtmlMetadata) {

    return Object.create(proto, {

        bundles: {
            enumerable: true,
            writable: false,
            value: Object.create(null)
        },

        bundleResolver: {
            enumerable: true,
            writable: false,
            value: resolver.create({ root: contentRoot, ext: 'properties', fallback: fallbackLocale })
        },

        cache: {
            enumerable: true,
            writable: false,
            value: !!cache
        },

        htmlMetadataEnabled: {
            enumerable: true,
            writable: false,
            value: !!enableHtmlMetadata

        }

    });

};