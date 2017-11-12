import {isUwp, callbackify, nullCheck} from './util.mjs'
import {openStorageFolder, openStorageFile, openStorageObject} from './uwp-storageobject.mjs'
import {syscallException, errors} from './errors.mjs'
import {getPathFromURL} from './path.mjs'


if (isUwp) {
	var {StorageFolder, StorageFile, FileAccessMode} = Windows.Storage
	var {DataReader, DataWriter, InputStreamOptions} = Windows.Storage.Streams
}

// List of active File Descriptors.
// First three FDs are taken by stdin, stdout, stderr (and are inaccessible in UWP).
// Warning: If process uses more than three basic FDs (like forked process with 'ipc' channel)
//          than the first number of FDs won't match (this module will always start at fd 3)
export var fds = [null, null, null]

function findEmpyFd() {
	for (var i = 2; i < fds.length; i++)
		if (fds[i] === undefined) return i
	return fds.length
}

function clearFd(fd) {
	if (fd === fds.length - 1)
		fds.length--
	else if (fd < fds.length)
		fds[fd] = undefined
}

export function reserveFd() {
	var fd = findEmpyFd()
	fds[fd] = null
	return fd
}



/*
'r'   Open file for reading. An exception occurs if the file does not exist.
'r+'  Open file for reading and writing. An exception occurs if the file does not exist.
'rs+' Open file for reading and writing in synchronous mode. Instructs the operating system to bypass the local file system cache.
'w'   Open file for writing. The file is created (if it does not exist) or truncated (if it exists).
'wx'  Like 'w' but fails if path exists.
'w+'  Open file for reading and writing. The file is created (if it does not exist) or truncated (if it exists).
'wx+' Like 'w+' but fails if path exists.
'a'   Open file for appending. The file is created if it does not exist.
'ax'  Like 'a' but fails if path exists.
'a+'  Open file for reading and appending. The file is created if it does not exist.
'ax+' Like 'a+' but fails if path exists.
*/
export var open = callbackify(async (path, flags = 'r', mode = 0o666) => {
	// Create absolute path and check for corrections (it thows proper Node-like error otherwise)
	path = getPathFromURL(path)
	nullCheck(path)
	// Access UWP's File object
	// Note: Not wrapped in try/catching because openStorageObject() returns sanitized Node-like error object.
	var storageObject = await openStorageObject(path, 'open')

	var folder, file, stream, reader, writer

	if (storageObject.constructor === StorageFolder)
		folder = storageObject
	if (storageObject.constructor === StorageFile)
		file = storageObject

	if (file !== undefined) {
		// Open file's read stream
		// TODO: wrap in try/catch and handle errors
		stream = await storageObject.openAsync(FileAccessMode.read)
		if (!window.iStream)
			window.iStream = stream
		if (flags.includes('r')) {
			var reader = new DataReader(stream)
			reader.inputStreamOptions = InputStreamOptions.partial
		}
		if (flags === 'r+')
			writer = 'TODO'
		//FileAccessMode.read
		//FileAccessMode.readWrite
	}

	var fd = reserveFd()
	fds[fd] = {file, folder, storageObject, stream, reader, writer, path}
	return fd
})


export var unlink = callbackify(async path => {
	// Create absolute path and check for corrections (it thows proper Node-like error otherwise)
	path = getPathFromURL(path)
	nullCheck(path)
	// Access UWP's StorageFile object
	// Note: Not wrapped in try/catching because openStorageObject() returns sanitized Node-like error object.
	var storageObject = await openStorageFile(path, 'stat')
})


export var mkdir = callbackify(async path => {
	// Create absolute path and check for corrections (it thows proper Node-like error otherwise)
	path = getPathFromURL(path)
	nullCheck(path)
})

export var rmdir = callbackify(async path => {
	// Create absolute path and check for corrections (it thows proper Node-like error otherwise)
	path = getPathFromURL(path)
	nullCheck(path)
	// Access UWP's StorageFolder object
	// Note: Not wrapped in try/catching because openStorageObject() returns sanitized Node-like error object.
	var storageObject = await openStorageFolder(path, 'rmdir')
})


// syscall used in: readdir
export async function _scandir(path, fd) {
	// Find empty fd number (slot for next descriptor we are about to open).
	if (fd === undefined)
		fd = findEmpyFd()
	// Try to get folder descriptor for given path and store it to the empty slot.
	fds[fd] = await openStorageFolder(path, 'scandir')
	return fd
}


