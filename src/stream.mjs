import {Readable, Writable} from 'stream'
import {open, close, read} from './syscall.mjs'
import {getPathFromURL} from './path.mjs'
import {errors} from './errors.mjs'


var defaultReadStreamOptions = {
	highWaterMark: 64 * 1024,
	fd: null,
	flags: 'r',
	mode: 0o666,
	autoClose: true,
}

var defaultWriteStreamOptions = {
	fd: null,
	flags: 'w',
	mode: 0o666,
	autoClose: true,
}



var pool

function allocNewPool(poolSize) {
	pool = Buffer.allocUnsafe(poolSize)
	pool.used = 0
}

export class ReadStream extends Readable {

	constructor(path, options = {}) {
		options = Object.assign({}, defaultReadStreamOptions, options)
		super(options)
		handleError((this.path = getPathFromURL(path)))
		Object.assign(this, options)
		this.pos = undefined
		this.bytesRead = 0

		if (this.start !== undefined) {
			if (typeof this.start !== 'number') {
				throw new errors.TypeError('ERR_INVALID_ARG_TYPE', 'start', 'number', this.start)
			}
			if (this.end === undefined) {
				this.end = Infinity
			} else if (typeof this.end !== 'number') {
				throw new errors.TypeError('ERR_INVALID_ARG_TYPE', 'end', 'number', this.end)
			}
			if (this.start > this.end) {
				const errVal = `{start: ${this.start}, end: ${this.end}}`
				throw new errors.RangeError('ERR_VALUE_OUT_OF_RANGE', 'start', '<= "end"', errVal)
			}
			this.pos = this.start
		}

		if (typeof this.fd !== 'number')
			this.open()

		this.on('end', function() {
			if (this.autoClose)
				this.destroy()
		})
	}

	open() {
		open(this.path, this.flags, this.mode)
			.then(fd => {
				this.fd = fd
				this.emit('open', fd)
				// Start the flow of data.
				this.read()
			})
			.catch(err => {
				if (this.autoClose)
					this.destroy()
				this.emit('error', err)
			})
	}

	_read(n) {
		if (typeof this.fd !== 'number')
			return this.once('open', () => this._read(n))

		if (this.destroyed)
			return

		// Discard the old pool.
		if (!pool || pool.length - pool.used < kMinPoolSpace)
			allocNewPool(this._readableState.highWaterMark)

		// Grab another reference to the pool in the case that while we're
		// in the thread pool another read() finishes up the pool, and
		// allocates a new one.
		var thisPool = pool
		var toRead = Math.min(pool.length - pool.used, n)
		var start = pool.used

		if (this.pos !== undefined)
			toRead = Math.min(this.end - this.pos + 1, toRead)

		// Elready read everything we were supposed to read! Treat as EOF.
		if (toRead <= 0)
			return this.push(null)

		// The actual read.
		read(this.fd, pool, pool.used, toRead, this.pos)
			.then(bytesRead => {
				var b = null
				if (bytesRead > 0) {
					this.bytesRead += bytesRead
					b = thisPool.slice(start, start + bytesRead)
				}
				this.push(b)
			})
			.catch(er => {
				if (this.autoClose)
					this.destroy()
				this.emit('error', er)
			})

		// Move the pool positions, and internal position for reading.
		if (this.pos !== undefined)
			this.pos += toRead
		pool.used += toRead
	}

	_destroy(err, cb) {
		if (this.closed || typeof this.fd !== 'number') {
			if (typeof this.fd !== 'number') {
				this.once('open', closeFsStream.bind(null, this, cb, err))
				return
			}

			return process.nextTick(() => {
				cb(err)
				this.emit('close')
			})
		}
		this.closed = true
		closeFsStream(this, cb)
		this.fd = null
	}

}


export class WriteStream extends Writable {

	constructor(path, options = {}) {
		options = Object.assign({}, options)
		super(options)
		handleError((this.path = getPathFromURL(path)))
		Object.assign(this, options)
		this.pos = undefined
		this.bytesWritten = 0

		if (this.start !== undefined) {
			if (typeof this.start !== 'number') {
				throw new errors.TypeError('ERR_INVALID_ARG_TYPE', 'start', 'number', this.start)
			}
			if (this.start < 0) {
				const errVal = `{start: ${this.start}}`
				throw new errors.RangeError('ERR_VALUE_OUT_OF_RANGE', 'start', '>= 0', errVal)
			}
			this.pos = this.start
		}

		if (options.encoding)
			this.setDefaultEncoding(options.encoding)

		if (typeof this.fd !== 'number')
			this.open()

		// dispose on finish.
		this.once('finish', function() {
			if (this.autoClose)
				this.destroy()
		})
	}
}









if (ReadStream.prototype.destroy === undefined)
	ReadStream.prototype.destroy = ReadStream.prototype.close
if (WriteStream.prototype.destroy === undefined)
	WriteStream.prototype.destroy = WriteStream.prototype.end




function closeFsStream(stream, cb, err) {
	close(stream.fd)
		.catch(() => stream.emit('close'))
		.catch(er => cb(er || err))
}

function handleError(val, callback) {
  if (val instanceof Error) {
    if (typeof callback === 'function') {
      process.nextTick(callback, val);
      return true;
    } else throw val;
  }
  return false;
}






import {readableFromUwpStream} from './conv/index.mjs'

export function createReadStream(path) {
	var readable = new Readable
	_createReadStream(readable, path)
	return readable
}
export async function _createReadStream(readable, path) {
	var fd = await _open(path, fd)
	// Access UWP's File object
	var file = fds[fd]
	// Open file's read stream
	var uwpStream = await file.openAsync(FileAccessMode.read)
	// Transform UWP stream indo Node's Readable
	readableFromUwpStream(uwpStream, {readable})
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