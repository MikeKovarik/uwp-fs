import {ReadStream, WriteStream} from './stream.mjs'
//import {bufferFromIbuffer} from './conv/index.mjs' // TODO: spin into separate module
import {isUwp, getOptions, nullCheck, callbackify} from './util.mjs'
import {getPathFromURL} from './path.mjs'
import {open, close, read} from './syscall.mjs'


if (isUwp) {
	var {FileIO} = Windows.Storage
	var {DataReader, DataWriter} = Windows.Storage.Streams
	var COLLISION = Windows.Storage.CreationCollisionOption
}

export var readFile = callbackify(async (path, options) => {
	options = getOptions(options, {flag: 'r'})
	//path = getPathFromURL(path)
	//nullCheck(path)
	var fd = await open(path)
	//await read(fd)
	//var storageFile = fds[fd]
	//var iBuffer = await FileIO.readBufferAsync(storageFile)
	//var result = bufferFromIbuffer(iBuffer)
	var result = read(fd, 'TODO', 'TODO', 'TODO', 4)
	// Close file descriptor
	await close(fd)
	return result
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

export async function writeFile(path, data, encoding, callback) {
	callback = maybeCallback(callback || options)
	options = getOptions(options, {encoding: 'utf8', mode: 0o666, flag: 'w'})

	if (isFd(path)) {
		writeFd(path, true)
		return
	}

	fs.open(path, options.flag, options.mode)
		.then(fd => writeFd(fd, false))
		.catch(openErr => callback(openErr))

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
