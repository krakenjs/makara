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

var path = require('path');

module.exports = function (grunt) {

    var cwd = process.cwd();
    process.chdir(path.resolve(__dirname, '..'));
    grunt.loadNpmTasks('grunt-localizr');
    process.chdir(cwd);


    grunt.registerMultiTask('makara', 'An i18n preprocessor for Dust.js templates.', function () {
        if (grunt.config.get('localizr') && grunt.config.get('makara')) {
            throw new Error("you can't use localizr and makara configurations in the same project. Time to move over to localizr.");
        }

        if (grunt.config.get('makara')) {
            grunt.config.set('localizr', grunt.config.get('makara'));
        }

        return grunt.task.run('localizr');
    });
};