/*
Read data from the file specified by 'fd'.
'buffer' is the buffer that the data will be written to.
'offset' is the offset in the buffer to start writing at.
'length' is an integer specifying the number of bytes to read.
'position' is an argument specifying where to begin reading from in the file. If position is null, data will be read from the current file position, and the file position will be updated. If position is an integer, the file position will remain unchanged.
The callback is given the three arguments, '(err, bytesRead, buffer)'.
*/
export async function _read(fd, buffer, offset, length, position) {
	// NOTE: Order of these errors matter. Do not change.
	if (buffer === undefined || !Buffer.isBuffer(buffer))
		throw new errors.TypeError('Second argument needs to be a buffer')
	// note: position -1 means don't move to any position, start reading where we left off last time.
	if (position < -1)
		throw syscallException('EINVAL', 'read')
	if (offset < 0 || offset > buffer.length)
		throw new errors.Error('Offset is out of bounds')
	if (offset + length > buffer.length)
		throw new errors.RangeError('Length extends beyond buffer')
	var {file, folder, stream, reader} = fds[fd]
	if (file === undefined && folder !== undefined)
		throw syscallException('EISDIR', 'read')
	if (position > stream.size)
		return {bytesRead: 0, buffer}

	// Set position where to begin reading from in the file.
	if (position !== null && position !== -1)
		stream.seek(position)
	// Assess the ammount of bytes we want to read.
	//var bytesToRead = length || stream.size
	var bytesToRead = Math.min(stream.size - position, length)
	// Request to read that ammount of bytes, but but ready to comply to UWP's restictions.
    var bytesRead = await reader.loadAsync(bytesToRead)
	//var bytesRead = reader.unconsumedBufferLength
	var view = buffer.slice(offset, offset + bytesRead)
	//var view = buffer.slice(offset, offset + length)
	//var view = Buffer.allocUnsafe(bytesRead)
	// Now that UWP loaded the bytes for use, we can read them into our buffer.
	reader.readBytes(view)
	return {bytesRead, buffer}
}
// NOTE: not using callbackify() because Node's fs.read() when wrapped in Node's util.promisify()
//       returns different things.
//       - Callback has error and two arguments (instead of just one): bytesRead, buffer
//       - Promise returns an object with bytesRead and buffer properties: {bytesRead, buffer}
export function read(fd, buffer, offset, length, position, callback) {
	var promise = _read(fd, buffer, offset, length, position)
	if (callback) {
		promise
			.then(({bytesRead, buffer}) => callback(null, bytesRead, buffer))
			.catch(err => callback(err))
	}
	return promise
}
//await storageFolder.CreateFileAsync("sample.txt", Windows.Storage.CreationCollisionOption.ReplaceExisting);


export var close = callbackify(async fd => {
	var content = fds[fd]
	if (typeof fd === 'number') clearFd(fd)
	if (!content) return
	var {file, folder, stream, reader, writer} = content
	// TODO
	if (reader)
		reader.close()
	if (writer)
		writer.close()
	// Note: C# has .Dispose(), JS has .close() variant
	if (stream)
		stream.close()
})


export var exists = callbackify(async path => {
	// Create absolute path and check for corrections (it thows proper Node-like error otherwise)
	path = getPathFromURL(path)
	nullCheck(path)
	try {
		await openStorageObject(path)
		return true
	} catch(err) {
		if (err.code !== 'ENOENT')
			throw err
		return false
	}
})



export var stat = callbackify(async path => {
	// Create absolute path and check for corrections (it thows proper Node-like error otherwise)
	path = getPathFromURL(path)
	nullCheck(path)
	// Access UWP's storage object
	// Note: Not wrapped in try/catching because openStorageObject() returns sanitized Node-like error object.
	var storageObject = await openStorageObject(path, 'stat')
	// Create Stats instance, wait for the hidden ready promise (UWP apis are async) and return it
	var stats = new Stats(storageObject)
	await stats._ready
	return stats
})

const DATE_ACCESSED = 'System.DateAccessed'

// time "Access Time" - Time when file data last accessed.
// mtime "Modified Time" - Time when file data last modified.
// ctime "Change Time" - Time when file status was last changed
export class Stats {

	constructor(storageObject) {
		this.storageObject = storageObject
		Object.defineProperty(this, '_ready', {
			enumerable: false,
			value: this._collectInfo()
		})
	}

	async _collectInfo() {
		var file = this.storageObject
		var {dateCreated} = file
		
		this.birthtime   = dateCreated
		this.birthtimeMs = dateCreated.valueOf()

		// Get basic properties
		var {size, dateModified} = await file.getBasicPropertiesAsync()
		this.size = size
		this.mtime   = this.ctime   = dateModified
		this.mtimeMs = this.ctimeMs = dateModified.valueOf()

		// Get extra properties
		var extraProperties = await file.properties.retrievePropertiesAsync([DATE_ACCESSED])
			.then(data => Object.assign({}, data))

		var dateAccessed = extraProperties[DATE_ACCESSED]
		this.atime   = dateAccessed
		this.atimeMs = dateAccessed.valueOf()
	}

	isFile() {
		return this.storageObject.constructor === StorageFile
	}

	isDirectory() {
		return this.storageObject.constructor === StorageFolder
	}

	isBlockDevice() {
	}

	isCharacterDevice() {
	}

	isSymbolicLink() {
	}

	isFIFO() {
	}

	isSocket() {
	}


}