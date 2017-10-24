import {Readable} from 'stream'
import {nextTick} from './util.mjs'


// Web Streams ReadableStream shim built on top of Node.js' stream.Readable class
export default class ReadableStreamAdapter extends Readable {

	constructor (underlyingSource, options = {}) {
		console.warn('implement .pipeTo, .pipeThrough, .getReader() and other things from spec')
		console.warn('implement cancel')
		super(options)
		this.underlyingSource = underlyingSource
		this.__applyReadableStreamAdapter(underlyingSource)
	}

	pipeTo() {
		console.warn('TO BE IMPLEMENTED ReadableStreamAdapter.pipeTo()')
	}
	pipeThrough() {
		console.warn('TO BE IMPLEMENTED ReadableStreamAdapter.pipeThrough()')
	}
	getReader() {
		console.warn('TO BE IMPLEMENTED ReadableStreamAdapter.getReader()')
	}
	tee() {
		console.warn('TO BE IMPLEMENTED ReadableStreamAdapter.tee()')
	}

	__applyReadableStreamAdapter(underlyingSource) {
		this.underlyingSource
		// ReadableStreamDefaultController shim
		this.controller = {
			close: () => this.push(null),
			enqueue: chunk => this.push(chunk),
			error: err => nextTick(() => this.emit('error', err)),
			// If error occurs, emit it in the next tick as the Node docs require
		}

		this.underlyingSource.start(this.controller)
	}

	// Readable itself will be calling _read whenever it needs us to supply more data.
	async _read(maxSize) {
		this.controller.desiredSize = maxSize
		await this.underlyingSource.pull(this.controller)
	}

	// Handle destruction of the stream safely by stopping reader.
	async _destroy(err, callback) {
		if (this.underlyingSource.cancel)
			await this.underlyingSource.cancel(err)
		if (callback) callback()
	}

}