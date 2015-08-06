Makara
======

A module to set up internationalization in Kraken and Express.js apps.

`makara` is the more opinionated configuration of its component parts, suitable for dropping into an express application and working with relatively little configuration.

It consists of [bundalo] for loading localized strings for use by application logic, [engine-munger] for controlling the lookup of templates and associated localized strings, and includes [adaro] as a template engine, connecting [dustjs-linkedin] to Express.

There's nothing inherently dust-centric about makara, but it does provide dust template engines as a default.

Lead Maintainer: [Aria Stewart]

[![Build Status]][travis]


Using Makara
------------

Here's a tiny but complete application

```javascript
var express = require('express');
var makara = require('makara');
var path = require('path');

var app = express();

var helpers = [ 'dust-makara-helpers' ];
app.engine('dust', makara.dust({ cache: false, helpers: helpers }));
app.engine('js', makara.js({ cache: true, helpers: helpers }));

app.set('views', path.resolve(__dirname, 'public/templates'));
app.configure('development', function () {
    app.set('view engine', 'dust');
});
app.configure('production', function () {
    app.set('view engine', 'js');
});

app.use(makara({
    i18n: {
        contentPath: path.resolve(__dirname, 'locales'),
        fallback: 'en-US'
    },
    specialization: {
        'oldtemplate': [
            {
                is: 'newtemplate',
                when: {
                    'testmode': 'beta'
                }
            }
        ]
    }
}));

app.get('/path', function (req, res) {
    res.render('localizedtemplate');

    // Or

    makara.getBundler(req).get('contentbundle', function (err, data) {
        // Do something with err and data here
    });
});
```

Configuration
-------------

The middleware that sets up the Express view engine replacement [engine-munger] takes most of the configuration in `makara`. 
* `i18n.contentPath` - `String`, the root to search for content in. Required.
* `i18n.formatPath` - `Function`, a function to convert a locale to a path fragment. Optional, defaults to one that returns `country/language`.
* `i18n.fallback` - `String` or `Object` as [`bcp47`] creates, the locale to use when content isn't found for the locale requested. Required.
* `enableMetadata` - `Boolean`, defaults to `false`. Sets up metadata editing tags for integration with in-place content editing systems.
* `specialization` - `Object`, the specialization rule map, in the form expected by [karka].
* `cache` - `Boolean`, defaults to `false`. Whether the dust engine should cache its views.

Content
-------

Content intended for localization is stored in `.properties` files as simple `key=value` pairs.

These are the files that hold the content strings for the different languages your application supports.

Normally, you are likely to start with a master set of content (likely in English) and the localization process will populate corresponding files for the other languages you will need.

### Placement of `.properties` files

The root of the `.properties` content files is the locales folder at the top level of your project. Under it will be a folder per country (as in `US/`, `DE/`, et cetera).  Below each country folder is one or more language folders (as in `en/`, `de/`).  So `locales/US/en/` will be the likely location for your master set of `.properties` files.

`.properties` files are correlated with the dust templates that use them, by path and name.

If you have a top level `index.dust` file, its content `.properties` file will be at `locales/US/en/index.properties` This holds all the external content strings used by that template. If your template is at `widgets/display.dust` then the content for US English will be at `locales/US/en/widgets/display.properties`.  If you have content you want to share across pages, then you should factor out use of that content into a separate partial and use that partial to achieve
content sharing.

You can override this filename mapping by providing a `formatPath` function to the makara i18n configuration.

### What's in a `.properties` file

The parser for this file format is [spud].

The format is simple: `key=value` with one message per line encoded as UTF-8.  Comments are prefixed with `#`.

Let's look at some samples and then use them to discuss various points.

`index.properties` file:

````
index.title=PayPal Merchant
index.callToAction=Enroll now!
index.greeting=Welcome {userName}

# A list
index.ccList[0]=Visa
index.ccList[1]=Mastercard
index.ccList[2]=Discover

