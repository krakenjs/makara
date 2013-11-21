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

var path = require('path'),
    util = require('../util'),
    finder = require('findatag'),
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