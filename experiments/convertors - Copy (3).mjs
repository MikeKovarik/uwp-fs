import {Readable, Writable, Duplex} from 'stream'
export * from './uwp.mjs'


// default 1MB chunk on blobs has tolerable perf on large files
const MB = 1024 * 1024 // 1 megabyte
var defaultChunkSize = 1024 * 1024 // 1 MB

// Creating local variables out of globals so that we can safely use them (in conditions)
// and not throw errors.
var self = typeof self === 'undefined' ? typeof global === 'object' ? global : window : self
// Browser APIs
var Blob = self.Blob
var File = self.File
var FileReader = self.FileReader
var ArrayBuffer = self.ArrayBuffer
var Uint8Array = self.Uint8Array
// Node.js APIs
var Buffer = self.Buffer

var nextTick = process.nextTick || self.setImediate || sel.setTimeout

function noop() {}

var isNativeNode = typeof process === 'object' && process.versions.node

if (Buffer)
	var originalBufferFrom = Buffer.from

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// Node.js stream.Readable ///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Node.js stream.Readable
if (Readable) {
	// Statics
	Readable.from               = readableFrom
	Readable.fromBuffer         = readableFromBuffer
	Readable.fromTypedArray     = readableFromTypedArray
	Readable.fromArrayBuffer    = readableFromArrayBuffer
	Readable.fromFile           = readableFromBlob
	Readable.fromBlob           = readableFromBlob
	Readable.fromReadableStream = readableFromReadableStream
	// Instance methods
	Readable.prototype.toBuffer = bufferFromReadable
}

// Unversal instantiator of Node.js stream.Readable class from anything thrown at it
export function readableFrom(input, ...args) {
	if (Buffer.isBuffer(input)) {
		return readableFromBuffer(input)
	} else if (Array.isArray(input) || typeof input === 'string') {
		return readableFromBuffer(originalBufferFrom(input))
	} else if (isTypedArray(input)) {
		return readableFromTypedArray(input)
	} else if (input instanceof ArrayBuffer) {
		return readableFromArrayBuffer(input)
	} else if (input instanceof Blob) {
		return readableFromBlob(input, ...args)
	} else if (input instanceof Readable) {
		return input
	}
}

// TODO: turn this into backpressured stream
export function readableFromBuffer(buffer = this, chunkSize) {
	const stream = new Readable()
	// We're not reading from any special source so we're not using noop, despite having to define it
	stream._read = noop
	if (chunkSize === 0) {
		// Add the whole buffer to the stream
		stream.push(buffer)
	} else {
		console.warn(`readableFromBuffer does not implement 'chunkSize' argument yet`)
	}
	// end the stream
	stream.push(null)
	return stream
}

export function readableFromTypedArray(array = this) {
	var buffer = bufferFromTypedArray(array)
	return readableFromBuffer(buffer)
}

export function readableFromArrayBuffer(arrayBuffer) {
	var buffer = bufferFromArrayBuffer(arrayBuffer)
	return readableFromBuffer(buffer)
}

