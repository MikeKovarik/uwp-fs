import EventEmitter from 'events'
import util from 'util'
import {isUwp, getOptions, nullCheck} from './util.mjs'
import {fds, open, close, read, reserveFd} from './syscall.mjs'



if (isUwp) {
	var {StorageFolder, StorageFile, AccessCache} = Windows.Storage
	var {QueryOptions, CommonFileQuery, FolderDepth} = Windows.Storage.Search
}

//const errors = require('internal/errors');

var errnoException = util && util._errnoException || function(err, syscall, original) {
	if (typeof err !== 'number' || err >= 0 || !Number.isSafeInteger(err))
		throw new errors.TypeError('ERR_INVALID_ARG_TYPE', 'err', 'negative number')
	const name = errname(err)
	var message = `${syscall} ${name}`
	if (original) message += ` ${original}`
	const e = new Error(message)
	e.code = e.errno = name
	e.syscall = syscall
	return e
}


export async function watch(path, options, listener) {

	console.warn('watch not implemented properly yet (scoping, order of the events, etc...)')

	//handleError((path = getPathFromURL(path)))
	nullCheck(path)

	if (typeof options === 'function')
		listener = options

	options = getOptions(options, {
		persistent: true,
		recursive: false,
	})

	const watcher = new FSWatcher()
	watcher.start(path, options.persistent, options.recursive, options.encoding)

	if (listener)
		watcher.on('change', listener)

	return watcher
}



class FSWatcher extends EventEmitter {

	constructor(path) {
		super()
		this._onChange = this._onChange.bind(this)
		this._handle// = 
		/*this._handle.onchange = function(status, eventType, filename) {
			if (status < 0) {
				self._handle.close()
				const error = !filename ?
					errnoException(status, 'Error watching file for changes:') :
					errnoException(status, `Error watching file ${filename} for changes:`)
				error.filename = filename
				self.emit('error', error)
			} else {
				self.emit('change', eventType, filename)
			}
		}*/
	}

	// 'contentschanged' detail seems to be always null. There is no information about affected items.
	// FFS: changes in subfolder will have to be manual and recursive
	// Note: Node only fires 'rename' and 'change' events.
	// Creating file - 1x 'rename' with new name, 1x 'change' with the name of the file
	// Deleting file - 1x 'rename' with old name
	// Renaming file/folder - 2x 'rename' - one with old name, one with new name.
	// Creating/Deleting/Renaming file inside folder - 1x 'change' with name of the folder
	// Changing content of file - 2x 'change' with the name of the file
	async _onChange() {
		var recursive = true
		console.log('_onChange')

		//console.log('old', this._oldList)
		var newList = await this.getList()
		//console.log('new', newList)
		console.log('-', symmetricDiff(this._oldList, newList))

		// TODO, non recursive akorat emituje 'change' na slozku pokud se jeji primi childove zmeni
		// jakakoliv zmena hloubeji je ignorovana a zadny 'change' neni.
		function getPathToFile(path) {
			var index = path.lastIndexOf('\\')
			if (index !== -1)
				return path.slice(0, path.lastIndexOf('\\'))
		}

		var changes = []
		var pathChanges = {}
		// TODO: can't just sort it. the diff has to work on the array simmultaneously, otherwise we're always ending up
		// with name that closer to the end of alphabet as the last emitted rename
		var diff = symmetricDiff(this._oldList, newList).sort()
		//console.log('diff', diff)
		diff.map(filename => {
			// TODO: this still is not ideal
			var path = getPathToFile(filename)
			pathChanges[path] = (pathChanges[path] || 0) + 1
			return [filename, path]
		})
		.forEach(([filename, path]) => {
			// TODO: this still is not ideal
			var changesInPath = --pathChanges[path]
			if (path) {
				if (recursive)
					this.emit('change', 'rename', filename)
				if (changesInPath === 0)
					this.emit('change', 'change', path)
			} else {
				this.emit('change', 'rename', filename)
			}
		})
		this._oldList = newList
	}

	async getList() {
		console.log('this._query', this._query)
		var baseLength = this._query.folder.path.length + 1
		return (await this._query.getItemsAsync())
			.map(so => so.path.slice(baseLength))
			.sort()
	}

	start(path, persistent, recursive, encoding) {
		//handleError((path = getPathFromURL(path)))
		nullCheck(path)

		open(path).then(async fd => {
			var storageFolder = fds[fd]

			var options = new QueryOptions(CommonFileQuery.OrderByName, ['*'])
			options.folderDepth = FolderDepth.deep

			this._query = storageFolder.createItemQueryWithOptions(options)
			this._oldList = await this.getList()
			console.log(this._oldList)
			this._query.addEventListener('contentschanged', this._onChange)

		}).catch(err => console.log(err))

		/*var err
		if (err) {
			this.close()
			const error = errnoException(err, `watch ${path}`)
			error.filename = path
			throw error
		}*/
	}

	close() {
		this._handle// = 
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

function symmetricDiff(arr1, arr2) {
	var result = []
	for (var i = 0; i < arr1.length; i++)
		if (!arr2.includes(arr1[i]))
			result.push(arr1[i])
	for (i = 0; i < arr2.length; i++)
		if (!arr1.includes(arr2[i]))
			result.push(arr2[i])
	return result
}



function handleError(val, callback) {
	if (val instanceof Error) {
		if (typeof callback === 'function') {
			process.nextTick(callback, val)
			return true
		} else throw val
	}
	return false
}
