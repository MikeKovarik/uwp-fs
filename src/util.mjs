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

export function getOptions(options, defaultOptions = {}) {
	if (options === null || options === undefined || typeof options === 'function')
		return defaultOptions
	if (typeof options === 'string')
		return Object.assign({}, defaultOptions, {encoding: options})
	else if (typeof options === 'object')
		return Object.assign({}, options, defaultOptions)
}

export function nullCheck(path, callback) {
	if (('' + path).indexOf('\u0000') === -1)
		return true
	const er = new Error('ERR_INVALID_ARG_TYPE')
	if (typeof callback !== 'function')
		throw er
	process.nextTick(callback, er)
	return false
}
/*
export function nullCheck(path, callback) {
	if (('' + path).indexOf('\u0000') !== -1) {
		const er = new errors.Error('ERR_INVALID_ARG_TYPE', 'path', 'string without null bytes', path)
		if (typeof callback !== 'function')
			throw er
		process.nextTick(callback, er)
		return false
	}
	return true
}
*/