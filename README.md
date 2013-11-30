#### Makara

Load content bundles from a specific location. Optionally, decorate an express app to consume pre-localized templates,
or localize templates on-the-fly. A summary of content property files and their use is also covered here.


##### Example

```javascript
var i18n = require('makara');

var provider = i18n.create(config);
provider.getBundle('index', 'en_US', function (err, bundle) {
    var string = bundle.get('key');
});
```


```javascript
var express = require('express'),
    i18n = require('makara'),
    dustjs = require('adaro');


var app = express();

app.engine('dust', dustjs.dust({ cache: false }));
app.engine('js', dustjs.js({ cache: false }));

app.set('views', 'path/to/templates');
app.set('view engine', 'dust');
app.set('view cache', false);

// Decorate express app with localized template rendering capabilities.
i18n.create(app, config);
```



##### Configuration

Required
- contentPath (contentRoot) - (String)
- fallback (fallbackLocale) - (String, Object)
- templatePath (templateRoot) - (String)

Optional
- enableMetadata (enableHtmlMetadata) - (boolean, default: false)
- cache - (boolean, default: false)

#### Content

Content intended for localization is stored in .properties files as simple key=value pairs. 
These are the files that hold the content strings for the different languages your application supports.
Normally, you are likely to start with a master set of content (likely in English) and the L10N
process will populate corresponding files for the other languages you will need.

##### Placement of .properties files

The root of the .properties content files is the locales folder at the top level of your
project. Under it will be a folder per country (e.g., US/, DE/,...). Below each country
folder is one or more language folders (e.g. en/). So locales/US/en/ will be the likely
location for your master set of .properties files. 

.properties files are correlated with the dust templates that use them, by path and name.
So if you have a top level index.dust file, its content .properties filew will be at locales/US/en/index.properties
This holds all the external content strings used by that template. If your template is at
widgets/display.dust then the content will be at locales/US/en/widgets/display.properties. If you have
content you want to share across pages, then you should factor out use of that content into a
separate partial and use that partial to achieve content sharing.

##### What's in a .properties file

The format is simple: key=value with one message per line coded in UTF-8.
Comments are prefixed with # and may be used for metadata annotations.

Let's look at some samples and then use them to discuss various points.

index.properties file
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
````

We are using the name of the file to start our key on each line. This is strictly
a convention that makes the path to the file clear. 
The above could have omitted the leading "index." and the results would be the same.
Text to the right of the = sign is a simple message string with the text of the message.
If you have runtime values to be inserted, use dust brace to select the value
from the dust template context as in the index.greeting line. This works because
the content strings are inlined into your template during the build process so references
like {userName} are just handled by dust. Note that there is no restriction on 
inserting HTML tags into the messages. They are just another string of characters
as far as the content processing is concerned.

In addition to simple strings, we support lists (e.g, indexable list of messages) and
maps (content indexable collection of messages). So the index.ccList above might
be used to provide a list of values to go in a list of allowed credit cards.
The index.states might be used to populate a dropdown list of states with the
key as the option tag value and the full state name as the visible text.

To support writing the key part in natural languages other than English, all UTF-8 characters
are allowed with a few exceptions needed to make the key=value syntax work. The
exceptions are:
- No equal sign in key part (e.g. first equal sign starts the value)
- No periods in key part (used to allow keys like a.b.c)
- No square brackets (used for subscript and map key notation)
- May not start with # (Used for comments)

These same general restrictions apply to map key values.  If you need to
use characters that are restricted, you can do so using either of these
escaping mechanisms:
- \udddd - Like JavaScript but only handles the same characters supported by this notation in JavaScript
- \u{dddddd} - Like JavaScript ES6 notation and handles all possible Unicode characters

For example,

\u2603=snowman

would use the Unicode snowman character for the key name.

There are some edge cases worth mentioning:

Case 1:
```
key.subkey=foo
key.subkey[bar]=baz
```

In this case, subkey is created originally as a string value but is then overriden as a map. The original
foo value will be discarded.

Case 2:
```
key.subkey[0]=1
key.subkey[foo]=bar
```

In this case, key.subkey is created originally as a list but is then converted to a map wyhen the alphanumeric key is added.

##### How do I reference content in a dust template?

This is done using the {@pre} helper tag. Unlike other dust helper tags, the
@pre tag is expanded inline in your template during build time. A copy of the
template is generated for each locale you support and the build inserts the
content appropriate to each locale. The result is a template per locale
with the messages for that locale.

A sample usage of @pre might be:

{@pre type="content" key="index.title"/}

Lists and maps are bit trickier when it comes to inlining.
There are two approaches available. The first uses three additional
attributes on the @pre tag, before="xxx" and after="yyy" and  sep="z".
When emitting the list elements, each will be prefixed by the "before"
string, if there is one, suffixed by the "after" string, if there is one,
and separated by the "sep" string, if there is one. With sep, the last
element is not followed by the separator. Note that the value {$idx} can be
used in the before/after attribute strings and it will be replaced by
the current iteration count when inlining the lists. Similarly, {$key}
will be replaced with the current key when inlining a map. No replacement
is done in the sep string.

In some cases inlining won't do, even with before/after/sep.
For example, if you need to pass the list as a parameter to a templating
partial that might implement a Dropdown functionality.

For this, @pre with a mode="paired" attribute offers you more flexibility.

The mode="paired" parameter produces the content list such that you can use both the 
index of the element for the value in an option tag and the value for the displayable text.

The mode="paired" attribute delivers the content in the  form of a JSON
object, which in the case of a list of months might look like:

[{$id:0,$elt:"Jan"}, {$id:1,$elt:"Feb"},.. ]

This gives you more ability to work with both the list/map value and the element value
in your template.

In addition to mode="paired", there is an alternate form, mode="json". This generates the
content list or map as a standard JavaScript array or an object with properties, respectively.



# Contributing

Bugs and new features should be submitted using [Github issues](https://github.com/PayPal/makara/issues/new). Please include with a detailed description and the expected behaviour. If you would like to submit a change yourself do the following steps.

1. Fork it.
2. Create a branch (`git checkout -b fix-for-that-thing`)
3. Commit a failing test (`git commit -am "adds a failing test to demonstrate that thing"`)
3. Commit a fix that makes the test pass (`git commit -am "fixes that thing"`)
4. Push to the branch (`git push origin fix-for-that-thing`)
5. Open a [Pull Request](https://github.com/PayPal/makara/pulls)

Please keep your branch up to date by rebasing upstream changes from master.
