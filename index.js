(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('buffer'), require('stream'), require('node-web-streams-adapter'), require('events'), require('util')) :
	typeof define === 'function' && define.amd ? define(['exports', 'buffer', 'stream', 'node-web-streams-adapter', 'events', 'util'], factory) :
	(factory((global['uwp-fs'] = {}),global.buffer,global.stream,global['node-web-streams-adapter'],global.events,global.util));
}(this, (function (exports,buffer,stream,nodeWebStreamsAdapter,EventEmitter,util) { 'use strict';

EventEmitter = EventEmitter && EventEmitter.hasOwnProperty('default') ? EventEmitter['default'] : EventEmitter;
util = util && util.hasOwnProperty('default') ? util['default'] : util;

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

function getOptions$1(options, defaultOptions = {}) {
	if (options === null || options === undefined || typeof options === 'function')
		return defaultOptions
	if (typeof options === 'string')
		return Object.assign({}, defaultOptions, {encoding: options})
	else if (typeof options === 'object')
		return Object.assign({}, options, defaultOptions)
}

function nullCheck(path, callback) {
	if (('' + path).indexOf('\u0000') === -1)
		return true
	const er = new Error('ERR_INVALID_ARG_TYPE');
	if (typeof callback !== 'function')
		throw er
	process.nextTick(callback, er);
	return false
}
/*
export function nullCheck(path, callback) {
	if (('' + path).indexOf('\u0000') !== -1) {
		const er = new errors.Error('ERR_INVALID_ARG_TYPE', 'path', 'string without null bytes', path)
		if (typeof callback !== 'function')
			throw er
		process.nextTick(callback, er)
		return false
	}
	return true
}
*/

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

function errnoException(error, syscall, path) {
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
function getPathFromURL$1(path) {
	// Strip spaces around and convert all slashes to windows backslashes
	path = path.trim().replace(/\//g, '\\');
	// convert absolute paths to absolute C:\ paths
	if (path.startsWith('\\'))
		path = 'C:' + path;
	else if (!path.includes(':\\'))
		path = exports.cwd + '\\' + path;
	// Normalize the path
	return normalizeArray(path.split(/\\+/g)).join('\\')
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
	var {StorageFolder: StorageFolder$1, StorageFile: StorageFile$1, AccessCache} = Windows.Storage;
}


///////////////////////////////////////////////////////////////////////////////////////////////////
// CACHED STORAGE OBJECTS (OF DRIVES)

var uwpDrives = new Map;
var uwpStorageCache;
if (isUwp) {
	uwpStorageCache = AccessCache.StorageApplicationPermissions.futureAccessList;
}

const warnMessage = `UWP-FS does not have permission to access C:\\.
FS module might not behave as expected.
Use .uwpPickAndCacheDrive() to force user to give you the permission.`;

async function fetchCachedDrives() {
	var folderPromises = uwpStorageCache.entries
		.map(entry => entry.token)
		.map(token => uwpStorageCache.getItemAsync(token));(await Promise.all(folderPromises))
		.filter(isFolderDrive)
		.forEach(drive => {
			var driveLetter = extractDrive(drive.path);
			uwpDrives.set(driveLetter, drive);
			uwpDrives.set(driveLetter.toUpperCase(), drive);
		});
	if (!uwpDrives.has('c')) {
		console.warn(warnMessage);
		setTimeout(() => console.warn(warnMessage), 1000);
	}
}

if (isUwp) {
	readyPromises.push(fetchCachedDrives());
}



///////////////////////////////////////////////////////////////////////////////////////////////////
// PATH RESOLVING


async function openStorageObject(path, syscall) {
	// Sanitize backslashes, normalize format, and turn the path into absolute path.
	path = getPathFromURL$1(path);
	// Go straight to StorageFolder resolution if the path points to a drive.
	if (path.endsWith(':\\'))
		return _openStorageFolder(path, syscall)
	// Get the folder object that corresponds to absolute path in the file system.
	try {
		return await StorageFile$1.getFileFromPathAsync(path)
	} catch(err) {
		if (err.message == UWP_ERR.ENOENT || err.message === UWP_ERR._INCORRECT || err.message === UWP.ERR._UNSUPPORTED) {
			return _openStorageFolder(path, syscall)
		} else {
			throw handleError$1(err, syscall, path)
		}
	}
}


async function _openStorageFolder(path, syscall) {
	// Get the folder object that corresponds to absolute path in the file system.
	try {
		return await StorageFolder$1.getFolderFromPathAsync(path)
	} catch(err) {
		throw handleError$1(err, syscall, path)
	}
}

async function openStorageFolder(path, syscall) {
	// Sanitize backslashes, normalize format, and turn the path into absolute path.
	path = getPathFromURL$1(path);
	// Get the folder object that corresponds to absolute path in the file system.
	try {
		return await StorageFolder$1.getFolderFromPathAsync(path)
	} catch(err) {
		switch (err.message) {
			// The path is incorrect or the file/folder is missing.
			case UWP_ERR.ENOENT:
				throw errnoException('ENOENT', syscall, path)
			// UWP does not have permission to access this scope.
			case UWP_ERR.EACCES:
				throw errnoException('EACCES', syscall, path)
			default:
				var storageFile;
				try {
					storageFile = await StorageFile$1.getFileFromPathAsync(path);
				} catch(e) {
					throw handleError$1(err, syscall, path)
				} 
				throw errnoException('ENOTDIR', syscall, path)
		}
	}
}


async function openStorageFile(path, syscall) {
	// Sanitize backslashes, normalize format, and turn the path into absolute path.
	path = getPathFromURL$1(path);
	// Get the file object that corresponds to absolute path in the file system.
	try {
		return await StorageFile$1.getFileFromPathAsync(path)
	} catch(err) {
		throw handleError$1(err, syscall, path)
	}
}





// Translates UWP errors into Node format (with code, errno and path)
function handleError$1(err, syscall, path, storageObjectType) {
	// Compare UWP error messages with list of known meanings
	switch (err.message) {
		// The path is incorrect or the file/folder is missing.
		case UWP_ERR.ENOENT:
			throw errnoException('ENOENT', syscall, path)
		// UWP does not have permission to access this scope.
		case UWP_ERR.EACCES:
			throw errnoException('EACCES', syscall, path)
		// Incorrect parameter is usually thrown when trying to open folder as file and vice versa.
		/*case UWP_ERR._INCORRECT:
			if (storageObjectType === 'folder') {
				throw errnoException('ENOTDIR', syscall, path)
				break
			}*/
		default:
			throw errnoException(err, syscall, path)
	}
}

if (isUwp) {
	var {StorageFolder, StorageFile} = Windows.Storage;
}

// List of active File Descriptors.
// First three FDs are taken by stdin, stdout, stderr (and are inaccessible in UWP).
// Warning: If process uses more than three basic FDs (like forked process with 'ipc' channel)
//          than the first number of FDs won't match (this module will always start at fd 3)
var fds$1 = [null, null, null];

function findEmpyFd() {
	for (var i = 2; i < fds$1.length; i++)
		if (fds$1[i] === undefined) return i
	return fds$1.length
}

function clearFd(fd) {
	if (fd === fds$1.length - 1)
		fds$1.length--;
	else if (fd < fds$1.length)
		fds$1[fd] = undefined;
}

function reserveFd() {
	var fd = findEmpyFd();
	fds$1[fd] = null;
	return fd
}

// syscall used in: open
async function _open$1(path, fd) {
	// Find empty fd number (slot for next descriptor we are about to open).
	if (fd === undefined)
		fd = reserveFd();
	// Try to get file or folder descriptor for given path and store it to the empty slot.
	fds$1[fd] = await openStorageObject(path, 'open');
	return fd
}
/*
	// Access UWP's File object
	var file = await targetFolder.getFileAsync(fileName)
	// Open file's read stream
	switch
	FileAccessMode.read
	FileAccessMode.readWrite
	var uwpStream = await file.openAsync(FileAccessMode.read)
*/


// syscall used in: close
async function _close(fd) {
	if (typeof fd === 'number') clearFd(fd);
}

// syscall used in: readdir
async function _scandir(path, fd) {
	// Find empty fd number (slot for next descriptor we are about to open).
	if (fd === undefined)
		fd = findEmpyFd();
	// Try to get folder descriptor for given path and store it to the empty slot.
	fds$1[fd] = await openStorageFolder(path, 'scandir');
	return fd
}

// syscall used in: readFile
// NOTE: this does not behave quite like actual Node's read syscall,
//       that is called like so binding.read(this.fd, buffer, offset, length, ...)
//       this merely just ensures proper errors are thrown in places where read syscall is used.
//       Actual reading is solved outside. But it might be worth rewriting and put the readin in here.
async function _read(fd) {
	var storageObject = fds$1[fd];
	if (storageObject.constructor === StorageFolder)
		throw errnoException('EISDIR', 'read')
	return fd
}

/*
// buffer - is the buffer that the data will be written to.
// offset - is the offset in the buffer to start writing at.
// length - is an integer specifying the number of bytes to read.
// position - is an argument specifying where to begin reading from in the file. If position is null, data will be read from the current file position, and the file position will be updated. If position is an integer, the file position will remain unchanged.
export function _read(fd, buffer, offset, length, position) {
	var reader = readers[fd]
	var data = reader.readBytes(nodeBuffer)
	reader.close()
	return nodeBuffer
}

var iBuffer = await FileIO.readBufferAsync(storageFile)
var reader = DataReader.fromBuffer(iBuffer)

var nodeBuffer = Buffer.allocUnsafe(iBuffer.length)

_read(fd, nodeBuffer, 0, iBuffer.length, 0)
*/

async function open(path, flags, mode, callback) {
	// TODO: flags
	// flag 'w' creates empty file
	var fd = reserveFd();
	var syscallPromise = _open$1(path, fd);
	syscallPromise
		.then(fd => callback && callback(null, fd))
		.catch(err => {
			_close(fd);
			if (callback) callback(err);
		});
	return syscallPromise
}

// fs.close
function close(fd, callback) {
	_close(fd);
	if (callback)
		callback(null);
}


/*
Read data from the file specified by 'fd'.
'buffer' is the buffer that the data will be written to.
'offset' is the offset in the buffer to start writing at.
'length' is an integer specifying the number of bytes to read.
'position' is an argument specifying where to begin reading from in the file. If position is null, data will be read from the current file position, and the file position will be updated. If position is an integer, the file position will remain unchanged.
The callback is given the three arguments, '(err, bytesRead, buffer)'.
*/
async function read(fd, buffer$$1, offset, length, position, callback) {
	var storageObject = fds$1[fd];
	//if (callback) callback(null)
}

async function readdir(path, callback) {
	var fd = reserveFd();
	try {
		await _scandir(path, fd);
		var storageFolder = fds$1[fd];
		var result = (await storageFolder.getItemsAsync())
			.map(getNames)
			.sort();
		// Close file descriptor
		await _close(fd);
		if (callback) callback(null, result);
		return result
	} catch(err) {
		// Ensure we're leaving no descriptor open
		await _close(fd);
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

var defaultChunkSize = 1024 * 1024; // 1 MB

function getHighWaterMark(options) {
	// HighWaterMark is limitting how large chunks we can read.
	return options.highWaterMark || options.chunkSize || defaultChunkSize
}

// Creating local variables out of globals so that we can safely use them (in conditions)
// and not throw errors.
var self = typeof self === 'undefined' ? typeof global === 'object' ? global : window : self;
// Node.js APIs
var Blob = self.Blob;
var File = self.File;
var FileReader = self.FileReader;
var ArrayBuffer = self.ArrayBuffer;
var Uint8Array = self.Uint8Array;
var ReadableStream = self.ReadableStream;
var WritableStream = self.WritableStream;

var nextTick = process.nextTick || self.setImediate || sel.setTimeout;

function noop() {}

var isNativeNode = typeof process === 'object' && process.versions.node;

function isTypedArray(arr) {
	return arr instanceof Uint8Array
		|| arr instanceof Uint8ClampedArray
		|| arr instanceof Int8Array
		|| arr instanceof Uint16Array
		|| arr instanceof Int16Array
		|| arr instanceof Uint32Array
		|| arr instanceof Int32Array
		|| arr instanceof Float32Array
		|| arr instanceof Float64Array
}

var originalBufferFrom = buffer.Buffer ? buffer.Buffer.from : undefined;



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// Node.js Buffer ////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function bufferFromTypedArray(array = this) {
	if (array instanceof Uint8Array) {
		return originalBufferFrom(array)
	} else {
		throw new Error('Buffer.fromTypedArray does not implement other types than Uint8Array')
	}
	// TODO
}

function bufferFromArrayBuffer(arrayBuffer = this) {
	if (isNativeNode)
		return originalBufferFrom(new Uint8Array(arrayBuffer))
	else
		return originalBufferFrom(arrayBuffer)
}

// returns promise
function bufferFromBlob(blob = this) {
	return new Promise((resolve, reject) => {
		var reader = new FileReader();
		reader.onload = e => {
			var buffer$$1 = bufferFromArrayBuffer(reader.result);
			resolve(buffer$$1);
		};
		reader.readAsArrayBuffer(blob);
	})
}

// returns promise with the buffer as a callback argument
function bufferFromReadable(stream$$1 = this) {
	return new Promise((resolve, reject) => {
		var chunks = [];
		stream$$1.on('data', data => chunks.push(data));
		stream$$1.on('end', () => resolve(buffer.Buffer.concat(chunks)));
	})
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// Uint8Array ////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////




///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// ArrayBuffer ///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function arrayBufferFromBuffer(buffer$$1 = this) {
	return (new Uint8Array(buffer$$1)).buffer
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// Blob / File ///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class UnderlyingSourceWrapper {

	// Called by instantiatior with new data to be used in stream.
	// Adapter can be used by either Readable or ReadableStream which then call start/pull/cancel
	// on its own from inside, so constructor is the only way we can set up data for those methods.
	constructor(source) {
		this.source = source;
	}

	// Called by the stream from inside to signal that we're starting to read some data into the stream
	// And we can now prepare and instantiate what's needed.
	start(controller) {
		// Size of the read data and current position inside it.
		this.size = this.source.size || Infinity;
		this.offset = 0;
		if (this._start)
			return this._start(controller)
	}

	// Each time we read a chunk from the blob, convert it to buffer and push it to the stream.
	async pull(controller) {
		console.log('pull', this.offset, '/', this.size);
		// End the stream if we reached the end of the blob and this was the last chunk.
		if (this.offset >= this.size)
			return controller.close()
		try {
			// Read chunk from underlying source
			var chunk = await this._pull(controller);
			// bytesRead
			this.offset += chunk.length;
			// Push the read chunk into our stream.
			controller.enqueue(chunk);
		} catch(err) {
			controller.error(err);
		}
	}


	// Handle cancelation of the stream safely by stopping reader.
	cancel(reason) {
		this._cancel(reason);
	}

}




class UnderlyingSinkWrapper {

	constructor(source) {
		console.warn('TO BE IMPLEMENTED: UnderlyingSinkWrapper');
	}

	start(controller) {
	}

	write(chunk, controller) {
	}

	close() {
	}

	abort(reason) {
	}

}

function promisifyFileReader(reader) {
	return new Promise((resolve, reject) => {
		reader.onload = resolve;
		reader.onerror = reject;
		reader.onabort = reject;
	})
}

class FileReaderAdapterFromBlob extends UnderlyingSourceWrapper {
/*
	// By default 
	chunkConvertor(chunk) {
		return new Uint8Array(chunk)
	}
*/
	_start(controller) {
		// Open browser's FileReader class needed for accesing binary data from blob.
		this.reader = new FileReader();
	}

	_cancel(reason) {
		this.reader.abort();
	}

	async _pull({desiredSize}) {
		// Limit the ammount of bytes to read to what the stream is capable of accepting now.
		var bytesToRead = Math.min(this.size - this.offset, desiredSize);
		// Extract the chunk of 'bytesToRead' size, starting at 'offset'.
		var blobChunk = this.source.slice(this.offset, this.offset + bytesToRead);
		// And let reader turn the chunk info ArrayBuffer (onload gets called).
		this.reader.readAsArrayBuffer(blobChunk);
		// Wrap filereader instance into promise that resolves after the chunk is read,
		// after the reader.onload callback is called.
		await promisifyFileReader(this.reader);
		// By default FileReader returns browser's ArrayBuffer that we need to convert to node Buffer.
		return this.reader.result
	}

}

class ReadableFileReaderAdapterFromBlob extends FileReaderAdapterFromBlob {
	async _pull(controller) {
		return new buffer.Buffer.from(await super._pull(controller))
	}
}
function readableFromBlob(blob = this, options = {}) {
	var underlyingSource = new ReadableFileReaderAdapterFromBlob(blob);
	return new nodeWebStreamsAdapter.ReadableStreamAdapter(underlyingSource, options)
}

class ReadableStreamFileReaderAdapterFromBlob extends FileReaderAdapterFromBlob {
	async _pull(controller) {
		return new Uint8Array(await super._pull(controller))
	}
}
function readableStreamFromBlob(blob = this, options = {}) {
	var underlyingSource = new ReadableStreamFileReaderAdapterFromBlob(blob);
	return new ReadableStream(underlyingSource, options)
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// Node.js stream.Readable ///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Unversal instantiator of Node.js stream.Readable class from anything thrown at it
function readableFrom(input, ...args) {
	if (buffer.Buffer.isBuffer(input)) {
		return readableFromBuffer(input)
	} else if (Array.isArray(input) || typeof input === 'string') {
		return readableFromBuffer(originalBufferFrom(input))
	} else if (isTypedArray(input)) {
		return readableFromTypedArray(input)
	} else if (input instanceof ArrayBuffer) {
		return readableFromArrayBuffer(input)
	} else if (input instanceof Blob) {
		return readableFromBlob(input, ...args)
	} else if (input instanceof stream.Readable) {
		return input
	}
}

// TODO: turn this into backpressured stream
function readableFromBuffer(buffer$$1 = this, options = {}) {
	var highWaterMark = getHighWaterMark(options);
	const stream$$1 = new stream.Readable({highWaterMark});
	// We're not reading from any special source so we're not using noop, despite having to define it
	stream$$1._read = noop;
	stream$$1.push(buffer$$1);
	// end the stream
	stream$$1.push(null);
	return stream$$1
}

function readableFromTypedArray(array = this) {
	var buffer$$1 = bufferFromTypedArray(array);
	return readableFromBuffer(buffer$$1)
}

function readableFromArrayBuffer(arrayBuffer) {
	var buffer$$1 = bufferFromArrayBuffer(arrayBuffer);
	return readableFromBuffer(buffer$$1)
}

function readableFromReadableStream(readableStream = this) {
	var readable = new stream.Readable;
	_readableFromReadableStream(readable, readableStream);
	return readable
}
async function _readableFromReadableStream(readable, source) {
	console.warn('TODO: reimplement readableFromReadableStream using adapters');
	// TODO backpressure
	readable._read = function () {};
	var reader = source.getReader();
	while (true) {
		let {value, done} = await reader.read();
		/// NOTE: valus is probably Uint8Array and needs to be converted to buffer
		let chunk = new Uint8Array(value);
		readable.push(chunk);
		if (done) break
	}
	readable.push(null);
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// WHATWG ReadableStream /////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Unversal instantiator of WHATWG ReadableStream class from anything thrown at it
function readableStreamFrom(input, ...args) {
	/*if (Buffer.isBuffer(input)) {
	} else if (Array.isArray(input) || typeof input === 'string') {
	} else if (isTypedArray(input)) {
	} else if (input instanceof ArrayBuffer) {
	} else */if (input instanceof Blob) {
		return readableStreamFromBlob(input, ...args)
	}
}

function readableStreamFromBuffer(buffer$$1 = this, options = {}) {
	console.warn('TODO: reimplement readableStreamFromBuffer using BYOB');
	// If options is not an object, it was probably used inside .map() which supplies two arguments
	if (typeof options !== 'object') options = {};
	var offset = 0;
	var highWaterMark = getHighWaterMark(options);
	//var queuingStrategy = new CountQueuingStrategy({highWaterMark})
	// Create instance of the stream
	return new ReadableStream({
		pull(controller) {
			// Only read chunk of desired ammount of bytes from the whole file/blob
            // NOTE: controller.desiredSize is never larger than highWaterMark
			var bytesToRead = Math.min(size - offset, controller.desiredSize);
			// Extract the chunk of 'bytesToRead' size, starting at 'offset'.
			var chunk = buffer$$1.slice(offset, offset + bytesToRead);
			offset += bytesToRead;
			controller.enqueue(chunk);
			if (offset >= size)
				controller.close();
		},
	}, {highWaterMark})
	//}, queuingStrategy)
}

function readableStreamFromTypedArray(array = this) {
	// TODO
	console.warn('readableStreamFromTypedArray not implemented yet');
}

function readableStreamFromArrayBuffer(arrayBuffer = this) {
	// TODO
	console.warn('readableStreamFromArrayBuffer not implemented yet');
}

function readableStreamFromReadable(readable = this) {
	// TODO
	console.warn('readableStreamFromReadable not implemented yet');
}

if (typeof Windows === 'object') {
	var {DataReader: DataReader$1, DataWriter: DataWriter$1, InputStreamOptions} = Windows.Storage.Streams;
}





class UwpStreamSource extends UnderlyingSourceWrapper {

	// Allocates enough space in newly created chunk buffer.
	alloc(size) {
		return new Uint8Array(size)
	}

	_start(controller) {
		// Instantiate UWP DataReader from the input stream
		this.reader = new DataReader$1(this.source);
		// Makes the stream available for reading (loadAsync) whenever there are any data,
		// no matter how much. Without it, the reader would wait for all of the 'desiredSize'
		// to be in the stream first, before it would let us read it all at once.
		this.reader.inputStreamOptions = InputStreamOptions.partial;
	}

	async _pull({desiredSize}) {
		//
		var bytesRead = await this.reader.loadAsync(desiredSize);
		// Create Buffer of the size that we know is ready for use to read from the stream.
		var chunk = this.alloc(bytesRead);
		// Now read the data from the stream into the chunk buffe we've just created.
		this.reader.readBytes(chunk);
	}

	_cancel(reason) {
		this.reader.close();
	}

}


class UwpStreamSink extends UnderlyingSinkWrapper {

	// Allocates enough space in newly created chunk buffer.
	alloc(size) {
		return new Uint8Array(size)
	}

	_start(controller) {
		// Instantiate UWP DataReader from the input stream
		this.reader = new DataReader$1(this.source);
		// Makes the stream available for reading (loadAsync) whenever there are any data,
		// no matter how much. Without it, the reader would wait for all of the 'desiredSize'
		// to be in the stream first, before it would let us read it all at once.
		this.reader.inputStreamOptions = InputStreamOptions.partial;
	}

	async _pull({desiredSize}) {
		//
		var bytesRead = await this.reader.loadAsync(desiredSize);
		// Create Buffer of the size that we know is ready for use to read from the stream.
		var chunk = this.alloc(bytesRead);
		// Now read the data from the stream into the chunk buffe we've just created.
		this.reader.readBytes(chunk);
	}

	_cancel(reason) {
		this.reader.close();
	}

}


function readableFromUwpStream(uwpStream = this, options = {}) {
	var underlyingSource = new UwpStreamSource(uwpStream);
	underlyingSource.alloc = size => buffer.Buffer.allocUnsafe(size);
	return new nodeWebStreamsAdapter.ReadableStreamAdapter(underlyingSource, options)
}

function readableStreamFromUwpStream(uwpStream = this, options = {}) {
	var underlyingSource = new UwpStreamSource(uwpStream);
	underlyingSource.alloc = size => new Uint8Array(size);
	return new ReadableStream(underlyingSource, options)
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



function bufferFromIbuffer(iBuffer) {
	// Note this is not a custom extension of DataReader class but builtin method
	// that accepts UWP IBuffer.
	var reader = DataReader$1.fromBuffer(iBuffer);
	var byteSize = reader.unconsumedBufferLength;
	var nodeBuffer = buffer.Buffer.allocUnsafe(byteSize);
	var data = reader.readBytes(nodeBuffer);
	reader.close();
	return nodeBuffer
}

if (stream.Readable) {
	// Statics
	stream.Readable.from               = readableFrom;
	stream.Readable.fromBuffer         = readableFromBuffer;
	stream.Readable.fromTypedArray     = readableFromTypedArray;
	stream.Readable.fromArrayBuffer    = readableFromArrayBuffer;
	stream.Readable.fromFile           = readableFromBlob;
	stream.Readable.fromBlob           = readableFromBlob;
	stream.Readable.fromReadableStream = readableFromReadableStream;
	// Instance methods
	stream.Readable.prototype.toBuffer = bufferFromReadable;
}

// Node.js stream.Writable
if (stream.Writable) {
}

// WHATWG ReadableStream
if (ReadableStream) {
	ReadableStream.from            = readableStreamFrom;
	ReadableStream.fromBuffer      = readableStreamFromBuffer; // TODO
	ReadableStream.fromTypedArray  = readableStreamFromTypedArray; // TODO
	ReadableStream.fromArrayBuffer = readableStreamFromArrayBuffer; // TODO
	ReadableStream.fromFile        = readableStreamFromBlob;
	ReadableStream.fromBlob        = readableStreamFromBlob;
	ReadableStream.fromReadable    = readableStreamFromReadable; // TODO
	// Instance methods
	ReadableStream.prototype.toReadable = readableFromReadableStream;
}

// WHATWG WritableStream
if (WritableStream) {
}

if (buffer.Buffer) {
	// Statics
	buffer.Buffer.fromReadable     = bufferFromReadable;
	buffer.Buffer.fromTypedArray   = bufferFromTypedArray;
	buffer.Buffer.fromArrayBuffer  = bufferFromArrayBuffer;
	buffer.Buffer.fromBlob         = bufferFromBlob;
	// Instance methods
	buffer.Buffer.prototype.toReadable       = readableFromBuffer;
	buffer.Buffer.prototype.toReadableStream = readableStreamFromBuffer;
}

if (Uint8Array) {
	// Static
	//Uint8Array.fromBuffer = typedArrayFromBuffer
	// Instance methods
	Uint8Array.prototype.toBuffer         = bufferFromTypedArray;
	Uint8Array.prototype.toReadable       = readableFromTypedArray;
	Uint8Array.prototype.toReadableStream = readableStreamFromTypedArray;
}

if (ArrayBuffer) {
	// Static
	ArrayBuffer.fromBuffer = arrayBufferFromBuffer;
	// Instance methods
	ArrayBuffer.prototype.toBuffer         = bufferFromArrayBuffer;
	ArrayBuffer.prototype.toReadable       = readableFromArrayBuffer;
	ArrayBuffer.prototype.toReadableStream = readableStreamFromArrayBuffer;
}

if (Blob && File) {
	// Static
	// ???
	// Instance methods
	File.prototype.toBuffer =
	Blob.prototype.toBuffer = bufferFromBlob;
	File.prototype.toReadable =
	Blob.prototype.toReadable = function(...args) {
		return readableFromBlob(this, ...args)
	};
	File.prototype.toReadableStream =
	Blob.prototype.toReadableStream = function(...args) {
		return readableStreamFromBlob(this, ...args)
	};
}










///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function promisifyWritable(stream$$1 = this) {
	var promise = new Promise((resolve, reject) => {
		stream$$1.on('close', resolve);
		stream$$1.on('error', reject);
	});
	stream$$1.then = promise.then.bind(promise);
	stream$$1.catch = promise.catch.bind(promise);
	return stream$$1
}

function promisifyReadable(stream$$1 = this) {
	var chunks = [];
	var promise = new Promise((resolve, reject) => {
		stream$$1.on('data', chunk => chunks.push(chunk));
		stream$$1.on('end', () => resolve(buffer.Buffer.concat(chunks)));
		stream$$1.on('error', reject);
	});
	stream$$1.then = promise.then.bind(promise);
	stream$$1.catch = promise.catch.bind(promise);
	return stream$$1
}

if (false) {
	//Duplex.prototype.promisify =
	stream.Writable.prototype.promisify = promisifyWritable;
	//Duplex.prototype.promisify =
	stream.Readable.prototype.promisify = promisifyReadable;
}

function promisify(input) {
	if (input instanceof stream.Writable) {
		return promisifyWritable(input)
	} else if (input instanceof stream.Readable) {
		return promisifyReadable(input)
	}
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
		handleError((this.path = getPathFromURL(path)));
		Object.assign(this, options);
		this.pos = undefined;
		this.bytesRead = 0;

		if (this.start !== undefined) {
			if (typeof this.start !== 'number') {
				throw new errors.TypeError('ERR_INVALID_ARG_TYPE', 'start', 'number', this.start)
			}
			if (this.end === undefined) {
				this.end = Infinity;
			} else if (typeof this.end !== 'number') {
				throw new errors.TypeError('ERR_INVALID_ARG_TYPE', 'end', 'number', this.end)
			}
			if (this.start > this.end) {
				const errVal = `{start: ${this.start}, end: ${this.end}}`;
				throw new errors.RangeError('ERR_VALUE_OUT_OF_RANGE', 'start', '<= "end"', errVal)
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
				// start the flow of data.
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

		// discard the old pool.
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

		// already read everything we were supposed to read!
		// treat as EOF.
		if (toRead <= 0)
			return this.push(null)

		// the actual read.
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

		// move the pool positions, and internal position for reading.
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
		handleError((this.path = getPathFromURL(path)));
		Object.assign(this, options);
		this.pos = undefined;
		this.bytesWritten = 0;

		if (this.start !== undefined) {
			if (typeof this.start !== 'number') {
				throw new errors.TypeError('ERR_INVALID_ARG_TYPE', 'start', 'number', this.start)
			}
			if (this.start < 0) {
				const errVal = `{start: ${this.start}}`;
				throw new errors.RangeError('ERR_VALUE_OUT_OF_RANGE', 'start', '>= 0', errVal)
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
}












function closeFsStream(stream$$1, cb, err) {
	close(stream$$1.fd)
		.catch(() => stream$$1.emit('close'))
		.catch(er => cb(er || err));
}




function createReadStream$1(path) {
	var readable = new stream.Readable;
	_createReadStream(readable, path);
	return readable
}
async function _createReadStream(readable, path) {
	var fd = await _open(path, fd);
	// Access UWP's File object
	var file = fds[fd];
	// Open file's read stream
	var uwpStream = await file.openAsync(FileAccessMode.read);
	// Transform UWP stream indo Node's Readable
	readableFromUwpStream(uwpStream, {readable});
}

/*
export function createReadStream(...args) {
	console.log('createReadStream', ...args)
	var readable = new Readable
	_createReadStream(readable, args)
	return readable
}
export async function _createReadStream(readable, args) {
	var uwpFolder = getFolder(args)
	var [filePath, options] = args
	var [targetFolder, fileName] = await accessUwpFolder(uwpFolder, filePath)
	// Access UWP's File object
	var file = await targetFolder.getFileAsync(fileName)
	// Open file's read stream
	var uwpStream = await file.openAsync(FileAccessMode.read)
	// Transform UWP stream indo Node's Readable
	readableStreamFromUwpStream(uwpStream, {readable})
}
*/

if (isUwp) {
	var {FileIO} = Windows.Storage;
	var {DataReader, DataWriter} = Windows.Storage.Streams;
	var COLLISION = Windows.Storage.CreationCollisionOption;
}

async function readFile(path, encoding, callback) {
	//callback = maybeCallback(callback || options)
	//options = getOptions(options, { flag: 'r' })
	//if (handleError((path = getPathFromURL(path)), callback)) return
	//if (!nullCheck(path, callback)) return
	// encoding is optional
	if (typeof encoding === 'function') {
		callback = encoding;
		encoding = 'utf8';
	}
	var fd = reserveFd();
	try {
		await _open$1(path, fd);
		await _read(fd);
		var storageFile = fds$1[fd];
		var iBuffer = await FileIO.readBufferAsync(storageFile);
		var result = bufferFromIbuffer(iBuffer);
		// Close file descriptor
		await _close(fd);
		if (callback) callback(null, result);
		return result
	} catch(err) {
		// Ensure we're leaving no descriptor open
		await _close(fd);
		if (callback) callback(err);
		throw err
	}
}
/*
export async function readFile(path, encoding, callback) {
	// encoding is optional
	if (typeof encoding === 'function') {
		callback = encoding
		encoding = 'utf8'
	}
	var fd = reserveFd()
	return _readFile(fd, path, encoding)
		.then(result => {
			if (callback) callback(null, result)
			return result
		})
		.catch(err => {
			// Ensure we're leaving no descriptor open
			await _close(fd)
			if (callback) callback(err)
			return err
		})
}
_readFile(fd, path, encoding) {
	await _open(path, fd)
	await _read(fd)
	var storageFile = fds[fd]
	var iBuffer = await FileIO.readBufferAsync(storageFile)
	var result = bufferFromIbuffer(iBuffer)
	// Close file descriptor
	await _close(fd)
	return result
}*/


function isFd(path) {
	return (path >>> 0) === path;
}

async function writeFile(path, data, encoding, callback) {
	callback = maybeCallback(callback || options);
	options = getOptions({encoding: 'utf8', mode: 0o666, flag: 'w'}, options);

	if (isFd(path)) {
		writeFd(path, true);
		return
	}

	fs.open(path, options.flag, options.mode)
		.then(fd => writeFd(fd, false))
		.catch(openErr => callback(openErr));

	function writeFd(fd, isUserFd) {
	}

	//var fd = reserveFd()
	try {
		//fd = await _open(path)
		var storageFile = await targetFolder.createFileAsync(fileName, COLLISION.replaceExisting);
		if (typeof data === 'string') {
			await FileIO.writeTextAsync(storageFile, data);
		} else {
			await FileIO.writeBytesAsync(storageFile, data);
		}
		if (callback) callback(null);
	} catch(err) {
		// Ensure we're leaving no descriptor open
		//await _close(fd)
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
	var {StorageFolder: StorageFolder$2, StorageFile: StorageFile$2, AccessCache: AccessCache$1} = Windows.Storage;
	var {QueryOptions, CommonFileQuery, FolderDepth} = Windows.Storage.Search;
}

//const errors = require('internal/errors');

var errnoException$1 = util && util._errnoException || function(err, syscall, original) {
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

	options = getOptions$1(options, {
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

		_open$1(path).then(async fd => {
			var storageFolder = fds$1[fd];

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



function handleError$2(val, callback) {
	if (val instanceof Error) {
		if (typeof callback === 'function') {
			process.nextTick(callback, val);
			return true
		} else throw val
	}
	return false
}

if (isUwp) {
	var {Pickers} = Windows.Storage;
}

async function uwpPickAndCacheDrive() {
	var folder = await fs.uwpPickFolder();
	if (folder === null) return
	// Filter out ordinary folders because we need full access to the root (drives) to work properly
	// like node APIs do.
	if (!isFolderDrive(folder)) return
	// Application now has read/write access to all contents in the picked folder (including sub-folders)
	var faToken = uwpStorageCache.add(folder);
	return folder
}


// viewMode sets what style the picker should have. Either 'list' or 'thumbnal'
// startLocation sets where the picker should start.
function applyPickerDefaultOptions(args) {
	var [extensions, viewMode, startLocation] = args;
	if (extensions === undefined) extensions = ['*'];
	if (viewMode === undefined) viewMode = 'list';
	if (startLocation === undefined) startLocation = 'desktop';
	return [extensions, viewMode, startLocation]
}

function applyPickerOptions(picker, args) {
	var [extensions, viewMode, startLocation] = applyPickerDefaultOptions(args);
	picker.viewMode = Windows.Storage.Pickers.PickerViewMode[viewMode];
	picker.suggestedStartLocation = Pickers.PickerLocationId[startLocation];
	picker.fileTypeFilter.replaceAll(extensions);
	return picker
}

// Returns UWP StorageFolder
function uwpPickFolder(...args) {
	var picker = new Pickers.FolderPicker();
	applyPickerOptions(picker, args);
	return picker.pickSingleFolderAsync()
}

// Returns UWP StorageFolder
function uwpPickFile(...args) {
	var picker = new Pickers.FileOpenPicker();
	applyPickerOptions(picker, args);
	return picker.pickSingleFileAsync()
}

function uwpPickFileSave(...args) {
	var picker = new Pickers.FileSavePicker();
	var [extensions, viewMode, startLocation] = defaultPickerOptions(args);
	picker.viewMode = Windows.Storage.Pickers.PickerViewMode[viewMode];
}

// TODO
// - WHATWG URL - https://nodejs.org/api/fs.html#fs_whatwg_url_object_support

//import def from './src/index.mjs'
//export default def

exports.uwpSetCwdFolder = uwpSetCwdFolder;
exports.uwpDrives = uwpDrives;
exports.open = open;
exports.close = close;
exports.read = read;
exports.readdir = readdir;
exports.readFile = readFile;
exports.writeFile = writeFile;
exports.createReadStream = createReadStream;
exports.createWriteStream = createWriteStream;
exports.watch = watch;
exports.defaultChunkSize = defaultChunkSize;
exports.originalBufferFrom = originalBufferFrom;
exports.bufferFromTypedArray = bufferFromTypedArray;
exports.bufferFromArrayBuffer = bufferFromArrayBuffer;
exports.bufferFromBlob = bufferFromBlob;
exports.bufferFromReadable = bufferFromReadable;
exports.arrayBufferFromBuffer = arrayBufferFromBuffer;
exports.readableFromBlob = readableFromBlob;
exports.readableStreamFromBlob = readableStreamFromBlob;
exports.readableFrom = readableFrom;
exports.readableFromBuffer = readableFromBuffer;
exports.readableFromTypedArray = readableFromTypedArray;
exports.readableFromArrayBuffer = readableFromArrayBuffer;
exports.readableFromReadableStream = readableFromReadableStream;
exports.readableStreamFrom = readableStreamFrom;
exports.readableStreamFromBuffer = readableStreamFromBuffer;
exports.readableStreamFromTypedArray = readableStreamFromTypedArray;
exports.readableStreamFromArrayBuffer = readableStreamFromArrayBuffer;
exports.readableStreamFromReadable = readableStreamFromReadable;
exports.readableFromUwpStream = readableFromUwpStream;
exports.readableStreamFromUwpStream = readableStreamFromUwpStream;
exports.bufferFromIbuffer = bufferFromIbuffer;
exports.uwpPickAndCacheDrive = uwpPickAndCacheDrive;
exports.uwpPickFolder = uwpPickFolder;
exports.uwpPickFile = uwpPickFile;
exports.uwpPickFileSave = uwpPickFileSave;

Object.defineProperty(exports, '__esModule', { value: true });

})));
