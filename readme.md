# uwp-fs

📁

## Usage

Node's [`buffer`](https://nodejs.org/api/buffer.html) module is integral part of `fs` and thus `uwp-fs` and is `import`ed/`require`d as a dependency in the source code. You can use [`buffer`](https://www.npmjs.com/package/buffer) which is an exact port of Node's Buffer for use in browser, built on top of `Uint8Array`/`ArrayBuffer`. It is however not bundled with this module and has to be bundled and/or imported separately alongside this module.

Similarly the [`stream`](https://nodejs.org/api/stream.html) module is needed to enable `fs.ReadStream`/`fs.WriteStream` classes and `fs.createWriteStream()`/`fs.createWriteStream()` APIs. This is however optional (and does not need to be bundled/imported) if you don't intend to use those classes and methods.

## Supported APIs

Work in progress.

Most of the groundwork is laid with emulated `open`, `read` and `close` syscalls. `fs.readFile` is starting to shape up.

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
* [ ] fs.watch *Work in progress. Initial implementation reveals unreliability of UWP's APIs*
* [ ] fs.watchFile
* [ ] fs.write *Work in progress*
* [ ] fs.writeFile *Work in progress*

## Caveats

Encodings are not part of `uwp-fs`. Those are implemented in `buffer` module and their usage therefore relies on the version of `buffer` used. Utf8 is used in the background for most of the data manipulation.

Please try to use most recent versions of `buffer` and `stream` modules. `uwp-fs` is built on top of latest APIs (and breaking changes) introduced in Node versions 6 (`Buffer.alloc()`, `Buffer.allocUnsafe()`) and Node 8 (`.destroy()` method on streams).

_None of the __*Sync__ (readFileSync, writeFileSync, etc...) APIs are available because UWP does not suppor synchronous file system operations._

APIs that involve symlinks (`fstat`, `lstat`, `stat`, ...) were not properly explored and tested yet. 

## Testing

Testing is done comparatively by running the same tests in both UWP and Node. Log from Node results is saved and UWP is then tested against it. `mouka` module is used to that. `mouka` uses similar API to `mocha` but allows storing test results and then importing and using them for comparison.
