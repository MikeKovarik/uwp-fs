(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('buffer'), require('stream'), require('events'), require('util')) :
	typeof define === 'function' && define.amd ? define(['exports', 'buffer', 'stream', 'events', 'util'], factory) :
	(factory((global['uwp-fs'] = {}),global.buffer,global.stream,global.events,global.util));
}(this, (function (exports,buffer,stream,EventEmitter,util) { 'use strict';

EventEmitter = EventEmitter && EventEmitter.hasOwnProperty('default') ? EventEmitter['default'] : EventEmitter;
util = util && util.hasOwnProperty('default') ? util['default'] : util;

if (typeof process$1 === 'undefined')
	var process$1 = {};

if (typeof process$1.nextTick === 'undefined')
	//process.nextTick = (fn, ...args) => setTimeout(() => fn(...args))
	process$1.nextTick = (fn, ...args) => {
		console.log('nextTick');
		console.log('fn', fn);
		console.log('args', args);
		setTimeout(() => fn(...args));
	};

var isUwp = typeof Windows !== 'undefined';

var readyPromises = [];
var ready = new Promise(resolve => {
	setTimeout(() => {
		Promise.all(readyPromises).then(resolve);
	});
});

function wrapPromise(promise) {
	return new Promise((resolve, reject) => promise.then(resolve, reject))
}

function callbackify(promiseOrFunction, callback) {
	if (callback === undefined) {
		return (...args) => {
			if (typeof args[args.length - 1] === 'function') 
				return _callbackify(promiseOrFunction(...args), args.pop())
			else
				return _callbackify(promiseOrFunction(...args))
		}
	} else {
		return _callbackify(promiseOrFunction, callback)
	}
}
function _callbackify(promise, callback) {
	if (callback) {
		promise
			.then(data => callback(null, data))
			.catch(err => process$1.nextTick(callback, err));
			//.catch(err => callback(err))
	}
	return promise
}

// Strips drive name from path (creates path relative to the drive)
function stripDrive(path) {
	var index;
	index = path.indexOf(':\\\\');
	if ((index = path.indexOf(':\\\\')) !== -1)
		path = path.substr(index + 3);
	if ((index = path.indexOf(':\\')) !== -1)
		path = path.substr(index + 2);
	return path
}

function extractDrive(path) {
	var index = path.indexOf(':');
	return path.substr(index - 1, index).toLowerCase()
}


// Tests UWP StorageFolder if it's just a random folder or a drive (like C:\)
function isFolderDrive(folder) {
	return folder.name === folder.path && folder.path.endsWith(':\\')
}

// todo investigate deprecation
function getOptions(options, defaultOptions = {}) {
	if (options === null || options === undefined || typeof options === 'function')
		return defaultOptions
	if (typeof options === 'string')
		return Object.assign({}, defaultOptions, {encoding: options})
	else if (typeof options === 'object')
		return Object.assign({}, options, defaultOptions)
}

// todo deprecate
function maybeCallback$1(cb) {
	return typeof cb === 'function' ? cb : rethrow();
}

function nullCheck(path) {
	if (('' + path).indexOf('\u0000') !== -1)
		throw new errors.Error('ERR_INVALID_ARG_TYPE', 'path', 'string without null bytes', path)
}

// refference:
// win: https://github.com/nodejs/node/blob/master/deps/uv/include/uv-errno.h
// unix: https://github.com/nodejs/node/blob/master/deps/npm/node_modules/worker-farm/node_modules/errno/errno.js

// https://nodejs.org/en/blog/release/v9.0.0/

var ERROR = {
	UNKNOWN: {
		errno: -1,
		code: 'UNKNOWN',
		description: 'unknown error'
	},
	UNKNOWN_UWP: {
		errno: -1,
		code: 'UNKNOWN_UWP',
		description: 'unknown uwp error'
	},
	// NOTE: there are two ENOENTs, one with errno -2, second with errno 34 (according to node files)
	//       testing proved that the -2 is used in unix, -4058 in windows, 34 is not.
	ENOENT: {
		errno: -4058, // -2
		code: 'ENOENT',
		description: 'no such file or directory'
	},
	EACCES: {
		errno: -4092, // 3
		code: 'EACCES',
		description: 'permission denied'
	},
	EADDRINUSE: {
		errno: -4091, // 5
		code: 'EADDRINUSE',
		description: 'address already in use'
	},
	EINVAL: {
		errno: -4071, // 18
		code: 'EINVAL',
		description: 'invalid argument'
	},
	ENOTDIR: {
		errno: -4052, // 27
		code: 'ENOTDIR',
		description: 'not a directory'
	},
	EISDIR: {
		errno: -4068, // 28
		code: 'EISDIR',
		description: 'illegal operation on a directory'
	}
};

// todo: rename this because its custom errno function and not the one found in fs
function syscallException(error, syscall, path) {
	if (error instanceof Error) {
		var {errno, code} = ERROR.UNKNOWN_UWP;
		var err = error;
	} else {
		if (typeof error === 'string')
			error = ERROR[error];
		var {errno, code, description} = error;
		var message = `${code}: ${description}, ${syscall}`;
		if (path)
			message += ` '${path}'`;
		var err = new Error(message);
	}
	err.errno = errno;
	err.code = code;
	err.syscall = syscall;
	if (path)
		err.path = path;
	return err
}

var UWP_ERR = {
	ENOENT: 'The system cannot find the file specified.\r\n',
	EACCES: 'Access is denied.\r\n',
	_INCORRECT: 'The parameter is incorrect.\r\n',
	_UNSUPPORTED: 'No such interface supported\r\n',
};

// TODO
var errors$1 = {
	TypeError: makeNodeError(TypeError),
	RangeError: makeNodeError(RangeError),
	Error: makeNodeError(Error),
};

function makeNodeError(Err) {
	// TODO
	return Err
}

;

if (isUwp) {
	
	// Path to local installation of the app.
	// App's source code (what the project includes) is there
	// If sideloaded it's in \bin\Debug\AppX of the folder where the Visual Studio project is.
	// Windows.ApplicationModel.Package.current.installedLocation
	var installFolder = Windows.ApplicationModel.Package.current.installedLocation;

	// Path to %AppData%\Local\Packages\{id}\LocalState
	// It's empty and app's data can be stored there
	// Windows.Storage.ApplicationData.current.localFolder
	var dataFolder = Windows.Storage.ApplicationData.current.localFolder;


	let subPath = location
		.pathname
		.slice(1) // remove first slash
		.split('/') // split into sections by slashes
		.slice(0, -1) // remove the last section (html filename)
		.join('\\'); // join by windows style backslash

	exports.cwd = installFolder.path + '\\' + subPath;

	var cwdFolder;
	var promise = installFolder.getFolderAsync(subPath)
		.then(folder => cwdFolder = folder);
	readyPromises.push(promise); 

}

function uwpSetCwdFolder(newFolder) {
	cwdFolder = newFolder;
}


// Windows filesystem uses \ instead of /. Node tolerates that, but UWP apis
// strictly require only \ or they'll throw error.
// Normalizes path by stripping unnecessary slashes and adding drive letter if needed
function getPathFromURL(path) {
	// Strip spaces around and convert all slashes to windows backslashes
	path = path.trim().replace(/\//g, '\\');
	// convert absolute paths to absolute C:\ paths
	if (path.startsWith('\\'))
		path = 'C:' + path;
	else if (!path.includes(':\\'))
		path = exports.cwd + '\\' + path;
	// Normalize the path
	var normalized = normalizeArray(path.split(/\\+/g)).join('\\');
	if (normalized.endsWith(':'))
		return normalized + '\\'
	else
		return normalized
}

function normalizeArray(parts) {
	var res = [];
	for (var i = 0; i < parts.length; i++) {
		var p = parts[i];
		if (!p || p === '.')
			continue
		if (p === '..') {
			if (res.length && res[res.length - 1] !== '..')
				res.pop();
		} else {
			res.push(p);
		}
	}
	return res
}

if (isUwp) {
	var {StorageFolder: StorageFolder$1, StorageFile: StorageFile$1} = Windows.Storage;
}


async function openStorageObject(path, syscall) {
	// Sanitize backslashes, normalize format, and turn the path into absolute path.
	path = getPathFromURL(path);
	// Go straight to StorageFolder resolution if the path points to a drive.
	if (path.endsWith(':\\'))
		return _openStorageFolder(path, syscall)
	// Get the folder object that corresponds to absolute path in the file system.
	try {
		return await StorageFile$1.getFileFromPathAsync(path)
	} catch(err) {
		if (err.message == UWP_ERR.ENOENT || err.message === UWP_ERR._INCORRECT || err.message === UWP_ERR._UNSUPPORTED) {
			return _openStorageFolder(path, syscall)
		} else {
			throw processError(err, syscall, path)
		}
	}
}


async function _openStorageFolder(path, syscall) {
	// Get the folder object that corresponds to absolute path in the file system.
	try {
		return await StorageFolder$1.getFolderFromPathAsync(path)
	} catch(err) {
		throw processError(err, syscall, path)
	}
}

async function openStorageFolder(path, syscall) {
	// Sanitize backslashes, normalize format, and turn the path into absolute path.
	path = getPathFromURL(path);
	// Get the folder object that corresponds to absolute path in the file system.
	try {
		return await StorageFolder$1.getFolderFromPathAsync(path)
	} catch(err) {
		switch (err.message) {
			// The path is incorrect or the file/folder is missing.
			case UWP_ERR.ENOENT:
				throw syscallException('ENOENT', syscall, path)
			// UWP does not have permission to access this scope.
			case UWP_ERR.EACCES:
				throw syscallException('EACCES', syscall, path)
			default:
				var storageFile;
				try {
					storageFile = await StorageFile$1.getFileFromPathAsync(path);
				} catch(e) {
					throw processError(err, syscall, path)
				} 
				throw syscallException('ENOTDIR', syscall, path)
		}
	}
}


async function openStorageFile(path, syscall) {
	// Sanitize backslashes, normalize format, and turn the path into absolute path.
	path = getPathFromURL(path);
	// Get the file object that corresponds to absolute path in the file system.
	try {
		return await StorageFile$1.getFileFromPathAsync(path)
	} catch(err) {
		throw processError(err, syscall, path)
	}
}





// Translates UWP errors into Node format (with code, errno and path)
function processError(err, syscall, path, storageObjectType) {
	// Compare UWP error messages with list of known meanings
	switch (err.message) {
		// The path is incorrect or the file/folder is missing.
		case UWP_ERR.ENOENT:
			throw syscallException('ENOENT', syscall, path)
		// UWP does not have permission to access this scope.
		case UWP_ERR.EACCES:
			throw syscallException('EACCES', syscall, path)
		// Incorrect parameter is usually thrown when trying to open folder as file and vice versa.
		/*case UWP_ERR._INCORRECT:
			if (storageObjectType === 'folder') {
				throw syscallException('ENOTDIR', syscall, path)
				break
			}*/
		default:
			throw syscallException(err, syscall, path)
	}
}

if (isUwp) {
	var {StorageFolder, StorageFile, FileAccessMode} = Windows.Storage;
	var {DataReader, DataWriter, InputStreamOptions} = Windows.Storage.Streams;
}

// List of active File Descriptors.
// First three FDs are taken by stdin, stdout, stderr (and are inaccessible in UWP).
// Warning: If process uses more than three basic FDs (like forked process with 'ipc' channel)
//          than the first number of FDs won't match (this module will always start at fd 3)
var fds = [null, null, null];

function findEmpyFd() {
	for (var i = 2; i < fds.length; i++)
		if (fds[i] === undefined) return i
	return fds.length
}

function clearFd(fd) {
	if (fd === fds.length - 1)
		fds.length--;
	else if (fd < fds.length)
		fds[fd] = undefined;
}

function reserveFd() {
	var fd = findEmpyFd();
	fds[fd] = null;
	return fd
}



/*
'r'   Open file for reading. An exception occurs if the file does not exist.
'r+'  Open file for reading and writing. An exception occurs if the file does not exist.
'rs+' Open file for reading and writing in synchronous mode. Instructs the operating system to bypass the local file system cache.
'w'   Open file for writing. The file is created (if it does not exist) or truncated (if it exists).
'wx'  Like 'w' but fails if path exists.
'w+'  Open file for reading and writing. The file is created (if it does not exist) or truncated (if it exists).
'wx+' Like 'w+' but fails if path exists.
'a'   Open file for appending. The file is created if it does not exist.
'ax'  Like 'a' but fails if path exists.
'a+'  Open file for reading and appending. The file is created if it does not exist.
'ax+' Like 'a+' but fails if path exists.
*/
var open = callbackify(async (path, flags = 'r', mode = 0o666) => {
	// Create absolute path and check for corrections (it thows proper Node-like error otherwise)
	path = getPathFromURL(path);
	nullCheck(path);
	// Access UWP's File object
	// Note: Not wrapped in try/catching because openStorageObject() returns sanitized Node-like error object.
	var storageObject = await openStorageObject(path, 'open');

	var folder, file, stream$$1, reader, writer;

	if (storageObject.constructor === StorageFolder)
		folder = storageObject;
	if (storageObject.constructor === StorageFile)
		file = storageObject;

	if (file !== undefined) {
		// Open file's read stream
		// TODO: wrap in try/catch and handle errors
		stream$$1 = await storageObject.openAsync(FileAccessMode.read);
		if (!window.iStream)
			window.iStream = stream$$1;
		if (flags.includes('r')) {
			var reader = new DataReader(stream$$1);
			reader.inputStreamOptions = InputStreamOptions.partial;
		}
		if (flags === 'r+')
			writer = 'TODO';
		//FileAccessMode.read
		//FileAccessMode.readWrite
	}

	var fd = reserveFd();
	fds[fd] = {file, folder, storageObject, stream: stream$$1, reader, writer, path};
	return fd
});


var unlink = callbackify(async path => {
});


var mkdir = callbackify(async path => {
});


// syscall used in: readdir
async function _scandir(path, fd) {
	// Find empty fd number (slot for next descriptor we are about to open).
	if (fd === undefined)
		fd = findEmpyFd();
	// Try to get folder descriptor for given path and store it to the empty slot.
	fds[fd] = await openStorageFolder(path, 'scandir');
	return fd
}


/*
Read data from the file specified by 'fd'.
'buffer' is the buffer that the data will be written to.
'offset' is the offset in the buffer to start writing at.
'length' is an integer specifying the number of bytes to read.
'position' is an argument specifying where to begin reading from in the file. If position is null, data will be read from the current file position, and the file position will be updated. If position is an integer, the file position will remain unchanged.
The callback is given the three arguments, '(err, bytesRead, buffer)'.
*/
async function _read(fd, buffer$$1, offset, length, position) {
	// NOTE: Order of these errors matter. Do not change.
	if (buffer$$1 === undefined || !Buffer.isBuffer(buffer$$1))
		throw new errors$1.TypeError('Second argument needs to be a buffer')
	// note: position -1 means don't move to any position, start reading where we left off last time.
	if (position < -1)
		throw syscallException('EINVAL', 'read')
	if (offset < 0 || offset > buffer$$1.length)
		throw new errors$1.Error('Offset is out of bounds')
	if (offset + length > buffer$$1.length)
		throw new errors$1.RangeError('Length extends beyond buffer')
	var {file, folder, stream: stream$$1, reader} = fds[fd];
	if (file === undefined && folder !== undefined)
		throw syscallException('EISDIR', 'read')
	if (position > stream$$1.size)
		return {bytesRead: 0, buffer: buffer$$1}

	// Set position where to begin reading from in the file.
	if (position !== null && position !== -1)
		stream$$1.seek(position);
	// Assess the ammount of bytes we want to read.
	//var bytesToRead = length || stream.size
	var bytesToRead = Math.min(stream$$1.size - position, length);
	// Request to read that ammount of bytes, but but ready to comply to UWP's restictions.
    var bytesRead = await reader.loadAsync(bytesToRead);
	//var bytesRead = reader.unconsumedBufferLength
	var view = buffer$$1.slice(offset, offset + bytesRead);
	//var view = buffer.slice(offset, offset + length)
	//var view = Buffer.allocUnsafe(bytesRead)
	// Now that UWP loaded the bytes for use, we can read them into our buffer.
	reader.readBytes(view);
	return {bytesRead, buffer: buffer$$1}
}
// NOTE: not using callbackify() because Node's fs.read() when wrapped in Node's util.promisify()
//       returns different things.
//       - Callback has error and two arguments (instead of just one): bytesRead, buffer
//       - Promise returns an object with bytesRead and buffer properties: {bytesRead, buffer}
function read(fd, buffer$$1, offset, length, position, callback) {
	var promise = _read(fd, buffer$$1, offset, length, position);
	if (callback) {
		promise
			.then(({bytesRead, buffer: buffer$$1}) => callback(null, bytesRead, buffer$$1))
			.catch(err => callback(err));
	}
	return promise
}
//await storageFolder.CreateFileAsync("sample.txt", Windows.Storage.CreationCollisionOption.ReplaceExisting);


var close = callbackify(async fd => {
	var content = fds[fd];
	if (typeof fd === 'number') clearFd(fd);
	if (!content) return
	var {file, folder, stream: stream$$1, reader, writer} = content;
	// TODO
	if (reader)
		reader.close();
	if (writer)
		writer.close();
	// Note: C# has .Dispose(), JS has .close() variant
	if (stream$$1)
		stream$$1.close();
});


var exists = callbackify(async path => {
	// Create absolute path and check for corrections (it thows proper Node-like error otherwise)
	path = getPathFromURL(path);
	nullCheck(path);
	try {
		await openStorageObject(path);
		return true
	} catch(err) {
		if (err.code !== 'ENOENT')
			throw err
		return false
	}
});



var stat = callbackify(async path => {
	// Create absolute path and check for corrections (it thows proper Node-like error otherwise)
	path = getPathFromURL(path);
	nullCheck(path);
	// Access UWP's File object
	// Note: Not wrapped in try/catching because openStorageObject() returns sanitized Node-like error object.
	var storageObject = await openStorageObject(path, 'stat');
	// Create Stats instance, wait for the hidden ready promise (UWP apis are async) and return it
	var stats = new Stats(storageObject);
	await stats._ready;
	return stats
});

const DATE_ACCESSED = 'System.DateAccessed';

// time "Access Time" - Time when file data last accessed.
// mtime "Modified Time" - Time when file data last modified.
// ctime "Change Time" - Time when file status was last changed
class Stats {

	constructor(storageObject) {
		this.storageObject = storageObject;
		Object.defineProperty(this, '_ready', {
			enumerable: false,
			value: this._collectInfo()
		});
	}

	async _collectInfo() {
		var file = this.storageObject;
		var {dateCreated} = file;
		
		this.birthtime   = dateCreated;
		this.birthtimeMs = dateCreated.valueOf();

		// Get basic properties
		var {size, dateModified} = await file.getBasicPropertiesAsync();
		this.size = size;
		this.mtime   = this.ctime   = dateModified;
		this.mtimeMs = this.ctimeMs = dateModified.valueOf();

		// Get extra properties
		var extraProperties = await file.properties.retrievePropertiesAsync([DATE_ACCESSED])
			.then(data => Object.assign({}, data));

		var dateAccessed = extraProperties[DATE_ACCESSED];
		this.atime   = dateAccessed;
		this.atimeMs = dateAccessed.valueOf();
	}

	isFile() {
		return this.storageObject.constructor === StorageFile
	}

	isDirectory() {
		return this.storageObject.constructor === StorageFolder
	}

	isBlockDevice() {
	}

	isCharacterDevice() {
	}

	isSymbolicLink() {
	}

	isFIFO() {
	}

	isSocket() {
	}


}

async function readdir(path, callback) {
	var fd = reserveFd();
	try {
		await _scandir(path, fd);
		var storageFolder = fds[fd];
		var result = (await storageFolder.getItemsAsync())
			.map(getNames)
			.sort();
		// Close file descriptor
		await close(fd);
		if (callback) callback(null, result);
		return result
	} catch(err) {
		// Ensure we're leaving no descriptor open
		await close(fd);
		if (callback) callback(err);
		throw err
	}
}

async function getList(storageFolder) {
	return (await storageFolder.getItemsAsync())
		.map(getNames)
		.sort()
}

function getNames(storageFile) {
	return storageFile.name
}

var defaultReadStreamOptions = {
	highWaterMark: 64 * 1024,
	fd: null,
	flags: 'r',
	mode: 0o666,
	autoClose: true,
};

var defaultWriteStreamOptions = {
	fd: null,
	flags: 'w',
	mode: 0o666,
	autoClose: true,
};


var pool;

function allocNewPool(poolSize) {
	pool = Buffer.allocUnsafe(poolSize);
	pool.used = 0;
}

class ReadStream extends stream.Readable {

	constructor(path, options = {}) {
		options = Object.assign({}, defaultReadStreamOptions, options);
		super(options);
		this.path = getPathFromURL(path);
		Object.assign(this, options);
		this.pos = undefined;
		this.bytesRead = 0;

		if (this.start !== undefined) {
			if (typeof this.start !== 'number') {
				throw new errors$1.TypeError('ERR_INVALID_ARG_TYPE', 'start', 'number', this.start)
			}
			if (this.end === undefined) {
				this.end = Infinity;
			} else if (typeof this.end !== 'number') {
				throw new errors$1.TypeError('ERR_INVALID_ARG_TYPE', 'end', 'number', this.end)
			}
			if (this.start > this.end) {
				const errVal = `{start: ${this.start}, end: ${this.end}}`;
				throw new errors$1.RangeError('ERR_VALUE_OUT_OF_RANGE', 'start', '<= "end"', errVal)
			}
			this.pos = this.start;
		}

		if (typeof this.fd !== 'number')
			this.open();

		this.on('end', function() {
			if (this.autoClose)
				this.destroy();
		});
	}

	open() {
		open(this.path, this.flags, this.mode)
			.then(fd => {
				this.fd = fd;
				this.emit('open', fd);
				// Start the flow of data.
				this.read();
			})
			.catch(err => {
				if (this.autoClose)
					this.destroy();
				this.emit('error', err);
			});
	}

	_read(n) {
		if (typeof this.fd !== 'number')
			return this.once('open', () => this._read(n))

		if (this.destroyed)
			return

		// Discard the old pool.
		if (!pool || pool.length - pool.used < kMinPoolSpace)
			allocNewPool(this._readableState.highWaterMark);

		// Grab another reference to the pool in the case that while we're
		// in the thread pool another read() finishes up the pool, and
		// allocates a new one.
		var thisPool = pool;
		var toRead = Math.min(pool.length - pool.used, n);
		var start = pool.used;

		if (this.pos !== undefined)
			toRead = Math.min(this.end - this.pos + 1, toRead);

		// Elready read everything we were supposed to read! Treat as EOF.
		if (toRead <= 0)
			return this.push(null)

		// The actual read.
		read(this.fd, pool, pool.used, toRead, this.pos)
			.then(bytesRead => {
				var b = null;
				if (bytesRead > 0) {
					this.bytesRead += bytesRead;
					b = thisPool.slice(start, start + bytesRead);
				}
				this.push(b);
			})
			.catch(er => {
				if (this.autoClose)
					this.destroy();
				this.emit('error', er);
			});

		// Move the pool positions, and internal position for reading.
		if (this.pos !== undefined)
			this.pos += toRead;
		pool.used += toRead;
	}

	_destroy(err, cb) {
		if (this.closed || typeof this.fd !== 'number') {
			if (typeof this.fd !== 'number') {
				this.once('open', closeFsStream.bind(null, this, cb, err));
				return
			}

			return process.nextTick(() => {
				cb(err);
				this.emit('close');
			})
		}
		this.closed = true;
		closeFsStream(this, cb);
		this.fd = null;
	}

}


class WriteStream extends stream.Writable {

	constructor(path, options = {}) {
		options = Object.assign({}, options);
		super(options);
		this.path = getPathFromURL(path);
		Object.assign(this, options);
		this.pos = undefined;
		this.bytesWritten = 0;

		if (this.start !== undefined) {
			if (typeof this.start !== 'number') {
				throw new errors$1.TypeError('ERR_INVALID_ARG_TYPE', 'start', 'number', this.start)
			}
			if (this.start < 0) {
				const errVal = `{start: ${this.start}}`;
				throw new errors$1.RangeError('ERR_VALUE_OUT_OF_RANGE', 'start', '>= 0', errVal)
			}
			this.pos = this.start;
		}

		if (options.encoding)
			this.setDefaultEncoding(options.encoding);

		if (typeof this.fd !== 'number')
			this.open();

		// dispose on finish.
		this.once('finish', function() {
			if (this.autoClose)
				this.destroy();
		});
	}

	// TODO

}









if (ReadStream.prototype.destroy === undefined)
	ReadStream.prototype.destroy = ReadStream.prototype.close;
if (WriteStream.prototype.destroy === undefined)
	WriteStream.prototype.destroy = WriteStream.prototype.end;




function closeFsStream(stream$$1, cb, err) {
	close(stream$$1.fd)
		.catch(() => stream$$1.emit('close'))
		.catch(er => cb(er || err));
}

if (isUwp) {
	var {FileIO} = Windows.Storage;
	var {DataReader: DataReader$1, DataWriter: DataWriter$1} = Windows.Storage.Streams;
	var COLLISION = Windows.Storage.CreationCollisionOption;
}

var readFile = callbackify(async (path, options) => {

	// NOTE: it's really 'flag' and not 'flags' like it's in fs.open
	options = getOptions(options, {encoding: null, flag: 'r'});

	var isUserFd = isFd(path);
	var fd = isUserFd ? path : await open(path, options.flag);

	// Access descriptor to avoid creating an fs.Stats instance for our internal use.
	var {stream: stream$$1} = fds[fd];
	// Get the size of the file (or folder).
	var size = stream$$1 ? stream$$1.size : 0;
	// Throw errors if the size is invalid.
	//if (size === 0)
	//	return Buffer.alloc(0)
	if (size > buffer.kMaxLength) {
		err = new RangeError('File size is greater than possible Buffer: ' + `0x${buffer.kMaxLength.toString(16)} bytes`);
		close(fd);
		throw err
	}

	try {
		// Try to allocate enough memory for the size of the file.
		var buffer$$1 = buffer.Buffer.allocUnsafe(size);
		// Read (repeatedly if needed) the file into previously allocated buffer.
		var offset = 0;
		// Do at least one iteration (even for folders) because read syscall can handle and  fire additional errors.
		do {
			let {bytesRead} = await _read(fd, buffer$$1, offset, size, -1);
			offset += bytesRead;
			// Break the loop in case we're unable to read anything.
			if (bytesRead === 0)
				break
		} while (offset < size)
	} catch (err) {
		// All the errors received here should be already in the Node-like format and we can
		// rethrow them after we safely close the file's fd.
		close(fd);
		throw err
	}

	// File sucessfully read. Close file descriptor and return filled buffer.
	if (!isUserFd)
		await close(fd);

	// TODO: Investigate if some work needs to be done on our side (or if the buffer module handles it)
	if (options.encoding !== null)
		return buffer$$1.toString(options.encoding)
	else
		return buffer$$1

});
/*
export async function readFile(path, encoding, callback) {
	//callback = maybeCallback(callback || options)
	//options = getOptions(options, { flag: 'r' })
	//if (handleError((path = getPathFromURL(path)), callback)) return
	//if (!nullCheck(path, callback)) return
	// encoding is optional
	if (typeof encoding === 'function') {
		callback = encoding
		encoding = 'utf8'
	}
	var fd = reserveFd()
	try {
		await open(path, fd)
		await read(fd)
		var storageFile = fds[fd]
		var iBuffer = await FileIO.readBufferAsync(storageFile)
		var result = bufferFromIbuffer(iBuffer)
		// Close file descriptor
		await close(fd)
		if (callback) callback(null, result)
		return result
	} catch(err) {
		// Ensure we're leaving no descriptor open
		await close(fd)
		if (callback) callback(err)
		throw err
	}
}
*/
/*
export async function readFile(path, encoding, callback) {
	// encoding is optional
	if (typeof encoding === 'function') {
		callback = encoding
		encoding = 'utf8'
	}
	var fd = reserveFd()
	return readFile(fd, path, encoding)
		.then(result => {
			if (callback) callback(null, result)
			return result
		})
		.catch(err => {
			// Ensure we're leaving no descriptor open
			await close(fd)
			if (callback) callback(err)
			return err
		})
}
readFile(fd, path, encoding) {
	await open(path, fd)
	await read(fd)
	var storageFile = fds[fd]
	var iBuffer = await FileIO.readBufferAsync(storageFile)
	var result = bufferFromIbuffer(iBuffer)
	// Close file descriptor
	await close(fd)
	return result
}*/


function isFd(path) {
	return (path >>> 0) === path;
}

async function writeFile(path, data, encoding) {
	callback = maybeCallback(callback || options);
	options = getOptions(options, {encoding: 'utf8', mode: 0o666, flag: 'w'});

	if (isFd(path))
		var fd = path;
	else
		var fd = await fs.open(path, options.flag, options.mode);

	await writeFd(fd, true);

	function writeFd(fd, isUserFd) {
	}

	//var fd = reserveFd()
	try {
		//fd = await open(path)
		var storageFile = await targetFolder.createFileAsync(fileName, COLLISION.replaceExisting);
		if (typeof data === 'string') {
			await FileIO.writeTextAsync(storageFile, data);
		} else {
			await FileIO.writeBytesAsync(storageFile, data);
		}
		if (callback) callback(null);
	} catch(err) {
		// Ensure we're leaving no descriptor open
		//await close(fd)
		if (callback) callback(err);
		throw err
	}
}
/*
fs.writeFile = function(path, data, options, callback) {
  callback = maybeCallback(callback || options);
  options = getOptions(options, { encoding: 'utf8', mode: 0o666, flag: 'w' });
  const flag = options.flag || 'w';

  if (isFd(path)) {
    writeFd(path, true);
    return;
  }

  fs.open(path, flag, options.mode, function(openErr, fd) {
    if (openErr) {
      callback(openErr);
    } else {
      writeFd(fd, false);
    }
  });

  function writeFd(fd, isUserFd) {
    var buffer = isUint8Array(data) ?
      data : Buffer.from('' + data, options.encoding || 'utf8');
    var position = /a/.test(flag) ? null : 0;

    writeAll(fd, isUserFd, buffer, 0, buffer.length, position, callback);
  }
};

*/





function createReadStream(path, options) {
	return new ReadStream(path, options)
}

function createWriteStream(path, options) {
	return new WriteStream(path, options)
}

if (isUwp) {
	var {StorageFolder: StorageFolder$2, StorageFile: StorageFile$2, AccessCache} = Windows.Storage;
	var {QueryOptions, CommonFileQuery, FolderDepth} = Windows.Storage.Search;
}

//const errors = require('internal/errors');

var errnoException = util && util._errnoException || function(err, syscall, original) {
	if (typeof err !== 'number' || err >= 0 || !Number.isSafeInteger(err))
		throw new errors.TypeError('ERR_INVALID_ARG_TYPE', 'err', 'negative number')
	const name = errname(err);
	var message = `${syscall} ${name}`;
	if (original) message += ` ${original}`;
	const e = new Error(message);
	e.code = e.errno = name;
	e.syscall = syscall;
	return e
};


async function watch(path, options, listener) {

	console.warn('watch not implemented properly yet (scoping, order of the events, etc...)');

	//handleError((path = getPathFromURL(path)))
	nullCheck(path);

	if (typeof options === 'function')
		listener = options;

	options = getOptions(options, {
		persistent: true,
		recursive: false,
	});

	const watcher = new FSWatcher();
	watcher.start(path, options.persistent, options.recursive, options.encoding);

	if (listener)
		watcher.on('change', listener);

	return watcher
}



class FSWatcher extends EventEmitter {

	constructor(path) {
		super();
		this._onChange = this._onChange.bind(this);
		this._handle;// = 
		/*this._handle.onchange = function(status, eventType, filename) {
			if (status < 0) {
				self._handle.close()
				const error = !filename ?
					errnoException(status, 'Error watching file for changes:') :
					errnoException(status, `Error watching file ${filename} for changes:`)
				error.filename = filename
				self.emit('error', error)
			} else {
				self.emit('change', eventType, filename)
			}
		}*/
	}

	// 'contentschanged' detail seems to be always null. There is no information about affected items.
	// FFS: changes in subfolder will have to be manual and recursive
	// Note: Node only fires 'rename' and 'change' events.
	// Creating file - 1x 'rename' with new name, 1x 'change' with the name of the file
	// Deleting file - 1x 'rename' with old name
	// Renaming file/folder - 2x 'rename' - one with old name, one with new name.
	// Creating/Deleting/Renaming file inside folder - 1x 'change' with name of the folder
	// Changing content of file - 2x 'change' with the name of the file
	async _onChange() {
		var recursive = true;
		console.log('_onChange');

		//console.log('old', this._oldList)
		var newList = await this.getList();
		//console.log('new', newList)
		console.log('-', symmetricDiff(this._oldList, newList));

		// TODO, non recursive akorat emituje 'change' na slozku pokud se jeji primi childove zmeni
		// jakakoliv zmena hloubeji je ignorovana a zadny 'change' neni.
		function getPathToFile(path) {
			var index = path.lastIndexOf('\\');
			if (index !== -1)
				return path.slice(0, path.lastIndexOf('\\'))
		}

		var changes = [];
		var pathChanges = {};
		// TODO: can't just sort it. the diff has to work on the array simmultaneously, otherwise we're always ending up
		// with name that closer to the end of alphabet as the last emitted rename
		var diff = symmetricDiff(this._oldList, newList).sort();
		//console.log('diff', diff)
		diff.map(filename => {
			// TODO: this still is not ideal
			var path = getPathToFile(filename);
			pathChanges[path] = (pathChanges[path] || 0) + 1;
			return [filename, path]
		})
		.forEach(([filename, path]) => {
			// TODO: this still is not ideal
			var changesInPath = --pathChanges[path];
			if (path) {
				if (recursive)
					this.emit('change', 'rename', filename);
				if (changesInPath === 0)
					this.emit('change', 'change', path);
			} else {
				this.emit('change', 'rename', filename);
			}
		});
		this._oldList = newList;
	}

	async getList() {
		console.log('this._query', this._query);
		var baseLength = this._query.folder.path.length + 1;
		return (await this._query.getItemsAsync())
			.map(so => so.path.slice(baseLength))
			.sort()
	}

	start(path, persistent, recursive, encoding) {
		//handleError((path = getPathFromURL(path)))
		nullCheck(path);

		open(path).then(async fd => {
			var storageFolder = fds[fd];

			var options = new QueryOptions(CommonFileQuery.OrderByName, ['*']);
			options.folderDepth = FolderDepth.deep;

			this._query = storageFolder.createItemQueryWithOptions(options);
			this._oldList = await this.getList();
			console.log(this._oldList);
			this._query.addEventListener('contentschanged', this._onChange);

		}).catch(err => console.log(err));

		/*var err
		if (err) {
			this.close()
			const error = errnoException(err, `watch ${path}`)
			error.filename = path
			throw error
		}*/
	}

	close() {
		this._handle;// = 
	}

}

async function getList$1(storageFolder) {
	return (await storageFolder.getItemsAsync())
		.map(getNames$1)
		.sort()
}

function getNames$1(storageFile) {
	return storageFile.name
}

function symmetricDiff(arr1, arr2) {
	var result = [];
	for (var i = 0; i < arr1.length; i++)
		if (!arr2.includes(arr1[i]))
			result.push(arr1[i]);
	for (i = 0; i < arr2.length; i++)
		if (!arr1.includes(arr2[i]))
			result.push(arr2[i]);
	return result
}



function handleError(val, callback) {
	if (val instanceof Error) {
		if (typeof callback === 'function') {
			process.nextTick(callback, val);
			return true
		} else throw val
	}
	return false
}

if (isUwp) {
	var {Pickers, AccessCache: AccessCache$1} = Windows.Storage;
	var uwpStorageCache = AccessCache$1.StorageApplicationPermissions.futureAccessList;
/*
	const warnMessage = `UWP-FS does not have permission to access C:\\.
	FS module might not behave as expected.
	Use .uwpPickAndCacheDrive() to force user to give you the permission.`

	async function fetchCachedDrives() {
		var folderPromises = uwpStorageCache.entries
			.map(entry => entry.token)
			.map(token => uwpStorageCache.getItemAsync(token))
		;(await Promise.all(folderPromises))
			.filter(isFolderDrive)
			.forEach(drive => {
				var driveLetter = extractDrive(drive.path)
				uwpDrives.set(driveLetter, drive)
				uwpDrives.set(driveLetter.toUpperCase(), drive)
			})
		if (!uwpDrives.has('c')) {
			console.warn(warnMessage)
			setTimeout(() => console.warn(warnMessage), 1000)
		}
	}*/
}

async function uwpPickAndCacheDrive() {
	var folder = await fs.uwpPickFolder();
	if (folder === null)
		throw new Error(`Folder selection canceled`)
	// Filter out ordinary folders because we need full access to the root (drives) to work properly
	// like node APIs do.
	if (!isFolderDrive(folder))
		throw new Error(`Selected folder is not a drive but just a subfolder '${folder.path}', 'fs' module will not work properly`)
	// Application now has read/write access to all contents in the picked folder (including sub-folders)
	uwpStorageCache.add(folder);
	return folder
}


// viewMode sets what style the picker should have. Either 'list' or 'thumbnal'
// startLocation sets where the picker should start.
function applyPickerOptions(picker, ext = ['*'], mode = 'list', startLoc = 'desktop') {
	picker.viewMode = Windows.Storage.Pickers.PickerViewMode[mode];
	picker.suggestedStartLocation = Pickers.PickerLocationId[startLoc];
	picker.fileTypeFilter.replaceAll(ext);
	return picker
}

// Returns UWP StorageFolder
function uwpPickFolder(...args) {
	var picker = new Pickers.FolderPicker();
	applyPickerOptions(picker, ...args);
	return picker.pickSingleFolderAsync()
}

// Returns UWP StorageFolder
function uwpPickFile(...args) {
	var picker = new Pickers.FileOpenPicker();
	applyPickerOptions(picker, ...args);
	return picker.pickSingleFileAsync()
}

function uwpPickFileSave(...args) {
	var picker = new Pickers.FileSavePicker();
	var [extensions, viewMode, startLocation] = defaultPickerOptions(args);
	picker.viewMode = Windows.Storage.Pickers.PickerViewMode[viewMode];
}

var _internals = {getPathFromURL};


// TODO
// - WHATWG URL - https://nodejs.org/api/fs.html#fs_whatwg_url_object_support

// https://blogs.windows.com/buildingapps/2014/06/19/common-questions-and-answers-about-files-and-app-data-part-1-app-data/#rtHwpGGxeZGTbFF2.97
// https://blogs.windows.com/buildingapps/2014/06/20/common-questions-and-answers-about-files-and-app-data-part-2-files/#ruU7x5z0PYWB7mez.97

//import def from './src/index.mjs'
//export default def

exports._internals = _internals;
exports.open = open;
exports.close = close;
exports.read = read;
exports.stat = stat;
exports.exists = exists;
exports.uwpSetCwdFolder = uwpSetCwdFolder;
exports.readdir = readdir;
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.createReadStream = createReadStream;
exports.createWriteStream = createWriteStream;
exports.watch = watch;
exports.uwpPickAndCacheDrive = uwpPickAndCacheDrive;
exports.uwpPickFolder = uwpPickFolder;
exports.uwpPickFile = uwpPickFile;
exports.uwpPickFileSave = uwpPickFileSave;

Object.defineProperty(exports, '__esModule', { value: true });

})));
