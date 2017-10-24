(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('stream'), require('buffer'), require('node-web-streams-adapter')) :
	typeof define === 'function' && define.amd ? define(['stream', 'buffer', 'node-web-streams-adapter'], factory) :
	(global['uwp-fs'] = factory(global.stream,global.buffer,global['node-web-streams-adapter']));
}(this, (function (stream,buffer,nodeWebStreamsAdapter) { 'use strict';

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
			resolve(buffer$$1)
		}
		reader.readAsArrayBuffer(blob)
	})
}

// returns promise with the buffer as a callback argument
function bufferFromReadable(stream$$1 = this) {
	return new Promise((resolve, reject) => {
		var chunks = [];
		stream$$1.on('data', data => chunks.push(data))
		stream$$1.on('end', () => resolve(buffer.Buffer.concat(chunks)))
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
		console.warn('TO BE IMPLEMENTED: UnderlyingSinkWrapper')
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
		reader.onload = resolve
		reader.onerror = reject
		reader.onabort = reject
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
		this.reader = new FileReader()
	}

	_cancel(reason) {
		this.reader.abort()
	}

	async _pull({desiredSize}) {
		// Limit the ammount of bytes to read to what the stream is capable of accepting now.
		var bytesToRead = Math.min(this.size - this.offset, desiredSize);
		// Extract the chunk of 'bytesToRead' size, starting at 'offset'.
		var blobChunk = this.source.slice(this.offset, this.offset + bytesToRead);
		// And let reader turn the chunk info ArrayBuffer (onload gets called).
		this.reader.readAsArrayBuffer(blobChunk)
		// Wrap filereader instance into promise that resolves after the chunk is read,
		// after the reader.onload callback is called.
		await promisifyFileReader(this.reader)
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
	stream$$1._read = noop
	stream$$1.push(buffer$$1)
	// end the stream
	stream$$1.push(null)
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
	_readableFromReadableStream(readable, readableStream)
	return readable
}
async function _readableFromReadableStream(readable, source) {
	console.warn('TODO: reimplement readableFromReadableStream using adapters')
	// TODO backpressure
	readable._read = function () {}
	var reader = source.getReader();
	while (true) {
		let {value, done} = await reader.read();
		/// NOTE: valus is probably Uint8Array and needs to be converted to buffer
		let chunk = new Uint8Array(value);
		readable.push(chunk)
		if (done) break
	}
	readable.push(null)
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
	console.warn('TODO: reimplement readableStreamFromBuffer using BYOB')
	// If options is not an object, it was probably used inside .map() which supplies two arguments
	if (typeof options !== 'object') options = {}
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
			offset += bytesToRead
			controller.enqueue(chunk)
			if (offset >= size)
				controller.close()
		},
	}, {highWaterMark})
	//}, queuingStrategy)
}

function readableStreamFromTypedArray(array = this) {
	// TODO
	console.warn('readableStreamFromTypedArray not implemented yet')
}

function readableStreamFromArrayBuffer(arrayBuffer = this) {
	// TODO
	console.warn('readableStreamFromArrayBuffer not implemented yet')
}

function readableStreamFromReadable(readable = this) {
	// TODO
	console.warn('readableStreamFromReadable not implemented yet')
}

if (typeof Windows === 'object') {
	var {DataReader: DataReader$1, DataWriter: DataWriter$1, InputStreamOptions} = Windows.Storage.Streams;
}





class UwpStreamSource extends UnderlyingSourceWrapper {

	// Allocates enough space in newly created chunk buffer.
	chunkAlloc(size) {
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
		var chunk = this.chunkAlloc(bytesRead);
		// Now read the data from the stream into the chunk buffe we've just created.
		this.reader.readBytes(chunk);
	}

	_cancel(reason) {
		this.reader.close();
	}

}


class UwpStreamSink extends UnderlyingSinkWrapper {

	// Allocates enough space in newly created chunk buffer.
	chunkAlloc(size) {
		return new Uint8Array(size)
	}

	_start(controller) {
		// Instantiate UWP DataReader from the input stream
		this.reader = new DataReader$1(this.source)
		// Makes the stream available for reading (loadAsync) whenever there are any data,
		// no matter how much. Without it, the reader would wait for all of the 'desiredSize'
		// to be in the stream first, before it would let us read it all at once.
		this.reader.inputStreamOptions = InputStreamOptions.partial
	}

	async _pull({desiredSize}) {
		//
		var bytesRead = await this.reader.loadAsync(desiredSize);
		// Create Buffer of the size that we know is ready for use to read from the stream.
		var chunk = this.chunkAlloc(bytesRead);
		// Now read the data from the stream into the chunk buffe we've just created.
		this.reader.readBytes(chunk)
	}

	_cancel(reason) {
		this.reader.close()
	}

}


function readableFromUwpStream(uwpStream = this, options = {}) {
	var underlyingSource = new UwpStreamSource(uwpStream);
	underlyingSource.chunkAlloc = size => buffer.Buffer.allocUnsafe(size)
	return new nodeWebStreamsAdapter.ReadableStreamAdapter(underlyingSource, options)
}

