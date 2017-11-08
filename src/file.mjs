import {bufferFromIbuffer} from './conv/index.mjs' // TODO: spin into separate module
import {Readable, Writable} from 'stream'
import {isUwp} from './util.mjs'
import {fds, _open, _close, _read, reserveFd} from './syscall.mjs'
import {ReadStream, WriteStream} from './stream.mjs'


if (isUwp) {
	var {FileIO} = Windows.Storage
	var {DataReader, DataWriter} = Windows.Storage.Streams
	var COLLISION = Windows.Storage.CreationCollisionOption
}

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
		await _open(path, fd)
		await _read(fd)
		var storageFile = fds[fd]
		var iBuffer = await FileIO.readBufferAsync(storageFile)
		var result = bufferFromIbuffer(iBuffer)
		// Close file descriptor
		await _close(fd)
		if (callback) callback(null, result)
		return result
	} catch(err) {
		// Ensure we're leaving no descriptor open
		await _close(fd)
		if (callback) callback(err)
		throw err
	}
}
/*
export async function readFile(path, encoding, callback) {
	// encoding is optional
	if (typeof encoding === 'function') {
		callback = encoding
		encoding = 'utf8'
	}
	var fd = reserveFd()
	return _readFile(fd, path, encoding)
		.then(result => {
			if (callback) callback(null, result)
			return result
		})
		.catch(err => {
			// Ensure we're leaving no descriptor open
			await _close(fd)
			if (callback) callback(err)
			return err
		})
}
_readFile(fd, path, encoding) {
	await _open(path, fd)
	await _read(fd)
	var storageFile = fds[fd]
	var iBuffer = await FileIO.readBufferAsync(storageFile)
	var result = bufferFromIbuffer(iBuffer)
	// Close file descriptor
	await _close(fd)
	return result
}*/


function isFd(path) {
	return (path >>> 0) === path;
}

export async function writeFile(path, data, encoding, callback) {
	callback = maybeCallback(callback || options)
	options = getOptions({encoding: 'utf8', mode: 0o666, flag: 'w'}, options)

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
		//fd = await _open(path)
		var storageFile = await targetFolder.createFileAsync(fileName, COLLISION.replaceExisting)
		if (typeof data === 'string') {
			await FileIO.writeTextAsync(storageFile, data)
		} else {
			await FileIO.writeBytesAsync(storageFile, data)
		}
		if (callback) callback(null)
	} catch(err) {
		// Ensure we're leaving no descriptor open
		//await _close(fd)
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
