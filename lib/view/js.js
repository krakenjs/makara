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

var fs = require('graceful-fs'),
    path = require('path'),
    resolverFactory = require('../resolver');

exports.create = function (app, translator) {
    var views, resolver, render;

    views = app.get('views');
    resolver = resolverFactory.create({ root: views, ext: 'js', fallback: translator.fallbackLocale });

    if (app.render.name !== 'clobbered') {
        // XXX - This is an awful hack.
        render = app.render;
        app.render = function clobbered(view, options, fn) {
            var locals, templateInfo;

            // Reset root
            app.set('views', views);

            locals = options._locals &&  options._locals.context;
            templateInfo = resolver.resolve(view, locals && locals.locality);

            if (templateInfo.root) {
                // We update the view root *only* for the call to app.render.
                // It only works because the part that resolves the view path is synchronous
                // and once we get past that check our own code can take over.
                app.set('views', templateInfo.root);
            }

            render.apply(this, arguments);
        };
    }

    return function onLoad(name, context, callback) {
        var locals, templateInfo;

        locals = context.get('context');
        templateInfo = resolver.resolve(name, locals && locals.locality);

        if (!templateInfo.file) {
            callback(new Error('Could not load template ' + name));
            return;
        }

        fs.readFile(templateInfo.file, 'utf8', callback);
    };
};