/*
// TODO: test aborting and errors on reader
export function readableFromBlob(blob = this, options = {}) {
	// HighWaterMark is limitting how large chunks we can read.
	var highWaterMark = options.highWaterMark || options.chunkSize || defaultChunkSize
	// Size of the read data and current position inside it.
	var {size} = blob
	var offset = 0
	// Helper variable for keeping track of ongoing reads due to non-waiting nature of _read calls
	var reading = false
	// Open browser's FileReader class needed for accesing binary data from blob.
	var reader = new FileReader()
	// Create Node Readable stream object that we'll read the data into.
	var readable = new Readable({highWaterMark})
	// Each time we read a chunk from the blob, convert it to buffer and push it to the stream.
	reader.onload = e => {
		// Mark the ammount of bytes we read with the last chunk.
		var bytesRead = reader.result.byteLength
		console.log('reader.result.byteLength', reader.result.byteLength)
		// Keep track of how much we read so far and where the next chunk starts.
		offset += bytesRead
		// By default FileReader returns browser's ArrayBuffer that we need to convert to node Buffer.
		var chunk = bufferFromArrayBuffer(reader.result)
		console.log('chunk.length', chunk.length)
		// Unlock next _read cycle
		reading = false
		// Push the read chunk into our stream.
		readable.push(chunk)
		// End the stream if we reached the end of the blob and this was the last chunk.
		if (offset >= size)
			readable.push(null)
	}
	// If error occurs, emit it in the next tick as the Node docs require
	reader.onerror = err => {
		nextTick(() => this.emit('error', err))
	}
	// Readable itself will be calling _read whenever it needs us to supply more data.
	readable._read = maxSize => {
		// Stream asked for more data but since reading from blob is async,
		// we might be reading some chunk already. In which case ignore this _read request.
		if (reading) return
		reading = true
		// ._read() can be synchronously called by the stream in the background right after .push(chunk)
		// before we get the chance to end the stream by .push(null). So we need to keep track of offset position
		// and detect if we've reached the end. In which case just ignore the _read to prevent reading 0 bytes.
		if (size - offset === 0) return
		// Limit the ammount of bytes to read to what the stream is capable of accepting now.
		var bytesToRead = Math.min(size - offset, maxSize)
		// Extract the chunk of 'bytesToRead' size, starting at 'offset'.
		var blobChunk = blob.slice(offset, offset + bytesToRead)
		// And let reader turn the chunk info ArrayBuffer (onload gets called).
		reader.readAsArrayBuffer(blobChunk)
	}
	// Handle destruction of the stream safely by stopping reader.
	readable._destroy = (err, callback) => {
		// TODO
		reader.abort()
		callback()
	}
	return readable
}
*/
/*
// TODO: test aborting and errors on reader
export function readableFromBlob(blob = this, options = {}) {
	// HighWaterMark is limitting how large chunks we can read.
	var highWaterMark = options.highWaterMark || options.chunkSize || defaultChunkSize
	// Size of the read data and current position inside it.
	var {size} = blob
	var offset = 0
	// Helper variable for keeping track of ongoing reads due to non-waiting nature of _read calls
	var reading = false
	// Open browser's FileReader class needed for accesing binary data from blob.
	var reader = new FileReader()
	// Create Node Readable stream object that we'll read the data into.
	var readable = new Readable({highWaterMark})
	// Each time we read a chunk from the blob, convert it to buffer and push it to the stream.
	reader.onload = e => {
		// Mark the ammount of bytes we read with the last chunk.
		var bytesRead = reader.result.byteLength
		// Keep track of how much we read so far and where the next chunk starts.
		offset += bytesRead
		// By default FileReader returns browser's ArrayBuffer that we need to convert to node Buffer.
		var chunk = bufferFromArrayBuffer(reader.result)
		// Push the read chunk into our stream.
		if (offset >= size) {
			readable.push(chunk)
			// End the stream if we reached the end of the blob and this was the last chunk.
			readable.push(null)
			reading = false // TODO test
		} else {
			// Unlock next _read cycle
			reading = false
			readable.push(chunk)
		}
	}
	// If error occurs, emit it in the next tick as the Node docs require
	reader.onerror = err => {
		nextTick(() => this.emit('error', err))
	}
	// Readable itself will be calling _read whenever it needs us to supply more data.
	readable._read = maxSize => {
		// Stream asked for more data but since reading from blob is async,
		// we might be reading some chunk already. In which case ignore this _read request.
		if (reading) return
		reading = true
		// Limit the ammount of bytes to read to what the stream is capable of accepting now.
		var bytesToRead = Math.min(size - offset, maxSize)
		// Extract the chunk of 'bytesToRead' size, starting at 'offset'.
		var blobChunk = blob.slice(offset, offset + bytesToRead)
		// And let reader turn the chunk info ArrayBuffer (onload gets called).
		reader.readAsArrayBuffer(blobChunk)
	}
	// Handle destruction of the stream safely by stopping reader.
	readable._destroy = (err, callback) => {
		// TODO
		reader.abort()
		callback()
	}
	return readable
}
*/