# A map
index.states[AL]=Alabama
index.states[AK]=Alaska
index.states[AZ]=Arizona
index.states[CA]=California
```

We are using the name of the file to start our key on each line. This is strictly a convention that makes the path to the file clear. There's duplication between the two, but it makes debugging easier.

Text to the right of the `=` sign is a simple message string with the text of the message.

If you have runtime values to be inserted, use dust brace to select the value from the dust template context as in the `index.greeting` line. Note that there is no restriction on inserting HTML tags into the messages. They are just another string of characters as far as the content processing is concerned.

In addition to simple strings, we support lists and maps. The `index.ccList` above might be used to provide a list of values to go in a list of allowed credit cards.

The `index.states` might be used to populate a dropdown list of states with the key as the option tag value and the full state name as the visible text.

To support writing the key part in natural languages other than English, all UTF-8 characters are allowed with a few exceptions needed to make the key=value syntax work. The exceptions are:

* No equal sign in key part (e.g. first equal sign starts the value)
* No periods in key part (used to allow keys like a.b.c)
* No square brackets (used for subscript and map key notation)
* May not start with # (Used for comments)

These same general restrictions apply to map key values.  If you need to use characters that are restricted, you can do so using either of these escaping mechanisms:

* `\udddd` - Like JavaScript but only handles the same characters supported by
  this notation in JavaScript
* `\u{dddddd}` - Like JavaScript ES6 notation and handles all possible Unicode
  characters

For example,

```
\u2603=snowman
```

would use the Unicode snowman character for the key name.

### Key Promotion

There are some edge cases worth mentioning:

Case 1:

```
key.subkey=value
key.subkey[property]=value2
```

In this case, `key.subkey` is created originally as a string value but is then
overridden as a map. The original value will be discarded.

Case 2:
```
key.subkey[0]=1
key.subkey[property]=value
```

In this case, `key.subkey` is created originally as a list but is then converted
to a map when the alphanumeric key is added.

### Referencing internationalized content from a dust template

This is done using the `{@message}` helper tag. A sample usage of `@message` is:

```
{@message type="content" key="index.title"/}
```

Lists and maps are bit trickier when it comes to inlining.

There are two approaches available. The first uses three additional attributes on the `@message tag`, `before="xxx"` and `after="yyy"` and `sep="z"`.  When emitting the list elements, each will be prefixed by the "before" string, if there is one, suffixed by the "after" string, if there is one, and separated by the "sep" string, if there is one. With sep, the last element is not followed by the separator. Note that the value `{$idx}` can be used in the before/after attribute strings and it will be replaced by the current iteration count when inlining the lists. Similarly, `{$key}` will be replaced with the current key when inlining a map. No replacement is done in the sep string.

In some cases inlining won't do, even with before/after/sep. For example, if you need to pass the list as a parameter to a templating partial that might implement a dropdown functionality.

For this, `@message` with a `mode="paired"` attribute offers more flexibility.

The `mode="paired"` parameter produces the content list such that you can use both the index of the element for the value in an option tag and the value for the displayable text.

The `mode="paired"` attribute delivers the content in the form of a JSON object, which in the case of a list of months might look like:

```javascript
[{$id:0,$elt:"Jan"}, {$id:1,$elt:"Feb"},.. ]
```

This gives you more ability to work with both the list/map value and the element value in your template.

In addition to `mode="paired"` there is an alternate form, `mode="json"` This generates the content list or map as a standard JavaScript array or an object with properties, respectively.

For more on using the `@provide` helper, see the [advanced helper] docs

Contributing
------------

Please see the [contribution guide]

[engine-munger]: https://github.com/krakenjs/engine-munger
[Aria Stewart]: https://github.com/aredridel
[travis]: https://travis-ci.org/krakenjs/makara
[Build Status]: https://travis-ci.org/krakenjs/makara.svg?branch=master
[`bcp47`]: http://npmjs.org/package/bcp47
[contribution guide]: CONTRIBUTING.md
[@provide]: https://github.com/rragan/dust-motes/tree/master/src/helpers/data/provide
[advanced helper]: ADVANCED.md
[adaro]: https://github.com/krakenjs/adaro
[engine-munger]: https://github.com/krakenjs/engine-munger
[bundalo]: https://github.com/krakenjs/bundalo
[dustjs-linkedin]: http://dustjs.com/
[spud]: https://github.com/krakenjs/spud
[karka]: https://github.com/krakenjs/karka
