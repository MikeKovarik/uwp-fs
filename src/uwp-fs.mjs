import {Readable, Writable} from 'stream'
import {bufferFromIbuffer} from './conv/convertors.mjs'
import {defaultFolder, accessUwpFolder, getFolder} from './util.mjs'
import {setFolder} from './util.mjs'

export {setFolder} from './util.mjs'
export * from './conv/convertors.mjs'


if (typeof Windows !== 'undefined') {
	var {FileIO} = Windows.Storage
	var {DataReader, DataWriter} = Windows.Storage.Streams
	var COLLISION = Windows.Storage.CreationCollisionOption
}




export async function readdir(...args) {
	//var uwpFolder = getFolder(args)
	//var [filePath, callback] = args
	//var [targetFolder, fileName] = await accessUwpFolder(uwpFolder, filePath)
	//var items = await targetFolder.GetItemsAsync()
	//for (var item in items) {
	//	if (item.IsOfType(StorageItemTypes.Folder))
	//		console.log("Folder: " + item.Name);
	//	else
	//		console.log("File: " + item.Name + ", " + item.DateCreated);
	//}
}

// todo. make this not return promise if callback is defined
export async function readFile(...args) {
	var uwpFolder = getFolder(args)
	var [filePath, callback] = args
	var [targetFolder, fileName] = await accessUwpFolder(uwpFolder, filePath)
	var file = await targetFolder.getFileAsync(fileName)
	var iBuffer = await FileIO.readBufferAsync(file)
	var nodeBuffer = bufferFromIbuffer(iBuffer)
	if (callback)
		callback(null, nodeBuffer)
	else
		return nodeBuffer
}

// todo. make this not return promise if callback is defined
export async function writeFile(...args) {
	var uwpFolder = getFolder(args)
	var [filePath, data, encoding, callback] = args
	var [targetFolder, fileName] = await accessUwpFolder(uwpFolder, filePath)
	if (!callback) {
		// encoding is optional
		callback = encoding
		encoding = 'utf8'
	}
	var file = await targetFolder.createFileAsync(fileName, COLLISION.replaceExisting)
	if (typeof data === 'string') {
		if (encoding === 'utf8') {
			await FileIO.writeTextAsync(file, data)
		} else {
			console.warn(`writeFile does not implement other encoding than 'utf8' yet`)
		}
	} else {
		await FileIO.writeBytesAsync(file, data)
	}
	if (callback)
		callback(null)
}

/*
export function createReadStream(...args) {
	var stream = new Readable
	stream._read = function () {}
	_createReadStream(stream, args)
	return stream
}
async function _createReadStream(stream, args) {
	var uwpFolder = getFolder(args)
	var [filePath, options] = args
	var [targetFolder, fileName] = await accessUwpFolder(uwpFolder, filePath)
	var buffer = await readFile(targetFolder, fileName)
	stream.push(buffer)
	stream.push(null)
}
*/
export function createWriteStream(...args) {
	var stream = new Writable
	_createWriteStream(stream, args)
	return stream
}
async function _createWriteStream(stream, args) {
	var uwpFolder = getFolder(args)
	var [filePath, options] = args
	var [targetFolder, fileName] = await accessUwpFolder(uwpFolder, filePath)
	stream._write = (chunk, encoding, cb) => {
		console.log('_write')
		console.log('chunk', chunk)
		console.log('encoding', encoding)
		cb()
	}
	writeFile(targetFolder, fileName, data)
		.then(buffer => {
			console.log('then writeFile')
		})
}


import {readableStreamFromUwpStream} from './conv/convertors.mjs'

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


export async function watch() {
	var uwpFolder = getFolder(args)
	//var [filePath, options] = args
	//var [targetFolder, fileName] = await accessUwpFolder(uwpFolder, filePath)
}


export default {
	// node api
	readFile,
	writeFile,
	readFile,
	createReadStream,
	createWriteStream,
	watch,
	// custom api
	setFolder,
}