/*

// TODO: test aborting and errors on reader
export function readableFromBlob(blob = this, options = {}) {
	if (options.readable) {
		// Some 
		var readable = options.readable
	} else {
		// HighWaterMark is limitting how large chunks we can read.
		let highWaterMark = options.highWaterMark || options.chunkSize || defaultChunkSize
		// Create Node Readable stream object that we'll read the data into.
		var readable = new Readable({highWaterMark})
	}

	var source = blob

	// Size of the read data and current position inside it.
	var size = source.size || Infinity
	var offset = 0
	// Helper variable for keeping track of ongoing reads due to non-waiting nature of _read calls
	var reading = false

	// Universal promise based Node Readable inflator
	async function pull({desiredSize}) {
		// Limit the ammount of bytes to read to what the stream is capable of accepting now.
		var bytesToRead = Math.min(size - offset, desiredSize)
		readChunk(bytesToRead)
			.then(chunk => {
				console.log('chunk.length', chunk.length)
				offset += chunk.length // bytesRead
				enqueueChunk(chunk)
			})
			.catch(onerror)
	}

	var reader
	async function start() {
		// Open browser's FileReader class needed for accesing binary data from blob.
		reader = new FileReader()
	}
	start()

	async function cancel(reason) {
		reader.abort()
	}

	// Each time we read a chunk from the blob, convert it to buffer and push it to the stream.
	async function readChunk(bytesToRead) {
		// Extract the chunk of 'bytesToRead' size, starting at 'offset'.
		var blobChunk = blob.slice(offset, offset + bytesToRead)
		console.log('blobChunk', blobChunk)
		console.log('bytesToRead', bytesToRead)
		// And let reader turn the chunk info ArrayBuffer (onload gets called).
		reader.readAsArrayBuffer(blobChunk)
		//
		await awaitFileReader(reader)
		// By default FileReader returns browser's ArrayBuffer that we need to convert to node Buffer.
		return bufferFromArrayBuffer(reader.result)
	}


	var enqueueChunk = chunk => {
		// Push the read chunk into our stream.
		if (offset >= size) {
			readable.push(chunk)
			// End the stream if we reached the end of the blob and this was the last chunk.
			readable.push(null)
			reading = false // TODO test
		} else {
			// Unlock next _read cycle
			reading = false
			readable.push(chunk)
		}
	}

	// Readable itself will be calling _read whenever it needs us to supply more data.
	readable._read = async maxSize => {
		// Stream asked for more data but since reading from blob is async,
		// we might be reading some chunk already. In which case ignore this _read request.
		if (reading) return
		reading = true
		await pull({desiredSize: maxSize})
		reading = false
	}

	// If error occurs, emit it in the next tick as the Node docs require
	var onerror = err => nextTick(() => this.emit('error', err))

	// Handle destruction of the stream safely by stopping reader.
	readable._destroy = (err, callback) => cancel(err).then(callback)

	return readable
}

*/

