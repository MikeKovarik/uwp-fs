import {isUwp, readyPromises, extractDrive, isFolderDrive} from './util.mjs'
import {errnoException, UWP_ERR} from './errors.mjs'
import {getPathFromURL} from './path.mjs'



if (isUwp) {
	var {StorageFolder, StorageFile} = Windows.Storage
}


export async function openStorageObject(path, syscall) {
	// Sanitize backslashes, normalize format, and turn the path into absolute path.
	path = getPathFromURL(path)
	// Go straight to StorageFolder resolution if the path points to a drive.
	if (path.endsWith(':\\'))
		return _openStorageFolder(path, syscall)
	// Get the folder object that corresponds to absolute path in the file system.
	try {
		return await StorageFile.getFileFromPathAsync(path)
	} catch(err) {
		if (err.message == UWP_ERR.ENOENT || err.message === UWP_ERR._INCORRECT || err.message === UWP.ERR._UNSUPPORTED) {
			return _openStorageFolder(path, syscall)
		} else {
			throw handleError(err, syscall, path)
		}
	}
}


async function _openStorageFolder(path, syscall) {
	// Get the folder object that corresponds to absolute path in the file system.
	try {
		return await StorageFolder.getFolderFromPathAsync(path)
	} catch(err) {
		throw handleError(err, syscall, path)
	}
}

export async function openStorageFolder(path, syscall) {
	// Sanitize backslashes, normalize format, and turn the path into absolute path.
	path = getPathFromURL(path)
	// Get the folder object that corresponds to absolute path in the file system.
	try {
		return await StorageFolder.getFolderFromPathAsync(path)
	} catch(err) {
		switch (err.message) {
			// The path is incorrect or the file/folder is missing.
			case UWP_ERR.ENOENT:
				throw errnoException('ENOENT', syscall, path)
			// UWP does not have permission to access this scope.
			case UWP_ERR.EACCES:
				throw errnoException('EACCES', syscall, path)
			default:
				var storageFile
				try {
					storageFile = await StorageFile.getFileFromPathAsync(path)
				} catch(e) {
					throw handleError(err, syscall, path)
				} 
				throw errnoException('ENOTDIR', syscall, path)
		}
	}
}


export async function openStorageFile(path, syscall) {
	// Sanitize backslashes, normalize format, and turn the path into absolute path.
	path = getPathFromURL(path)
	// Get the file object that corresponds to absolute path in the file system.
	try {
		return await StorageFile.getFileFromPathAsync(path)
	} catch(err) {
		throw handleError(err, syscall, path)
	}
}





// Translates UWP errors into Node format (with code, errno and path)
export function handleError(err, syscall, path, storageObjectType) {
	// Compare UWP error messages with list of known meanings
	switch (err.message) {
		// The path is incorrect or the file/folder is missing.
		case UWP_ERR.ENOENT:
			throw errnoException('ENOENT', syscall, path)
		// UWP does not have permission to access this scope.
		case UWP_ERR.EACCES:
			throw errnoException('EACCES', syscall, path)
		// Incorrect parameter is usually thrown when trying to open folder as file and vice versa.
		/*case UWP_ERR._INCORRECT:
			if (storageObjectType === 'folder') {
				throw errnoException('ENOTDIR', syscall, path)
				break
			}*/
		default:
			throw errnoException(err, syscall, path)
	}
}