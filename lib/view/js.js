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
'use strict';

var path = require('path'),
    fs = require('graceful-fs'),
    resolver = require('../resolver');


var proto = {

    get path() {
        // Unfortunately, since we don't know the actual file to resolve until
        // we get request context (in `render`), we can't say whether it exists or not.
        return true;
    },

    render: function (options, callback) {
        var locals, view, engine;

        locals = options && options.context;
        view = this.resolver.resolve(this.name, locals && locals.locality);

        // This is a bit of a hack to ensure we override `views` for the duration
        // of the rendering lifecycle. Unfortunately, `adaro` and `consolidate`
        // (https://github.com/visionmedia/consolidate.js/blob/407266806f3a713240db2285527de934be7a8019/lib/consolidate.js#L214)
        // check `options.views` but override with `options.settings.views` if available.
        // So, for this rendering task we need to override with the more specific root directory.
        options.settings = Object.create(options.settings);
        options.views = options.settings.views = view.root;

        engine = this.engines['.' + this.defaultEngine];
        engine(view.file, options, callback);
    }

};


function buildCtor(fallback) {

    function View(name, options) {
        this.name = name;
        this.root = options.root;
        this.defaultEngine = options.defaultEngine;
        this.engines = options.engines;
        this.resolver = resolver.create({ root: options.root, ext: this.defaultEngine, fallback: fallback });
    }

    View.prototype = proto;

    return View;

}


exports.create = function (app, translator) {
    var res;

    res = resolver.create({ root: app.get('views'), ext: app.get('view engine'), fallback: translator.fallbackLocale });
    app.set('view', buildCtor(translator.fallbackLocale));

    return function onLoad(name, context, callback) {
        var locals, view;

        locals = context.get('context');
        view = res.resolve(name, locals && locals.locality);

        if (!view.file) {
            callback(new Error('Could not load template ' + name));
            return;
        }

        fs.readFile(view.file, 'utf8', callback);
    };
};