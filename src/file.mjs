import {Buffer, kMaxLength} from 'buffer'
import {ReadStream, WriteStream} from './stream.mjs'
import {isUwp, getOptions, nullCheck, callbackify} from './util.mjs'
import {getPathFromURL} from './path.mjs'
import {fds, open, close, read, _read} from './syscall.mjs'


if (isUwp) {
	var {FileIO} = Windows.Storage
	var {DataReader, DataWriter} = Windows.Storage.Streams
	var COLLISION = Windows.Storage.CreationCollisionOption
}

export var readFile = callbackify(async (path, options) => {

	// NOTE: it's really 'flag' and not 'flags' like it's in fs.open
	options = getOptions(options, {encoding: null, flag: 'r'})

	var isUserFd = isFd(path)
	var fd = isUserFd ? path : await open(path, options.flag)

	// Access descriptor to avoid creating an fs.Stats instance for our internal use.
	var {stream} = fds[fd]
	// Get the size of the file (or folder).
	var size = stream ? stream.size : 0
	// Throw errors if the size is invalid.
	//if (size === 0)
	//	return Buffer.alloc(0)
	if (size > kMaxLength) {
		err = new RangeError('File size is greater than possible Buffer: ' + `0x${kMaxLength.toString(16)} bytes`)
		close(fd)
		throw err
	}

	try {
		// Try to allocate enough memory for the size of the file.
		var buffer = Buffer.allocUnsafe(size)
		// Read (repeatedly if needed) the file into previously allocated buffer.
		var offset = 0
		// Do at least one iteration (even for folders) because read syscall can handle and  fire additional errors.
		do {
			let {bytesRead} = await _read(fd, buffer, offset, size, -1)
			offset += bytesRead
			// Break the loop in case we're unable to read anything.
			if (bytesRead === 0)
				break
		} while (offset < size)
	} catch (err) {
		// All the errors received here should be already in the Node-like format and we can
		// rethrow them after we safely close the file's fd.
		close(fd)
		throw err
	}

	// File sucessfully read. Close file descriptor and return filled buffer.
	if (!isUserFd)
		await close(fd)

	// TODO: Investigate if some work needs to be done on our side (or if the buffer module handles it)
	if (options.encoding !== null)
		return buffer.toString(options.encoding)
	else
		return buffer

})
/*
export async function readFile(path, encoding, callback) {
	//callback = maybeCallback(callback || options)
	//options = getOptions(options, { flag: 'r' })
	//if (handleError((path = getPathFromURL(path)), callback)) return
	//if (!nullCheck(path, callback)) return
	// encoding is optional
	if (typeof encoding === 'function') {
		callback = encoding
		encoding = 'utf8'
	}
	var fd = reserveFd()
	try {
		await open(path, fd)
		await read(fd)
		var storageFile = fds[fd]
		var iBuffer = await FileIO.readBufferAsync(storageFile)
		var result = bufferFromIbuffer(iBuffer)
		// Close file descriptor
		await close(fd)
		if (callback) callback(null, result)
		return result
	} catch(err) {
		// Ensure we're leaving no descriptor open
		await close(fd)
		if (callback) callback(err)
		throw err
	}
}
*/
/*
export async function readFile(path, encoding, callback) {
	// encoding is optional
	if (typeof encoding === 'function') {
		callback = encoding
		encoding = 'utf8'
	}
	var fd = reserveFd()
	return readFile(fd, path, encoding)
		.then(result => {
			if (callback) callback(null, result)
			return result
		})
		.catch(err => {
			// Ensure we're leaving no descriptor open
			await close(fd)
			if (callback) callback(err)
			return err
		})
}
readFile(fd, path, encoding) {
	await open(path, fd)
	await read(fd)
	var storageFile = fds[fd]
	var iBuffer = await FileIO.readBufferAsync(storageFile)
	var result = bufferFromIbuffer(iBuffer)
	// Close file descriptor
	await close(fd)
	return result
}*/


function isFd(path) {
	return (path >>> 0) === path;
}

export async function writeFile(path, data, encoding) {
	callback = maybeCallback(callback || options)
	options = getOptions(options, {encoding: 'utf8', mode: 0o666, flag: 'w'})

	if (isFd(path))
		var fd = path
	else
		var fd = await fs.open(path, options.flag, options.mode)

	await writeFd(fd, true)

	function writeFd(fd, isUserFd) {
	}

	//var fd = reserveFd()
	try {
		//fd = await open(path)
		var storageFile = await targetFolder.createFileAsync(fileName, COLLISION.replaceExisting)
		if (typeof data === 'string') {
			await FileIO.writeTextAsync(storageFile, data)
		} else {
			await FileIO.writeBytesAsync(storageFile, data)
		}
		if (callback) callback(null)
	} catch(err) {
		// Ensure we're leaving no descriptor open
		//await close(fd)
		if (callback) callback(err)
		throw err
	}
}
/*
fs.writeFile = function(path, data, options, callback) {
  callback = maybeCallback(callback || options);
  options = getOptions(options, { encoding: 'utf8', mode: 0o666, flag: 'w' });
  const flag = options.flag || 'w';

  if (isFd(path)) {
    writeFd(path, true);
    return;
  }

  fs.open(path, flag, options.mode, function(openErr, fd) {
    if (openErr) {
      callback(openErr);
    } else {
      writeFd(fd, false);
    }
  });

  function writeFd(fd, isUserFd) {
    var buffer = isUint8Array(data) ?
      data : Buffer.from('' + data, options.encoding || 'utf8');
    var position = /a/.test(flag) ? null : 0;

    writeAll(fd, isUserFd, buffer, 0, buffer.length, position, callback);
  }
};

*/





export function createReadStream(path, options) {
	return new ReadStream(path, options)
}

export function createWriteStream(path, options) {
	return new WriteStream(path, options)
}
