##### v1.0.0 - 20150312

**Breaking changes**
- Update dependencies and pin down dust versions

##### v0.3.3 - 20131218
**Bugs**
- Fix grunt tasks for Windows


##### v0.3.2 - 20131205
**Bugs**
- Handling bad dust syntax gracefully and returning the dust compile error as callback error.

##### v0.3.1 - 20131105
**Features**
- Switch to use graceful-fs for managing larges numbers of files.
- Add `editable` flag to manually override metadata rendering per tag.
- Update dev deps
- Documentation

##### v0.3.0 - 20131002

**Features**
- Now caches template functions instead of compiled template strings.


##### v0.2.0 - 20130919

**Features**
- Redefine old mode=json to mode=paired and add new mode=json that generates true JSON objects

##### v0.1.2 - 20130919

**Bugs**
- Fix issue #18 where missing key attribute crashes process.
- First crack at fixing issue #9 wherein grunt tasks does not use fallback when bundle not found.

**Features**
- Simplify caching.


##### v0.1.1

**Bugs**
- Fix path separator issues for cross-platform grunt tasks.

**Features**
- None
