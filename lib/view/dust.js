/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
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
            if (err) {
                callback(err);
                return;
            }
            callback(null, dustjs.compile(data, name));
        });
    };
};

//exports.create_old = function (app, config) {
//    var options, translator;
//
//    options = {
//        templateRoot: app.get('views'),
//        contentRoot: config.contentPath,
//        fallbackLocale: config.fallback,
//        enableHTMLMetadata: config.enableMetadata
//    };
//
//    translator = translatorFactory.create(options);
//
//    return function onLoad(name, context, callback) {
//        var global, locals, locality, views;
//
//        global = context.global;
//        locals = context.get('context');
//        locality = locals && locals.locality;
//        views = global.views || (global.settings && global.settings.views);
//
//        translator.localize(name, locality, views, function (err, data) {
//            if (err) {
//                callback(err);
//                return;
//            }
//            callback(null, dustjs.compile(data, name));
//        });
//    };
//};

