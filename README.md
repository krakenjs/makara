#### Makara

Load content bundles from a specific location. Optionally, decorate an express app to consume pre-locaized templates,
or localize templates on-the-fly. A summary content property files and their use is also covered here.


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
So if I have a top level index.dust file, its content .properties filew will be at locales/US/en/index.properties
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
If you have runtime values to be inserted, use braces to select the value
from the dust template context as in the index.greeting line. This works because
the content strings are inlined into your template during the build process so references
like {userName} are simply handled by dust.`

In addition to simple strings, we support lists (e.g, indexable list of messages) and
maps (content indexable collection of messages). So the index.ccList above might
be used to provide a list of values to go in a list of allowed credit cards.
The index.states might be used to populate a dropdown list of states with the
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
For example, if you need to pass the list as a parameter to an exiting
UVL core component like Dropdown. 

For this, you use the @provide helper from the dusthelpers-supplement
module plus @pre with a mode="paired" attribute. 
Details on @provide are in the README at https://github.paypal.com/CoreUIE/dusthelpers-supplement. 
An example, showing passing a list of months using @pre is:
json
````
{@provide}
	{>"dropdown"
		fieldName="expirationMonth"
		fieldLabel="{@pre type="content" key="creditOrDebitCard.monthLabel"/}"
		id="expirationMonth_{fiId}"
		className="expirationMonth pull-left medium"
		lap="true"
		optionList=monthList
		optionSelected="{expirationMonth}"
		required="required"
	/}
{:monthList}
{@pre type="content" key="index.months" mode="paired" /}
{/provide}
````

The mode="paired" parameter produces the content list such that you can use both the 
index of the element for the value in an option tag and the value for the displayable text.

The mode="paired" attribute tells delivers the content in the  form of a JSON
object, which in this case might look like:

[{$id:0,$elt:"Jan"}, {$id:1,$elt:"Feb"},.. ]

Core component libraries expect the $id, $elt convention so this is compatible.
@provide will define a parameter named "monthList" (name comes from the {:monthList} block
holding the @pre tag. Then you are free to pass the object as a parameter.

In addition to mode="paired", there is an alternate form, mode="json". This generates the
content list or map as a standard JavaScript array or object with properties. @provide
then adds it to the context, allowing you free access to the content as a list or an object
you can reference into. Note: in an early version of this module, mode="paired" was 
called mode="json" but that changed with version 0.2.0. If you used mode="json" prior to
0.2.0, a global edit to mode="paired" should be done.

An interesting use case is when you need to dynamically choose an entry from a map and use
fields belonging to the entry. For example, you have a set of content strings data for
a number of different banks (e.g. HSBC, BofA, etc) and you want to dynamically get the
messages appropriate to the customer's bank from the content.

The following object is easily described using map format with a .properties file:
````
"bankRules": {
   "Banorte": {
       "bankInfoText":"Payment concept",
       "bankInfoRefText":"Reference number",
       "transferText":"Transfers"
   },
   "HSBC": {
       "bankInfoText":"Payment concept",
       "bankInfoRefText":"numeric reference",
       "transferText":"Transfers to other banks"
   }
}

bankName: "HSBC",
````

Now if the template contains the following you can display the bankInfoText message
for HSBC (note bankName:HSBC in the data model). 

````
{@provide}
BANK RULES: {#bankRules[bankName]}{.bankInfoText}{/bankRules[bankName]}
{:bankRules}
{@pre type="content" key="bankrules" mode="json" /}
{/provide}
````

