import {isUwp, readyPromises} from './util.mjs'


export var cwd

if (isUwp) {
	
	// Path to local installation of the app.
	// App's source code (what the project includes) is there
	// If sideloaded it's in \bin\Debug\AppX of the folder where the Visual Studio project is.
	// Windows.ApplicationModel.Package.current.installedLocation
	var installFolder = Windows.ApplicationModel.Package.current.installedLocation

	// Path to %AppData%\Local\Packages\{id}\LocalState
	// It's empty and app's data can be stored there
	// Windows.Storage.ApplicationData.current.localFolder
	var dataFolder = Windows.Storage.ApplicationData.current.localFolder


	let subPath = location
		.pathname
		.slice(1) // remove first slash
		.split('/') // split into sections by slashes
		.slice(0, -1) // remove the last section (html filename)
		.join('\\') // join by windows style backslash

	cwd = installFolder.path + '\\' + subPath

	var cwdFolder
	var promise = installFolder.getFolderAsync(subPath)
		.then(folder => cwdFolder = folder)
	readyPromises.push(promise) 

}

export function uwpSetCwdFolder(newFolder) {
	cwdFolder = newFolder
}


// Windows filesystem uses \ instead of /. Node tolerates that, but UWP apis
// strictly require only \ or they'll throw error.
// Normalizes path by stripping unnecessary slashes and adding drive letter if needed
export function getPathFromURL(path) {
	// Strip spaces around and convert all slashes to windows backslashes
	path = path.trim().replace(/\//g, '\\')
	// convert absolute paths to absolute C:\ paths
	if (path.startsWith('\\'))
		path = 'C:' + path
	else if (!path.includes(':\\'))
		path = cwd + '\\' + path
	// Normalize the path
	var normalized = normalizeArray(path.split(/\\+/g)).join('\\')
	if (normalized.endsWith(':'))
		return normalized + '\\'
	else
		return normalized
}

function normalizeArray(parts) {
	var res = []
	for (var i = 0; i < parts.length; i++) {
		var p = parts[i]
		if (!p || p === '.')
			continue
		if (p === '..') {
			if (res.length && res[res.length - 1] !== '..')
				res.pop()
		} else {
			res.push(p)
		}
	}
	return res
}
