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
* [ ] fs.mkdir *Work in progress*
* [ ] fs.mkdtemp
* [x] fs.open *TODO: flags other than 'r'*
* [x] fs.read
* [ ] fs.readdir *Work in progress*
* [x] fs.readFile
* [ ] fs.readlink
* [ ] fs.realpath
* [ ] fs.rename
* [ ] fs.rmdir
* [ ] fs.stat
* [ ] fs.symlink
* [ ] fs.truncate
* [ ] fs.unlink *Work in progress*
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