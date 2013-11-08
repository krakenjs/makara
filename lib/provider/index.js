/***@@@ BEGIN LICENSE @@@***
Copyright (c) 2013, eBay Software Foundation All rights reserved.  Use of the accompanying software, in source and binary forms, is permitted without modification only and provided that the following conditions are met:  Use of source code must retain the above copyright notice, this list of conditions and the following disclaimer.  Use in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.  Neither the name of eBay or its subsidiaries nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.  All rights not expressly granted to the recipient in this license are reserved by the copyright holder.  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***@@@ END LICENSE @@@***/
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