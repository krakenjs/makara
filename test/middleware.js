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

var tap = require('tap');
var View = require('../')({});
var makara = require('../');
var express = require('express');
var supertest = require('supertest');
var path = require('path');
var MockReq = require('mock-req');
var MockRes = require('mock-res');

tap.test('first-run middleware', function (t) {
    t.plan(6);

    var app = express();
    var view, afterView;

    app.use(function (req, res, next) {
        view = app.get('view');
        t.ok(view, 'view is available before middleware');
        next();
    });
    app.use(makara({
        i18n: {
            contentPath: path.resolve(__dirname, 'fixtures', 'properties'),
            fallback: 'en-US'
        },
        specialization: {
            'spcl/jekyll': [
                {
                    is: 'spcl/hyde',
                    when: {
                        'whoAmI': 'badGuy'
                    }
                }
            ]
        }
    }));
    app.use(function (req, res, next) {
        afterView = app.get('view');
        t.ok(afterView, 'view is available after middleware');
        next();
    });
    app.get('/', function (req, res) {
        res.end('got it');
    });

    app.get('/bundle', function (req, res, next) {
        makara.getBundler(req).get('test', {}, function (err, str) {
            if (err) {
                return next(err);
            } else {
                res.json(str);
            }
        });
    });

    var agent = supertest(app);

    t.test('simple call', function (st) {
        agent.get('/').end(function (err, res) {
            st.error(err);
            st.ok(res, 'got response');
            st.notEqual(afterView, view, 'view was changed by middleware');
            st.end();
        });
    });

    t.test('bundler', function (st) {
        agent.get('/bundle').end(function (err, res) {
            st.error(err);
            st.equal(res.body.test, 'test', 'looked up test content value');
            st.end();
        });

        st.throws(function () {
            makara.getBundler({not: 'a request'});
        });
    });

});

tap.test('app.render', function (t) {
    var app = express();

    var middleware = makara({
        i18n: {
            contentPath: path.resolve(__dirname, 'fixtures', 'properties'),
            fallback: 'en-US'
        },
        specialization: {
            'spcl/jekyll': [
                {
                    is: 'spcl/hyde',
                    when: {
                        'whoAmI': 'badGuy'
                    }
                }
            ]
        }
    });

    var req = new MockReq();
    var res = new MockRes();
    req.app = app;

    middleware(req, res, function () { // Call the middleware so we get initialized.
        app.engine('dust', makara.dust({ cache: false, helpers: [ 'dust-makara-helpers' ]}));

        app.set('views', path.resolve(__dirname, 'fixtures/templates'));

        app.render('test.dust', { locale: 'en-US' }, function (err, content) {
            t.error(err);
            t.equal(content, 'Hello, test');
            t.end();
        });
    });
});


tap.test('unconfigured middleware', function (t) {
    var app = express();

    app.use(makara({}));

    app.get('/bundle', function (req, res, next) {
        makara.getBundler(req).get('whatever', {}, function (err, data) {
            t.ok(err);
            t.notOk(data);
            next();
        });

        t.throws(function () {
            makara.getBundler(req).get('whatever');
        }, {
            code: "EMISSINGARG"
        });

        t.throws(function () {
            makara.getBundler(req).get('whatever', function () {});
        }, {
            code: "EINVALIDTYPE"
        });
    });

    supertest(app).get('/bundle').end(function (err, res) {
        t.end();
    });

});

tap.end();
