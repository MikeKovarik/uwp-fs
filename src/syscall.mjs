import {isUwp} from './util.mjs'
import {openStorageFolder, openStorageFile, openStorageObject} from './uwp-storageobject.mjs'
import {errnoException} from './errors.mjs'


if (isUwp) {
	var {StorageFolder, StorageFile} = Windows.Storage
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

// syscall used in: open
export async function _open(path, fd) {
	// Find empty fd number (slot for next descriptor we are about to open).
	if (fd === undefined)
		fd = reserveFd()
	// Try to get file or folder descriptor for given path and store it to the empty slot.
	fds[fd] = await openStorageObject(path, 'open')
	return fd
}
/*
	// Access UWP's File object
	var file = await targetFolder.getFileAsync(fileName)
	// Open file's read stream
	switch
	FileAccessMode.read
	FileAccessMode.readWrite
	var uwpStream = await file.openAsync(FileAccessMode.read)
*/


// syscall used in: close
export async function _close(fd) {
	if (typeof fd === 'number') clearFd(fd)
}

// syscall used in: readdir
export async function _scandir(path, fd) {
	// Find empty fd number (slot for next descriptor we are about to open).
	if (fd === undefined)
		fd = findEmpyFd()
	// Try to get folder descriptor for given path and store it to the empty slot.
	fds[fd] = await openStorageFolder(path, 'scandir')
	return fd
}

// syscall used in: readFile
// NOTE: this does not behave quite like actual Node's read syscall,
//       that is called like so binding.read(this.fd, buffer, offset, length, ...)
//       this merely just ensures proper errors are thrown in places where read syscall is used.
//       Actual reading is solved outside. But it might be worth rewriting and put the readin in here.
export async function _read(fd) {
	var storageObject = fds[fd]
	if (storageObject.constructor === StorageFolder)
		throw errnoException('EISDIR', 'read')
	return fd
}

/*
// buffer - is the buffer that the data will be written to.
// offset - is the offset in the buffer to start writing at.
// length - is an integer specifying the number of bytes to read.
// position - is an argument specifying where to begin reading from in the file. If position is null, data will be read from the current file position, and the file position will be updated. If position is an integer, the file position will remain unchanged.
export function _read(fd, buffer, offset, length, position) {
	var reader = readers[fd]
	var data = reader.readBytes(nodeBuffer)
	reader.close()
	return nodeBuffer
}

var iBuffer = await FileIO.readBufferAsync(storageFile)
var reader = DataReader.fromBuffer(iBuffer)

var nodeBuffer = Buffer.allocUnsafe(iBuffer.length)

_read(fd, nodeBuffer, 0, iBuffer.length, 0)
*/