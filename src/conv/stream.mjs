import {Uint8Array, ArrayBuffer, Blob, File, FileReader, ReadableStream, WritableStream} from './util.mjs'
import {Buffer, Readable, Writable} from './util.mjs'
import {ReadableStreamAdapter} from 'node-web-streams-adapter'
import {UnderlyingSourceWrapper} from './stream-wrappers.mjs'
import * as bufferConvertors from './buffer.mjs'
import {originalBufferFrom} from './buffer.mjs'
import {noop, getHighWaterMark, isTypedArray} from './util.mjs'




// Helper wrapper returning promise that resolves or rejects after filereader
// finished loading blob (fires 'load' event and calls reader.onload),
// or rejects in case of error or cancellation (onerror, onabort events)
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
		var bytesToRead = Math.min(this.size - this.offset, desiredSize)
		// Extract the chunk of 'bytesToRead' size, starting at 'offset'.
		var blobChunk = this.source.slice(this.offset, this.offset + bytesToRead)
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
		return new Buffer.from(await super._pull(controller))
	}
}
export function readableFromBlob(blob = this, options = {}) {
	var underlyingSource = new ReadableFileReaderAdapterFromBlob(blob)
	return new ReadableStreamAdapter(underlyingSource, options)
}

class ReadableStreamFileReaderAdapterFromBlob extends FileReaderAdapterFromBlob {
	async _pull(controller) {
		return new Uint8Array(await super._pull(controller))
	}
}
export function readableStreamFromBlob(blob = this, options = {}) {
	var underlyingSource = new ReadableStreamFileReaderAdapterFromBlob(blob)
	return new ReadableStream(underlyingSource, options)
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// Node.js stream.Readable ///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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
export function readableFromBuffer(buffer = this, options = {}) {
	var highWaterMark = getHighWaterMark(options)
	const stream = new Readable({highWaterMark})
	// We're not reading from any special source so we're not using noop, despite having to define it
	stream._read = noop
	stream.push(buffer)
	// end the stream
	stream.push(null)
	return stream
}

export function readableFromTypedArray(array = this) {
	var buffer = bufferConvertors.bufferFromTypedArray(array)
	return readableFromBuffer(buffer)
}

export function readableFromArrayBuffer(arrayBuffer) {
	var buffer = bufferConvertors.bufferFromArrayBuffer(arrayBuffer)
	return readableFromBuffer(buffer)
}

export function readableFromReadableStream(readableStream = this) {
	var readable = new Readable
	_readableFromReadableStream(readable, readableStream)
	return readable
}
async function _readableFromReadableStream(readable, source) {
	console.warn('TODO: reimplement readableFromReadableStream using adapters')
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
	console.warn('TODO: reimplement readableStreamFromBuffer using BYOB')
	// If options is not an object, it was probably used inside .map() which supplies two arguments
	if (typeof options !== 'object') options = {}
	var offset = 0
	var highWaterMark = getHighWaterMark(options)
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

export function readableStreamFromArrayBuffer(arrayBuffer = this) {
	// TODO
	console.warn('readableStreamFromArrayBuffer not implemented yet')
}

export function readableStreamFromReadable(readable = this) {
	// TODO
	console.warn('readableStreamFromReadable not implemented yet')
}


