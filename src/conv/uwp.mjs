import {Uint8Array, ArrayBuffer, Blob, File, FileReader, ReadableStream, WritableStream} from './util.mjs'
import {Buffer, Readable, Writable} from './util.mjs'
import {ReadableStreamAdapter} from 'node-web-streams-adapter'
import {UnderlyingSourceWrapper, UnderlyingSinkWrapper} from './stream-wrappers.mjs'


if (typeof Windows === 'object') {
	var {DataReader, DataWriter, InputStreamOptions} = Windows.Storage.Streams
}





class UwpStreamSource extends UnderlyingSourceWrapper {

	// Allocates enough space in newly created chunk buffer.
	chunkAlloc(size) {
		return new Uint8Array(size)
	}

	_start(controller) {
		// Instantiate UWP DataReader from the input stream
		this.reader = new DataReader(this.source)
		// Makes the stream available for reading (loadAsync) whenever there are any data,
		// no matter how much. Without it, the reader would wait for all of the 'desiredSize'
		// to be in the stream first, before it would let us read it all at once.
		this.reader.inputStreamOptions = InputStreamOptions.partial
	}

	async _pull({desiredSize}) {
		//
		var bytesRead = await this.reader.loadAsync(desiredSize)
		// Create Buffer of the size that we know is ready for use to read from the stream.
		var chunk = this.chunkAlloc(bytesRead)
		// Now read the data from the stream into the chunk buffe we've just created.
		this.reader.readBytes(chunk)
	}

	_cancel(reason) {
		this.reader.close()
	}

}


class UwpStreamSink extends UnderlyingSinkWrapper {

	// Allocates enough space in newly created chunk buffer.
	chunkAlloc(size) {
		return new Uint8Array(size)
	}

	_start(controller) {
		// Instantiate UWP DataReader from the input stream
		this.reader = new DataReader(this.source)
		// Makes the stream available for reading (loadAsync) whenever there are any data,
		// no matter how much. Without it, the reader would wait for all of the 'desiredSize'
		// to be in the stream first, before it would let us read it all at once.
		this.reader.inputStreamOptions = InputStreamOptions.partial
	}

	async _pull({desiredSize}) {
		//
		var bytesRead = await this.reader.loadAsync(desiredSize)
		// Create Buffer of the size that we know is ready for use to read from the stream.
		var chunk = this.chunkAlloc(bytesRead)
		// Now read the data from the stream into the chunk buffe we've just created.
		this.reader.readBytes(chunk)
	}

	_cancel(reason) {
		this.reader.close()
	}

}


export function readableFromUwpStream(uwpStream = this, options = {}) {
	var underlyingSource = new UwpStreamSource(uwpStream)
	underlyingSource.chunkAlloc = size => Buffer.allocUnsafe(size)
	return new ReadableStreamAdapter(underlyingSource, options)
}

export function readableStreamFromUwpStream(uwpStream = this, options = {}) {
	var underlyingSource = new UwpStreamSource(uwpStream)
	underlyingSource.chunkAlloc = size => new Uint8Array(size)
	return new ReadableStream(underlyingSource, options)
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



export function bufferFromIbuffer(iBuffer) {
	// Note this is not a custom extension of DataReader class but builtin method
	// that accepts UWP IBuffer.
	var reader = DataReader.fromBuffer(iBuffer)
	var byteSize = reader.unconsumedBufferLength
	var nodeBuffer = Buffer.allocUnsafe(byteSize)
	var data = reader.readBytes(nodeBuffer)
	reader.close()
	return nodeBuffer
}

