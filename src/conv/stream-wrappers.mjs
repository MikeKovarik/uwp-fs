import {Uint8Array, ArrayBuffer, Blob, File, FileReader, ReadableStream, WritableStream} from './util.mjs'
import {Buffer, Readable, Writable} from './util.mjs'
import {nextTick, isNativeNode} from './util.mjs'


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// READABLE / READABLESTREAM SHIM & UTILITIES ////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Implementor must provide _pull method, and can also implement _start and _cancel
export class UnderlyingSourceWrapper {

	// Called by instantiatior with new data to be used in stream.
	// Adapter can be used by either Readable or ReadableStream which then call start/pull/cancel
	// on its own from inside, so constructor is the only way we can set up data for those methods.
	constructor(source) {
		this.source = source
	}

	// Called by the stream from inside to signal that we're starting to read some data into the stream
	// And we can now prepare and instantiate what's needed.
	start(controller) {
		// Size of the read data and current position inside it.
		this.size = this.source.size || Infinity
		this.offset = 0
		if (this._start)
			return this._start(controller)
	}

	// Each time we read a chunk from the blob, convert it to buffer and push it to the stream.
	async pull(controller) {
		console.log('pull', this.offset, '/', this.size)
		// End the stream if we reached the end of the blob and this was the last chunk.
		if (this.offset >= this.size)
			return controller.close()
		try {
			// Read chunk from underlying source
			var chunk = await this._pull(controller)
			// bytesRead
			this.offset += chunk.length
			// Push the read chunk into our stream.
			controller.enqueue(chunk)
		} catch(err) {
			controller.error(err)
		}
	}


	// Handle cancelation of the stream safely by stopping reader.
	cancel(reason) {
		this._cancel(reason)
	}

}




export class UnderlyingSinkWrapper {

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