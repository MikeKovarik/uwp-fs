import {_open, _close, reserveFd, fds} from './syscall.mjs'


export async function open(path, flags, mode, callback) {
	// TODO: flags
	// flag 'w' creates empty file
	var fd = reserveFd()
	var syscallPromise = _open(path, fd)
	syscallPromise
		.then(fd => callback && callback(null, fd))
		.catch(err => {
			_close(fd)
			if (callback) callback(err)
		})
	return syscallPromise
}

// fs.close
export function close(fd, callback) {
	_close(fd)
	if (callback)
		callback(null)
}


/*
Read data from the file specified by 'fd'.
'buffer' is the buffer that the data will be written to.
'offset' is the offset in the buffer to start writing at.
'length' is an integer specifying the number of bytes to read.
'position' is an argument specifying where to begin reading from in the file. If position is null, data will be read from the current file position, and the file position will be updated. If position is an integer, the file position will remain unchanged.
The callback is given the three arguments, '(err, bytesRead, buffer)'.
*/
export async function read(fd, buffer, offset, length, position, callback) {
	var storageObject = fds[fd]
	//if (callback) callback(null)
}