function readableStreamFromUwpStream(uwpStream = this, options = {}) {
	var underlyingSource = new UwpStreamSource(uwpStream);
	underlyingSource.chunkAlloc = size => new Uint8Array(size);
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
	stream.Readable.from               = readableFrom
	stream.Readable.fromBuffer         = readableFromBuffer
	stream.Readable.fromTypedArray     = readableFromTypedArray
	stream.Readable.fromArrayBuffer    = readableFromArrayBuffer
	stream.Readable.fromFile           = readableFromBlob
	stream.Readable.fromBlob           = readableFromBlob
	stream.Readable.fromReadableStream = readableFromReadableStream
	// Instance methods
	stream.Readable.prototype.toBuffer = bufferFromReadable
}

// Node.js stream.Writable
if (stream.Writable) {
}

// WHATWG ReadableStream
if (ReadableStream) {
	ReadableStream.from            = readableStreamFrom
	ReadableStream.fromBuffer      = readableStreamFromBuffer // TODO
	ReadableStream.fromTypedArray  = readableStreamFromTypedArray // TODO
	ReadableStream.fromArrayBuffer = readableStreamFromArrayBuffer // TODO
	ReadableStream.fromFile        = readableStreamFromBlob
	ReadableStream.fromBlob        = readableStreamFromBlob
	ReadableStream.fromReadable    = readableStreamFromReadable // TODO
	// Instance methods
	ReadableStream.prototype.toReadable = readableFromReadableStream
}

// WHATWG WritableStream
if (WritableStream) {
}

if (buffer.Buffer) {
	// Statics
	buffer.Buffer.fromReadable     = bufferFromReadable
	buffer.Buffer.fromTypedArray   = bufferFromTypedArray
	buffer.Buffer.fromArrayBuffer  = bufferFromArrayBuffer
	buffer.Buffer.fromBlob         = bufferFromBlob
	// Instance methods
	buffer.Buffer.prototype.toReadable       = readableFromBuffer
	buffer.Buffer.prototype.toReadableStream = readableStreamFromBuffer
}

if (Uint8Array) {
	// Static
	//Uint8Array.fromBuffer = typedArrayFromBuffer
	// Instance methods
	Uint8Array.prototype.toBuffer         = bufferFromTypedArray
	Uint8Array.prototype.toReadable       = readableFromTypedArray
	Uint8Array.prototype.toReadableStream = readableStreamFromTypedArray
}

if (ArrayBuffer) {
	// Static
	ArrayBuffer.fromBuffer = arrayBufferFromBuffer
	// Instance methods
	ArrayBuffer.prototype.toBuffer         = bufferFromArrayBuffer
	ArrayBuffer.prototype.toReadable       = readableFromArrayBuffer
	ArrayBuffer.prototype.toReadableStream = readableStreamFromArrayBuffer
}

if (Blob && File) {
	// Static
	// ???
	// Instance methods
	File.prototype.toBuffer =
	Blob.prototype.toBuffer = bufferFromBlob
	File.prototype.toReadable =
	Blob.prototype.toReadable = function(...args) {
		return readableFromBlob(this, ...args)
	}
	File.prototype.toReadableStream =
	Blob.prototype.toReadableStream = function(...args) {
		return readableStreamFromBlob(this, ...args)
	}
}










///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function promisifyWritable(stream$$1 = this) {
	var promise = new Promise((resolve, reject) => {
		stream$$1.on('close', resolve)
		stream$$1.on('error', reject)
	});
	stream$$1.then = promise.then.bind(promise)
	stream$$1.catch = promise.catch.bind(promise)
	return stream$$1
}

function promisifyReadable(stream$$1 = this) {
	var chunks = [];
	var promise = new Promise((resolve, reject) => {
		stream$$1.on('data', chunk => chunks.push(chunk))
		stream$$1.on('end', () => resolve(buffer.Buffer.concat(chunks)))
		stream$$1.on('error', reject)
	});
	stream$$1.then = promise.then.bind(promise)
	stream$$1.catch = promise.catch.bind(promise)
	return stream$$1
}

if (false) {
	//Duplex.prototype.promisify =
	stream.Writable.prototype.promisify = promisifyWritable
	//Duplex.prototype.promisify =
	stream.Readable.prototype.promisify = promisifyReadable
}

function promisify(input) {
	if (input instanceof stream.Writable) {
		return promisifyWritable(input)
	} else if (input instanceof stream.Readable) {
		return promisifyReadable(input)
	}
}

var defaultFolder;

if (typeof Windows !== 'undefined') {
	var applicationData = Windows.Storage.ApplicationData.current;
	var localFolder = applicationData.localFolder;
	defaultFolder = localFolder
}

function setFolder(newFolder) {
	defaultFolder = newFolder;
}

function getFolder(args) {
	if (typeof args[0] !== 'string')
		return args.shift()
	else
		return defaultFolder
}


