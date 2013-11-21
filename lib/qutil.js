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

var Q = require('q');

/**
 * Generates a promise onFulfilled handler will will apply the given
 * task to all items in the provided Array.
 * @param task a function that returns a promise, which is to be applied to all items in a given list
 * @returns {Function} the promise that is fulfilled when all sub-tasks have been
 */
exports.applyEach = function applyEach(task) {
    return function (items) {
        return Q.all(items.map(task));
    };
};


exports.recursify = function recursify(fn, depth) {

    return function () {

        depth = depth || 0;

        var args = Array.prototype.slice.call(arguments);
        args[fn.length] = depth;

        if (Array.isArray(args[0])) {
            var tasks = args[0].map(function (item) {
                var a = args.slice(0);
                a[0] = item;
                return recursify(fn, depth + 1).apply(null, a);
            });
            return Q.all(tasks);
        }

        return fn.apply(null, args);
    };

};