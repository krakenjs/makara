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
    dustjs = require('dustjs-linkedin'),
    translator = require('../translator');


exports.create = function (app, translator) {
    return function onLoad(name, context, callback) {
        var global, locals, locality, views;

        global = context.global;
        locals = context.get('context');
        locality = locals && locals.locality;
        views = global.views || (global.settings && global.settings.views);

        translator.localize(name, locality, views, function (err, data) {
            var compiledDustjs;
            if (err) {
                callback(err);
                return;
            }
            try {
                compiledDustjs = dustjs.compile(data, name);
            } catch (e) {
                callback(e);
                return;
            }
            callback(null, compiledDustjs);
        });
    };
};

