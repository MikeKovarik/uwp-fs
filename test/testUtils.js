var isNode = typeof require === 'function'
var isUwp = typeof Windows === 'object'

if (!isNode)
	var exports = window.testUtils = {}

exports.isNode = isNode
exports.isUwp = isUwp

if (isNode) {
	var originalFs = require('fs')
	var promisify = require('util').promisify
	var fs = {
		open: promisify(originalFs.open),
		read: promisify(originalFs.read),
		write: promisify(originalFs.write),
		close: promisify(originalFs.close),
		unlink: promisify(originalFs.unlink),
		readdir: promisify(originalFs.readdir),
		mkdir: promisify(originalFs.mkdir),
		rmdir: promisify(originalFs.rmdir),
		stat: promisify(originalFs.stat),
		cwd: process.cwd()
	}
} else {
	var fs = window['uwp-fs']
	var {getPathFromURL} = fs._internals
	var {cwd, cwdFolder} = fs
	// Tell mouka to change cwd to a location where node tests were done at.
	// Because despite having access for C:\, Windows denies write access to install location.
	// WARNING: we need to have permission to acces this location
	mouka.options.applyCwd = fs.uwpSetCwd
}

exports.fs = fs


if (isUwp) {
	var {StorageFolder, StorageFile} = Windows.Storage
}

// not using fs.exists because it's deprecated.
async function exists(path) {
	try {
		if (isNode) {
			await fs.stat(path)
			return true
		} else {
			path = getPathFromURL(path)
			try {
				await StorageFile.getFileFromPathAsync(path)
				return true
			} catch(err) {
				try {
					await StorageFolder.getFolderFromPathAsync(path)
					return true
				} catch(err) {
					return false
				}
			}
		}
	} catch(err) {
		return false
	}
}

async function ensureFile(path) {
	if (await exists(path)) return
	if (isNode) {
		await fs.close(await fs.open(path, 'w'))
	} else {
		path = getPathFromURL(path)
		var relative = path.slice(fs.cwd.length + 1)
		try {
			await fs.cwdFolder.getFileAsync(relative)
		} catch(err) {
			await fs.cwdFolder.createFileAsync(relative)
		}
	}
}

async function ensureFolder(path) {
	if (await exists(path)) return
	if (isNode) {
		await fs.mkdir(path)
	} else {
		path = getPathFromURL(path)
		var relative = path.slice(fs.cwd.length + 1)
		try {
			await fs.cwdFolder.getFolderAsync(relative)
		} catch(err) {
			await fs.cwdFolder.createFolderAsync(relative)
		}
	}
}

async function ensureDeleted(path) {
	if (await exists(path) === false) return
	if (isNode) {
		try {
			await fs.unlink(path)
		} catch(err) {
			await fs.rmdir(path)
		}
	} else {
		path = getPathFromURL(path)
		var relative = path.slice(fs.cwd.length + 1)
		try {
			var folder = await fs.cwdFolder.getFileAsync(relative)
			await folder.deleteAsync()
		} catch(err) {
			var file = await fs.cwdFolder.getFolderAsync(relative)
			await file.deleteAsync()
		}
	}
}


exports.exists = exists
exports.ensureFile = ensureFile
exports.ensureFolder = ensureFolder
exports.ensureDeleted = ensureDeleted
