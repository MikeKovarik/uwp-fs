export var defaultFolder

if (typeof Windows !== 'undefined') {
	var applicationData = Windows.Storage.ApplicationData.current
	var localFolder = applicationData.localFolder
	defaultFolder = localFolder
}

export function setFolder(newFolder) {
	defaultFolder = newFolder
}

export function getFolder(args) {
	if (typeof args[0] !== 'string')
		return args.shift()
	else
		return defaultFolder
}


export async function accessUwpFolder(folder, path, ensure = false) {
	if (path.includes('\\'))
		path = path.replace(/\\/g, '/')
	if (path.includes('/')) {
		if (path.startsWith('/')) 
			path = path.slice(1) // TODO
		else if (path.startsWith('./'))
			path = path.slice(2)
	}
	if (path.includes('/')) {
		var [folderPath, fileName] = splitPath(path)
		// TODO: handle '..' to go up
		try {
			folder = await folder.getFolderAsync(folderPath)
		} catch(err) {
			if (ensure)
				folder = await createPath(folder, folderPath)
			else {
				var desiredFilePath = `${folder.path}/${folderPath}/${fileName}`
				throw new Error(`ENOENT: no such file or directory, open '${desiredFilePath}'`)
			}
		}
		return [folder, fileName]
	} else {
		return [folder, path]
	}
}

async function createPath(folder, path) {
	var sections = path.split('/')
	var section
	while (section = sections.shift()) {

	}
}

function splitPath(path) {
	var index = path.lastIndexOf('/')
	return [
		path.slice(0, index),
		path.slice(index + 1)
	]
}