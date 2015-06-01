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

module.exports = function setupViewClass(options) {
    var opts = {};
    opts['.properties'] = {};
    opts['.js'] = {};
    opts['.dust'] = {};

    if (options.i18n) {
        opts['.properties'].root = [].concat(options.i18n.contentPath);
        opts['.properties'].i18n = {
            fallback: options.i18n.fallback
        };

        opts['.js'].i18n = {
            fallback: options.i18n.fallback
        };
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
        next();
    };
};

module.exports.js = require('adaro').js;
module.exports.dust = require('adaro').dust;
