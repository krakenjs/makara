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
