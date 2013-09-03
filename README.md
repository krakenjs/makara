#### dustjs-i18n

Load content bundles from a specific location. Optionally, decorate an express app to consumer pre-locaized templates,
or localize templates on-the-fly.


##### Example

```javascript
var i18n = require('dustjs-i18n');

var provider = i18n.create(config);
provider.getBundle('index', 'en_US', function (err, bundle) {
    var string = bundle.get('key');
});
```


```javascript
var express = require('express'),
    i18n = require('dustjs-i18n'),
    dustjs = require('express-dustjs');


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
These are the files that hold the contnet strings for the different languages your application supports.
Normally you are likely to start with a master set of content (likely in English) and the L10N
process will populate corresponding files for the other languages you will need.

##### Placement of .properties files

The root of the .properties content files is the locales folder at the top level of your
project. Under it will be a folder per country (e.g., US/, DE/,...). Below each country
folder is one or more language folders (e.g. en/). So locales/US/en/ will be the likely
location for your master set of .properties files. 

.properties files are correlated with the dust templates that use them, by name.
So if I have a top level index.dust file, there will be a file at locales/US/en/index.properties
holding the external content strings used by that template. If your template is at
widgets/display.dust then the content will be at locales/US/en/widgets/display.properties. 

##### What's in a .properties file

The format is simple: key=value with one message per line coded in UTF-8.
Comments are prefix with # and may be used for metadata annotations.

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

We are using the name of the file to start our key on each line. This provides a 
form of namespacing. Simple message strings just have the text of the message.
If you have runtime values to be inserted, use braces to select the value
from the dust template context as in the index.greeting line.

In addition to simple strings, we support lists (e.g, indexable list of message) and
maps (content indexable collection of messages). So the index.ccList above might
be used to provide a list of values to go in a list of allowed credit cards.
The index.states might be used to populate a dropdown list of states with they
key as the option tag value and the full state name as the visible text.


There are some edge cases which we won't go into here but you can find the
gory details at:
https://confluence.paypal.com/cnfl/display/UIEArch/.properties+content+format

##### How do I reference content in a dust template?

This is done using the {@pre} helper tag. Unlike other dust helper tags, the
@pre tag is expanded inline in your template during build time. A copy of the
template is generated for each locale you support and the build inserts the
content appropriate to each locale. The result is a template per locale
with the messages for that locale.

A sample usage of @pre might be:

<h1>{@pre type="content" key="index.title"/}</h1>

Lists and maps are bit more problematic when it comes to inlining.
There are two approaches available. The first uses three additional
attributes on the @pre tag, before="xxx" and after="yyy" and  sep="z".
When emitting the list elements, each will be prefixed by the before
string, if there is one, suffixed by the after string, if there is one,
and separated by the sep string, if there is one. With sep, the last
element is not followed by it.

However, in some cases inlining won't do, even with before/after/sep.
For example, if you need to pass the list as a parameter to partial.

For this, you use the @provide helper from the dusthelpers-supplement
module (https://github.paypal.com/CoreUIE/dusthelpers-supplement). 
Details are in the README there. An example, showing passing a list
of months using @pre is:

````
{@provide selected=chosen}
  <select name="months">
    {#months}
      <option value="{$id}"{@if cond="'{selected}' == '{$id selected="selected"{/if}>{$elt}option>
    {/months}
  </select>
{:months}
  {@pre type="content" key="index.months" mode="json" /}
{/provide}
````

The mode="json" attribute tells @pre to inline the data but in the form of a JSON
object, which in this case might look like:

["Jan", "Feb",...,"Dec"]

@provide then defines a parameter named "months" (name comes from the {:months} block
holding the @pre tag. Then you are free to iterate over the months array values and
mark the selected element accordingly, something you cannot do with just before/after.

Note that the generated JSON for properties element that is a list is:
````
[{$id:0,$elt:"Jan"}, {$id:1,$elt:"Feb"},.. ]
````

and for a map the $id value becomes the key of the map element. This provides compatibility
with the expectation of existing core components and ensures the names don't conflict with
data in your context.

