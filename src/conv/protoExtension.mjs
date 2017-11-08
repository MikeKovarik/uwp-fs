import {
	// Browser
	Uint8Array,
	ArrayBuffer,
	Blob,
	File,
	FileReader,
	ReadableStream,
	WritableStream,
	// Node
	Buffer,
	Readable,
	Writable
} from './util.mjs'
import * as streamConvertors from './stream.mjs'
import * as bufferConvertors from './buffer.mjs'


// Node.js stream.Readable
if (Readable) {
	// Statics
	Readable.from               = streamConvertors.readableFrom
	Readable.fromBuffer         = streamConvertors.readableFromBuffer
	Readable.fromTypedArray     = streamConvertors.readableFromTypedArray
	Readable.fromArrayBuffer    = streamConvertors.readableFromArrayBuffer
	Readable.fromFile           = streamConvertors.readableFromBlob
	Readable.fromBlob           = streamConvertors.readableFromBlob
	Readable.fromReadableStream = streamConvertors.readableFromReadableStream
	// Instance methods
	Readable.prototype.toBuffer = bufferConvertors.bufferFromReadable
}

// Node.js stream.Writable
if (Writable) {
}

// WHATWG ReadableStream
if (ReadableStream) {
	ReadableStream.from            = streamConvertors.readableStreamFrom
	ReadableStream.fromBuffer      = streamConvertors.readableStreamFromBuffer // TODO
	ReadableStream.fromTypedArray  = streamConvertors.readableStreamFromTypedArray // TODO
	ReadableStream.fromArrayBuffer = streamConvertors.readableStreamFromArrayBuffer // TODO
	ReadableStream.fromFile        = streamConvertors.readableStreamFromBlob
	ReadableStream.fromBlob        = streamConvertors.readableStreamFromBlob
	ReadableStream.fromReadable    = streamConvertors.readableStreamFromReadable // TODO
	// Instance methods
	ReadableStream.prototype.toReadable = streamConvertors.readableFromReadableStream
}

// WHATWG WritableStream
if (WritableStream) {
}

if (Buffer) {
	// Statics
	Buffer.fromReadable     = bufferConvertors.bufferFromReadable
	Buffer.fromTypedArray   = bufferConvertors.bufferFromTypedArray
	Buffer.fromArrayBuffer  = bufferConvertors.bufferFromArrayBuffer
	Buffer.fromBlob         = bufferConvertors.bufferFromBlob
	// Instance methods
	Buffer.prototype.toReadable       = streamConvertors.readableFromBuffer
	Buffer.prototype.toReadableStream = streamConvertors.readableStreamFromBuffer
}

if (Uint8Array) {
	// Static
	//Uint8Array.fromBuffer = typedArrayFromBuffer
	// Instance methods
	Uint8Array.prototype.toBuffer         = bufferConvertors.bufferFromTypedArray
	Uint8Array.prototype.toReadable       = streamConvertors.readableFromTypedArray
	Uint8Array.prototype.toReadableStream = streamConvertors.readableStreamFromTypedArray
}

if (ArrayBuffer) {
	// Static
	ArrayBuffer.fromBuffer = bufferConvertors.arrayBufferFromBuffer
	// Instance methods
	ArrayBuffer.prototype.toBuffer         = bufferConvertors.bufferFromArrayBuffer
	ArrayBuffer.prototype.toReadable       = streamConvertors.readableFromArrayBuffer
	ArrayBuffer.prototype.toReadableStream = streamConvertors.readableStreamFromArrayBuffer
}

if (Blob && File) {
	// Static
	// ???
	// Instance methods
	File.prototype.toBuffer =
	Blob.prototype.toBuffer = bufferConvertors.bufferFromBlob
	File.prototype.toReadable =
	Blob.prototype.toReadable = function(...args) {
		return streamConvertors.readableFromBlob(this, ...args)
	}
	File.prototype.toReadableStream =
	Blob.prototype.toReadableStream = function(...args) {
		return streamConvertors.readableStreamFromBlob(this, ...args)
	}
}










///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function promisifyWritable(stream = this) {
	var promise = new Promise((resolve, reject) => {
		stream.on('close', resolve)
		stream.on('error', reject)
	})
	stream.then = promise.then.bind(promise)
	stream.catch = promise.catch.bind(promise)
	return stream
}

function promisifyReadable(stream = this) {
	var chunks = []
	var promise = new Promise((resolve, reject) => {
		stream.on('data', chunk => chunks.push(chunk))
		stream.on('end', () => resolve(Buffer.concat(chunks)))
		stream.on('error', reject)
	})
	stream.then = promise.then.bind(promise)
	stream.catch = promise.catch.bind(promise)
	return stream
}

if (false) {
	//Duplex.prototype.promisify =
	Writable.prototype.promisify = promisifyWritable
	//Duplex.prototype.promisify =
	Readable.prototype.promisify = promisifyReadable
}

function promisify(input) {
	if (input instanceof Writable) {
		return promisifyWritable(input)
	} else if (input instanceof Readable) {
		return promisifyReadable(input)
	}
}
