import {isUwp, callbackify, nullCheck} from './util.mjs'
import {fds, open, close, reserveFd} from './syscall.mjs'
import {openStorageFolder} from './uwp-storageobject.mjs'


export var readdir = callbackify(async path => {
	// Access StorageFolder directly, because readdir doesn't use .open() and FDs
	var folder = await openStorageFolder(path, 'scandir')
	return (await folder.getItemsAsync())
		.map(file => file.name)
		.sort(caseInsensitiveSort)
})

function caseInsensitiveSort(a, b) {
	a = a.toLowerCase()
	b = b.toLowerCase()
	if (a == b) return 0
	if (a > b) return 1
	return -1
}