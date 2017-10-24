import {Writable} from 'stream'
import {nextTick} from './util.mjs'


// Web Streams WritableStream shim built on top of Node.js' stream.Writable class
export default class WritableStreamAdapter extends Writable {

	constructor (underlyingSource, options = {}) {
		super(options)
		console.warn('TO BE IMPLEMENTED: WritableStreamAdapter')
	}

}