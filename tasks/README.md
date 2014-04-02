## Tasks for pre-localizing dust templates
There are two options for pre-localizing dust templates. See the sections below for the usage for each.

### Using Makara with Grunt
Grunt provides a simple method for registering external tasks with your Gruntfile.

Register the grunt task
```javascript
grunt.loadTasks('./node_modules/makara/tasks/');
```

Configure the task
```javascript
grunt.initConfig({
    makara: {
        files: ['views/**/*.dust'],
        options: {
            contentPath: ['locales/**/*.properties'],
            tmpDir: 'tmp'
        }
    }
});
```

Run grunt:
```
grunt makara
```

### Using Makara with Gulp
Gulp doesn't yet natively support registering tasks in a similar fashion to Grunt, but a convenience
method has been written to help provide similar functionality.

Require the gulp task and setup options
```javascript
var gulp = require('gulp');
var makara_task = require('./node_modules/makara/tasks/dustjs-i18n-gulp')(gulp)

var makara_options = {
    src: 'views/**/*.dust',
    contentPath: 'locales/**/*.properties',
    tmpDir: 'tmp'
};
```

#### Option 1

Register the task
```javascript
makara_task.register(makara_options);
```

#### Option 2

Configure the task manually
```javascript
gulp.task('makara', ['clean:makara-tmp'], function(){
    return makara_task.makaraTask(makara_options);
})
```
This could be useful for specifying task dependencies (like cleaning up before running).


#### Run either task
```
gulp makara
```