export function readableFromReadableStream(readableStream = this) {
	var readable = new Readable
	_readableFromReadableStream(readable, readableStream)
	return readable
}
async function _readableFromReadableStream(readable, source) {
	// TODO backpressure
	readable._read = function () {}
	var reader = source.getReader()
	while (true) {
		let {value, done} = await reader.read()
		/// NOTE: valus is probably Uint8Array and needs to be converted to buffer
		let chunk = new Uint8Array(value)
		readable.push(chunk)
		if (done) break
	}
	readable.push(null)
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// WHATWG ReadableStream /////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// WHATWG ReadableStream
if (typeof ReadableStream !== 'undefined') {
	ReadableStream.from            = readableStreamFrom
	//ReadableStream.fromBuffer      = readableStreamFromBuffer // TODO
	//ReadableStream.fromTypedArray  = readableStreamFromTypedArray // TODO
	//ReadableStream.fromArrayBuffer = readableStreamFromArrayBuffer // TODO
	ReadableStream.fromFile        = readableStreamFromBlob
	ReadableStream.fromBlob        = readableStreamFromBlob
	//ReadableStream.fromReadable    = readableStreamFromReadable // TODO
	ReadableStream.prototype.toReadable = readableFromReadableStream
}

// Unversal instantiator of WHATWG ReadableStream class from anything thrown at it
export function readableStreamFrom(input, ...args) {
	/*if (Buffer.isBuffer(input)) {
	} else if (Array.isArray(input) || typeof input === 'string') {
	} else if (isTypedArray(input)) {
	} else if (input instanceof ArrayBuffer) {
	} else */if (input instanceof Blob) {
		return readableStreamFromBlob(input, ...args)
	}
}

export function readableStreamFromBuffer(buffer = this, options = {}) {
	// If options is not an object, it was probably used inside .map() which supplies two arguments
	if (typeof options !== 'object') options = {}
	var offset = 0
	var highWaterMark = options.highWaterMark || options.chunkSize || defaultChunkSize
	//var queuingStrategy = new CountQueuingStrategy({highWaterMark})
	// Create instance of the stream
	return new ReadableStream({
		pull(controller) {
			// Only read chunk of desired ammount of bytes from the whole file/blob
            // NOTE: controller.desiredSize is never larger than highWaterMark
			var bytesToRead = Math.min(size - offset, controller.desiredSize)
			// Extract the chunk of 'bytesToRead' size, starting at 'offset'.
			var chunk = buffer.slice(offset, offset + bytesToRead)
			offset += bytesToRead
			controller.enqueue(chunk)
			if (offset >= size)
				controller.close()
		},
	}, {highWaterMark})
	//}, queuingStrategy)
}

export function readableStreamFromTypedArray(array = this) {
	// TODO
	console.warn('readableStreamFromTypedArray not implemented yet')
}

export function readableStreamFromArrayBuffer(arrayBuffer) {
	// TODO
	console.warn('readableStreamFromArrayBuffer not implemented yet')
}





















import {ReadableStreamShim, ReadableStream, CustomReadableStream} from './streams.mjs'

function createCustomReadable(underlyingSource, options) {
	if (options.readable) {
		ReadableStreamShim.call(underlyingSource, options)
	} else {
		new ReadableStreamShim(underlyingSource, options)
	}
}

// TODO: test aborting and errors on reader
export function readableFromBlob(blob = this, options = {}) {
	var underlyingSource = new StreamFromBlobAdapter(blob)
	var readable = createCustomReadable(underlyingSource, options)
	return readable
	//return ReadableStreamShim(methods, options)
}

// TODO: test aborting and errors on reader
export function readableStreamFromBlob(blob = this, options = {}) {
	var underlyingSource = new StreamFromBlobAdapter(blob)
	return new CustomReadableStream(underlyingSource, options)
}

class StreamFromBlobAdapter {
	// Called by instantiatior with new data to be used in stream.
	// Adapter can be used by either Readable or ReadableStream which then call start/pull/cancel
	// on its own from inside, so constructor is the only way we can set up data for those methods.
	constructor(blob) {
		this.blob = blob
	}
	// Called by the stream from inside to signal that we're starting to read some data into the stream
	// And we can now prepare and instantiate what's needed.
	start(controller) {
		console.log('# start', this)
		// Open browser's FileReader class needed for accesing binary data from blob.
		this.reader = new FileReader()
	}
	// Handle cancelation of the stream safely by stopping reader.
	cancel(reason) {
		console.log('# cancel')
		this.reader.abort()
	}
	// Each time we read a chunk from the blob, convert it to buffer and push it to the stream.
	async pull({desiredSize}) {
		// Limit the ammount of bytes to read to what the stream is capable of accepting now.
		var bytesToRead = Math.min(this.size - this.offset, desiredSize)
		console.log('# pull', bytesToRead, '/', desiredSize, '|', this.offset, '/', this.size)
		// Extract the chunk of 'bytesToRead' size, starting at 'offset'.
		var blobChunk = blob.slice(this.offset, this.offset + bytesToRead)
		// And let reader turn the chunk info ArrayBuffer (onload gets called).
		this.reader.readAsArrayBuffer(blobChunk)
		//
		await awaitFileReader(this.reader)
		// By default FileReader returns browser's ArrayBuffer that we need to convert to node Buffer.
		return this.reader.result
	}
}

function awaitFileReader(reader) {
	return new Promise((resolve, reject) => {
		reader.onload = resolve
		reader.onerror = reject
		reader.onabort = reject
	})
}

/*
// TODO: test aborting and errors on reader
export function readableStreamFromBlob(blob, options) {
	// HighWaterMark is limitting how large chunks we can read.
	var highWaterMark = options.highWaterMark || options.chunkSize || defaultChunkSize
	// Set watermark so that the stream does not read one byte at a time.
	var queuingStrategy = new CountQueuingStrategy(highWaterMark)
	// Size of the read data and current position inside it.
	var {size} = blob
	var offset = 0
	//
	var controller
	// Open browser's FileReader class needed for accesing binary data from blob.
	var reader = new FileReader()
	// Each time we read a chunk from the blob, convert it to buffer and push it to the stream.
	reader.onload = e => {
		// Mark the ammount of bytes we read with the last chunk.
		var bytesRead = reader.result.byteLength
		// Keep track of how much we read so far and where the next chunk starts.
		offset += bytesRead
		// By default FileReader returns browser's ArrayBuffer that we need to convert to node Buffer.
		var chunk = new Uint8Array(reader.result)
		// Push the read chunk into our stream.
		controller.enqueue(chunk)
		// End the stream if we reached the end of the blob and this was the last chunk.
		if (offset >= size)
			controller.close()
	}
	// TODO: Properly handle errors
	reader.onerror = err => {
		// TODO
	}
	// Create instance of the ReadableStream
	return new ReadableStream({
		// In start we should be setting everything up be we are already doing that
		start(ctrl) {
			controller = ctrl
		},
		// We're only slicing and reading data from file/blob if consumer asks for it.
		pull({desiredSize}) {
			// Only read chunk of desired ammount of bytes from the whole file/blob
            // NOTE: controller.desiredSize is never larger than highWaterMark
			var bytesToRead = Math.min(size - offset, desiredSize)
			// Extract the chunk of 'bytesToRead' size, starting at 'offset'.
			var blobChunk = blob.slice(offset, offset + bytesToRead)
			// And let reader turn the chunk info ArrayBuffer (onload gets called).
			reader.readAsArrayBuffer(blobChunk)
			// Return promise which is either 
			return new Promise((resolve, reject) => {
				// NOTE: 'load' is fired on successful read and is already used by chunk reader
				//       'loadend' is fired after either 'load' or 'error'. But if 'error' occurs, 
				//       by then we've already rejected promise and there shouldn't be a problem. 
				reader.onloadend = resolve
				reader.onerror = reject
				reader.onabort = reject
			})
		},
		// Handle cancelation of the stream safely by stopping reader.
		cancel(reason) {
			reader.abort()
		}
	}, queuingStrategy)
}
*/

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// Node.js Buffer ////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


if (Buffer) {
	// Statics
	Buffer.fromReadable     = bufferFromReadable
	Buffer.fromTypedArray   = bufferFromTypedArray
	Buffer.fromArrayBuffer  = bufferFromArrayBuffer
	Buffer.fromBlob         = bufferFromBlob
	// Instance methods
	Buffer.prototype.toReadable       = readableFromBuffer
	Buffer.prototype.toReadableStream = readableStreamFromBuffer
}


export function bufferFromTypedArray(array = this) {
	if (array instanceof Uint8Array) {
		return originalBufferFrom(array)
	} else {
		throw new Error('Buffer.fromTypedArray does not implement other types than Uint8Array')
	}
	// TODO
}

export function bufferFromArrayBuffer(arrayBuffer = this) {
	if (isNativeNode)
		return originalBufferFrom(new Uint8Array(arrayBuffer))
	else
		return originalBufferFrom(arrayBuffer)
}

// returns promise
export function bufferFromBlob(blob = this) {
	return new Promise((resolve, reject) => {
		var reader = new FileReader()
		reader.onload = e => {
			var buffer = bufferFromArrayBuffer(reader.result)
			resolve(buffer)
		}
		reader.readAsArrayBuffer(blob)
	})
}

// returns promise with the buffer as a callback argument
export function bufferFromReadable(stream = this) {
	return new Promise((resolve, reject) => {
		var chunks = []
		stream.on('data', data => chunks.push(data))
		stream.on('end', () => resolve(Buffer.concat(chunks)))
	})
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// ArrayBuffer ///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


if (ArrayBuffer) {
	// Static
	ArrayBuffer.fromBuffer         = arrayBufferFromBuffer
	// Instance methods
	ArrayBuffer.prototype.toBuffer         = bufferFromArrayBuffer
	ArrayBuffer.prototype.toReadable       = readableFromArrayBuffer
	ArrayBuffer.prototype.toReadableStream = readableStreamFromArrayBuffer
}

export function arrayBufferFromBuffer(buffer = this) {
	return (new Uint8Array(buffer)).buffer
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// ArrayBuffer ///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


if (Uint8Array) {
	// Static
	//Uint8Array.fromBuffer = typedArrayFromBuffer
	// Instance methods
	Uint8Array.prototype.toBuffer         = bufferFromTypedArray
	Uint8Array.prototype.toReadable       = readableFromTypedArray
	Uint8Array.prototype.toReadableStream = readableStreamFromTypedArray
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// Blob / File ///////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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


Duplex.prototype.promisify =
Writable.prototype.promisify = function(stream = this) {
	var promise = new Promise((resolve, reject) => {
		stream.on('close', resolve)
		stream.on('error', reject)
	})
	stream.then = promise.then.bind(promise)
	stream.catch = promise.catch.bind(promise)
	return stream
}

function promisify(input) {
	if (input instanceof Writable) {
		console.log('promisifying Writable')
		return Writable.prototype.promisify(input)
	}
}


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