async function accessUwpFolder(folder, path, ensure = false) {
	if (path.includes('\\'))
		path = path.replace(/\\/g, '/');
	if (path.includes('/')) {
		if (path.startsWith('/')) 
			path = path.slice(1); // TODO
		else if (path.startsWith('./'))
			path = path.slice(2);
	}
	if (path.includes('/')) {
		var [folderPath, fileName] = splitPath(path);
		// TODO: handle '..' to go up
		try {
			folder = await folder.getFolderAsync(folderPath);
		} catch(err) {
			if (ensure)
				folder = await createPath(folder, folderPath);
			else {
				var desiredFilePath = `${folder.path}/${folderPath}/${fileName}`;
				throw new Error(`ENOENT: no such file or directory, open '${desiredFilePath}'`)
			}
		}
		return [folder, fileName]
	} else {
		return [folder, path]
	}
}

async function createPath(folder, path) {
	var sections = path.split('/');
	var section;
	while (section = sections.shift()) {

	}
}

function splitPath(path) {
	var index = path.lastIndexOf('/');
	return [
		path.slice(0, index),
		path.slice(index + 1)
	]
}

if (typeof Windows !== 'undefined') {
	var {FileIO} = Windows.Storage;
	var {DataReader, DataWriter} = Windows.Storage.Streams;
	var COLLISION = Windows.Storage.CreationCollisionOption;
}




async function readdir(...args) {
	//var uwpFolder = getFolder(args)
	//var [filePath, callback] = args
	//var [targetFolder, fileName] = await accessUwpFolder(uwpFolder, filePath)
	//var items = await targetFolder.GetItemsAsync()
	//for (var item in items) {
	//	if (item.IsOfType(StorageItemTypes.Folder))
	//		console.log("Folder: " + item.Name);
	//	else
	//		console.log("File: " + item.Name + ", " + item.DateCreated);
	//}
}

// todo. make this not return promise if callback is defined
async function readFile(...args) {
	var uwpFolder = getFolder(args);
	var [filePath, callback] = args;
	var [targetFolder, fileName] = await accessUwpFolder(uwpFolder, filePath);
	var file = await targetFolder.getFileAsync(fileName);
	var iBuffer = await FileIO.readBufferAsync(file);
	var nodeBuffer = bufferFromIbuffer(iBuffer);
	if (callback)
		callback(null, nodeBuffer);
	else
		return nodeBuffer
}

// todo. make this not return promise if callback is defined
async function writeFile(...args) {
	var uwpFolder = getFolder(args);
	var [filePath, data, encoding, callback] = args;
	var [targetFolder, fileName] = await accessUwpFolder(uwpFolder, filePath);
	if (!callback) {
		// encoding is optional
		callback = encoding;
		encoding = 'utf8';
	}
	var file = await targetFolder.createFileAsync(fileName, COLLISION.replaceExisting);
	if (typeof data === 'string') {
		if (encoding === 'utf8') {
			await FileIO.writeTextAsync(file, data);
		} else {
			console.warn(`writeFile does not implement other encoding than 'utf8' yet`);
		}
	} else {
		await FileIO.writeBytesAsync(file, data);
	}
	if (callback)
		callback(null);
}

/*
export function createReadStream(...args) {
	var stream = new Readable
	stream._read = function () {}
	_createReadStream(stream, args)
	return stream
}
async function _createReadStream(stream, args) {
	var uwpFolder = getFolder(args)
	var [filePath, options] = args
	var [targetFolder, fileName] = await accessUwpFolder(uwpFolder, filePath)
	var buffer = await readFile(targetFolder, fileName)
	stream.push(buffer)
	stream.push(null)
}
*/
function createWriteStream(...args) {
	var stream$$1 = new stream.Writable;
	_createWriteStream(stream$$1, args);
	return stream$$1
}
async function _createWriteStream(stream$$1, args) {
	var uwpFolder = getFolder(args);
	var [filePath, options] = args;
	var [targetFolder, fileName] = await accessUwpFolder(uwpFolder, filePath);
	stream$$1._write = (chunk, encoding, cb) => {
		console.log('_write');
		console.log('chunk', chunk);
		console.log('encoding', encoding);
		cb();
	};
	writeFile(targetFolder, fileName, data)
		.then(buffer$$1 => {
			console.log('then writeFile');
		});
}


function createReadStream(...args) {
	console.log('createReadStream', ...args);
	var readable = new stream.Readable;
	_createReadStream(readable, args);
	return readable
}
async function _createReadStream(readable, args) {
	var uwpFolder = getFolder(args);
	var [filePath, options] = args;
	var [targetFolder, fileName] = await accessUwpFolder(uwpFolder, filePath);
	// Access UWP's File object
	var file = await targetFolder.getFileAsync(fileName);
	// Open file's read stream
	var uwpStream = await file.openAsync(FileAccessMode.read);
	// Transform UWP stream indo Node's Readable
	readableStreamFromUwpStream(uwpStream, {readable});
}


async function watch() {
	var uwpFolder = getFolder(args);
	//var [filePath, options] = args
	//var [targetFolder, fileName] = await accessUwpFolder(uwpFolder, filePath)
}


var def$1 = {
	// node api
	readFile,
	writeFile,
	readFile,
	createReadStream,
	createWriteStream,
	watch,
	// custom api
	setFolder,
};

return def$1;

})));
