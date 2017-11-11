if (typeof process === 'undefined')
	var process = {}

if (typeof process.nextTick === 'undefined')
	//process.nextTick = (fn, ...args) => setTimeout(() => fn(...args))
	process.nextTick = (fn, ...args) => {
		console.log('nextTick')
		console.log('fn', fn)
		console.log('args', args)
		setTimeout(() => fn(...args))
	}

export var isUwp = typeof Windows !== 'undefined'

export var readyPromises = []
export var ready = new Promise(resolve => {
	setTimeout(() => {
		Promise.all(readyPromises).then(resolve)
	})
})

export function wrapPromise(promise) {
	return new Promise((resolve, reject) => promise.then(resolve, reject))
}

export function callbackify(promiseOrFunction, callback) {
	if (callback === undefined) {
		return (...args) => {
			if (typeof args[args.length - 1] === 'function') 
				return _callbackify(promiseOrFunction(...args), args.pop())
			else
				return _callbackify(promiseOrFunction(...args))
		}
	} else {
		return _callbackify(promiseOrFunction, callback)
	}
}
function _callbackify(promise, callback) {
	if (callback) {
		promise
			.then(data => callback(null, data))
			.catch(err => process.nextTick(callback, err))
			//.catch(err => callback(err))
	}
	return promise
}

// Strips drive name from path (creates path relative to the drive)
export function stripDrive(path) {
	var index
	index = path.indexOf(':\\\\')
	if ((index = path.indexOf(':\\\\')) !== -1)
		path = path.substr(index + 3)
	if ((index = path.indexOf(':\\')) !== -1)
		path = path.substr(index + 2)
	return path
}

export function extractDrive(path) {
	var index = path.indexOf(':')
	return path.substr(index - 1, index).toLowerCase()
}


// Tests UWP StorageFolder if it's just a random folder or a drive (like C:\)
export function isFolderDrive(folder) {
	return folder.name === folder.path && folder.path.endsWith(':\\')
}

// todo investigate deprecation
export function getOptions(options, defaultOptions = {}) {
	if (options === null || options === undefined || typeof options === 'function')
		return defaultOptions
	if (typeof options === 'string')
		return Object.assign({}, defaultOptions, {encoding: options})
	else if (typeof options === 'object')
		return Object.assign({}, options, defaultOptions)
}

// todo deprecate
export function maybeCallback(cb) {
	return typeof cb === 'function' ? cb : rethrow();
}

export function nullCheck(path) {
	if (('' + path).indexOf('\u0000') !== -1)
		throw new errors.Error('ERR_INVALID_ARG_TYPE', 'path', 'string without null bytes', path)
}