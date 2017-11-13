# uwp-fs

📁 Node's `fs` module for Windows UWP apps. Wrapper of `Windows.Storage` APIs.

Windows 10 allows you to write native UWP (Windows store) apps with HTML and JavaScript but the API for manipulation with files is very difficult to use since and the docs is confusing. To read a file you first have to get the right [`StorageFolder`](https://docs.microsoft.com/en-us/uwp/api/windows.storage.storagefolder) and/or [`StorageFile`](https://docs.microsoft.com/en-us/uwp/api/windows.storage.storagefile) objects, that you have to `storageFile.openAsync()` to get an instance of [`(I)RandomAccessStream`](https://docs.microsoft.com/en-us/uwp/api/windows.storage.streams.irandomaccessstream) that needs to be passed into [`DataReader`](https://docs.microsoft.com/en-us/uwp/api/windows.storage.streams.datareader) to then get an [`IBuffer`](https://docs.microsoft.com/en-us/uwp/api/windows.storage.streams.ibuffer) that can be finally converted to something sensible like `String` or `Uint8Array`. And that is only when you've been granted access to directory(ies) after asking user with `FilePicker`. But wait there's also `Windows.Storage.FileIO` namespace and whole lot more... Easy right?

The `Windows.Storage` APIs are hostile and even a simple file-reading can turn into tens of lines of code. That's why this project tries to wrap that into a nice and simple Node.js style `fs` API where you can read the file with just a `fs.readFile('path', (err, data) => console.log(data))` ;). Plus we've got Promises!

`uwp-fs` tries to be 1:1 drop in replacement for `fs`, with all the errors, like `ENOENT`, you've come to love :D

**Work in progress**, contributions welcomed.

## Installation & Usage

### Installation

```
npm install uwp-fs
```

The `uwp-fs` module is bundled into single file (UMD) that will be located in `./node_modules/uwp-fs/index.js`. **Don't forget to include it to your Visual Studio Project**.

Make sure you also include browser versions of `buffer` (and optionally `stream`). These do not come prebundled with `uwp-fs` but are necessary.


### Usage

Just drop in the `uwp-fs/index.js` script along node modules (see Dependencies for more)

``` js
<script src="./path/to/events.js"></script>
<script src="./path/to/buffer.js"></script>
<script src="./path/to/util.js"></script>
<script src="./path/to/stream.js"></script>
<script src="./uwp-fs/index.js"></script>
```

`uwp-fs` is bundled as an UMD module and as such it's exported at `window['uwp-fs']`.


``` js
var fs = window['uwp-fs']
```

### Dependencies

A few Node.js core modules are integral part of `fs`, and thus `uwp-fs`, and are `import`ed/`require`d as a dependency in the source code.

#### Required

* [`buffer`](https://nodejs.org/api/buffer.html). You can use [`buffer`](https://www.npmjs.com/package/buffer) which is an exact port of Node's Buffer for use in browser, built on top of `Uint8Array`/`ArrayBuffer`. It is however not bundled with this module and has to be bundled and/or imported separately alongside this module.
* [`util`](https://nodejs.org/api/util.html): Needed as a peer dependency for `buffer`

#### Optional

Following modules are optional and are not need to be bundled or imported along with `uwp-fs` if you don't intend to methods and classes that require them.

* [`stream`](https://nodejs.org/api/stream.html) module is needed to enable `fs.ReadStream`/`fs.WriteStream` classes and `fs.createWriteStream()`/`fs.createWriteStream()` APIs.
* [`events`](https://nodejs.org/api/events.html)'s `EventEmitter` is needed for `fs.watch` (`FSWatcher`) and `fs.watchFile` (`StatWatcher`).

#### Note

`uwp-fs` comes prebundled as UMD module `index.js`. UMD format makes it get the `buffer` module from `window.buffer` (and its `Buffer` class is at `window.buffer.Buffer`), `stream` from `window.steam` (`window.stream.ReadableStream`, etc...)

Or you can give bundling it yourself a shot. Main file is at `uwp-fs/index.mjs`. It's written with ES Module `import` syntax and does not need to be tanspiled with babel unless you need to support older environments that do not support `async/await`.

### Example



## Supported APIs

Work in progress.

Most of the groundwork for reading is laid. `open`, `read` and `close` syscalls are emulated, enabling `fs.readFile`, `fs.readdir`. Streams and writing is on the way.

* [ ] fs.FSWatcher *Work in progress*
* [ ] fs.ReadStream *Work in progress*
* [ ] fs.WriteStream

* [ ] fs.access
* [ ] fs.appendFile
* [ ] fs.chmod
* [ ] fs.chown
* [x] fs.close *Work in progress*
* [ ] fs.constants
* [ ] fs.copyFile
* [ ] fs.createReadStream *Work in progress*
* [ ] fs.createWriteStream
* [x] fs.exists *deprecated*
* [ ] fs.fchmod
* [ ] fs.fchown
* [ ] fs.fdatasync
* [ ] fs.fstat
* [ ] fs.fsync
* [ ] fs.ftruncate
* [ ] fs.futimes
* [ ] fs.lchmod
* [ ] fs.lchown
* [ ] fs.link
* [ ] fs.lstat
* [x] fs.mkdir
* [ ] fs.mkdtemp
* [x] fs.open *TODO: flags other than 'r'*
* [x] fs.read
* [x] fs.readdir
* [x] fs.readFile
* [ ] fs.readlink
* [ ] fs.realpath
* [ ] fs.rename
* [x] fs.rmdir
* [x] fs.stat *only contains size, file/folder type and times*
* [ ] fs.symlink
* [ ] fs.truncate
* [x] fs.unlink
* [ ] fs.unwatchFile
* [ ] fs.utimes
* [ ] fs.watch *postponed. Initial implementation reveals unreliability of UWP's APIs*
* [ ] fs.watchFile
* [ ] fs.write *Work in progress*
* [ ] fs.writeFile *Work in progress*

## Caveats

Windows UWP applications begin restricted and can only access `installedLocation` (read) and `localFolder` (read and write). To gain access to the whole filesystem, you have to first ask user to give you permissions to access `C:\` or sub/directory that is sufficient for your app. This is done by opening a FilePicker and letting user select folder (or the whole drive). This only has to be done once. `uwp-fs` then stores these folders for you in `AccessCache.StorageApplicationPermissions.futureAccessList` for future access.

Encodings are not part of `uwp-fs`. Those are implemented in `buffer` module and their usage therefore relies on the version of `buffer` used. Utf8 is used in the background for most of the data manipulation.

Please try to use most recent versions of `buffer` and `stream` modules. `uwp-fs` is built on top of latest APIs (and breaking changes) introduced in Node versions 6 (`Buffer.alloc()`, `Buffer.allocUnsafe()`) and Node 8 (`.destroy()` method on streams).

_None of the __*Sync__ (readFileSync, writeFileSync, etc...) APIs are available because UWP does not suppor synchronous file system operations._

APIs that involve symlinks (`fstat`, `lstat`, `stat`, ...) were not properly explored and tested yet. 

## Testing

Testing is done comparatively by running the same tests in both UWP and Node. Log from Node results is saved and UWP is then tested against it. `mouka` module is used to that. `mouka` uses similar API to `mocha` but allows storing test results and then importing and using them for comparison.

## Closing notes

`node_bundles_modules` folder contains couple of prebundled Node modules, that were not written by me, for a sake of the demo application and tests. Namely [`buffer`](https://github.com/feross/buffer) by ferros; Node's `stream`, `events`, `util` bundled with `rolup` and [`rollup-plugin-node-builtins`](https://github.com/calvinmetcalf/rollup-plugin-node-builtins). All credit for these modules goes to their respective authors.
