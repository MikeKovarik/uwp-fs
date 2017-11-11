import {fds, open, close, _scandir, reserveFd} from './syscall.mjs'


export async function readdir(path, callback) {
	var fd = reserveFd()
	try {
		await _scandir(path, fd)
		var storageFolder = fds[fd]
		var result = (await storageFolder.getItemsAsync())
			.map(getNames)
			.sort()
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

async function getList(storageFolder) {
	return (await storageFolder.getItemsAsync())
		.map(getNames)
		.sort()
}

function getNames(storageFile) {
	return storageFile.name
}