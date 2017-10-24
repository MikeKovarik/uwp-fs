import {Buffer} from 'buffer'
import {Readable, Writable} from 'stream'


// default 1MB chunk on blobs has tolerable perf on large files
export var defaultChunkSize = 1024 * 1024 // 1 MB

export function getHighWaterMark(options) {
	// HighWaterMark is limitting how large chunks we can read.
	return options.highWaterMark || options.chunkSize || defaultChunkSize
}

// Creating local variables out of globals so that we can safely use them (in conditions)
// and not throw errors.
export var self = typeof self === 'undefined' ? typeof global === 'object' ? global : window : self
// Node.js APIs
export {Buffer} from 'buffer'
export {Readable, Writable} from 'stream'
// Browser APIs
export var Blob = self.Blob
export var File = self.File
export var FileReader = self.FileReader
export var ArrayBuffer = self.ArrayBuffer
export var Uint8Array = self.Uint8Array
export var ReadableStream = self.ReadableStream
export var WritableStream = self.WritableStream

export var nextTick = process.nextTick || self.setImediate || sel.setTimeout

export function noop() {}

export var isNativeNode = typeof process === 'object' && process.versions.node

export function isTypedArray(arr) {
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