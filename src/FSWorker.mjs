import EventEmitter from 'events'
import util from 'util'


//const { getPathFromURL } = require('internal/url');
//const errors = require('internal/errors');
var errname = {}

var errnoException = util && util._errnoException || function(err, syscall, original) {
	if (typeof err !== 'number' || err >= 0 || !Number.isSafeInteger(err))
		throw new errors.TypeError('ERR_INVALID_ARG_TYPE', 'err', 'negative number')
	const name = errname(err)
	var message = `${syscall} ${name}`
	if (original) message += ` ${original}`
	const e = new Error(message)
	e.code = e.errno = name
	e.syscall = syscall
	return e
}


function handleError(val, callback) {
	if (val instanceof Error) {
		if (typeof callback === 'function') {
			process.nextTick(callback, val)
			return true
		} else throw val
	}
	return false
}

function nullCheck(path, callback) {
	if (('' + path).indexOf('\u0000') !== -1) {
		const er = new errors.Error('ERR_INVALID_ARG_TYPE', 'path', 'string without null bytes', path)
		if (typeof callback !== 'function')
			throw er
		process.nextTick(callback, er)
		return false
	}
	return true
}





class FSWatcher extends EventEmitter {

	constructor() {
		super()
		this._handle// = 
		/*this._handle.onchange = function(status, eventType, filename) {
			if (status < 0) {
				self._handle.close()
				const error = !filename ?
					errnoException(status, 'Error watching file for changes:') :
					errnoException(status, `Error watching file ${filename} for changes:`)
				error.filename = filename
				self.emit('error', error)
			} else {
				self.emit('change', eventType, filename)
			}
		}*/
	}

	start(filename, persistent, recursive, encoding) {
		handleError((filename = getPathFromURL(filename)))
		nullCheck(filename)
		var err = //this._handle.start
		if (err) {
			this.close()
			const error = errnoException(err, `watch ${filename}`)
			error.filename = filename
			throw error
		}
	}


	close() {
		this._handle// = 
	}

}