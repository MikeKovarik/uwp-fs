import {isUwp, isFolderDrive} from './util.mjs'


// TODO: error codes
// https://nodejs.org/api/errors.html#errors_common_system_errors

if (isUwp) {
	var {Pickers, AccessCache} = Windows.Storage
	var uwpStorageCache = AccessCache.StorageApplicationPermissions.futureAccessList
/*
	const warnMessage = `UWP-FS does not have permission to access C:\\.
	FS module might not behave as expected.
	Use .uwpPickAndCacheDrive() to force user to give you the permission.`

	async function fetchCachedDrives() {
		var folderPromises = uwpStorageCache.entries
			.map(entry => entry.token)
			.map(token => uwpStorageCache.getItemAsync(token))
		;(await Promise.all(folderPromises))
			.filter(isFolderDrive)
			.forEach(drive => {
				var driveLetter = extractDrive(drive.path)
				uwpDrives.set(driveLetter, drive)
				uwpDrives.set(driveLetter.toUpperCase(), drive)
			})
		if (!uwpDrives.has('c')) {
			console.warn(warnMessage)
			setTimeout(() => console.warn(warnMessage), 1000)
		}
	}*/
}

export async function uwpPickAndCacheDrive() {
	var folder = await fs.uwpPickFolder()
	if (folder === null)
		throw new Error(`Folder selection canceled`)
	// Filter out ordinary folders because we need full access to the root (drives) to work properly
	// like node APIs do.
	if (!isFolderDrive(folder))
		throw new Error(`Selected folder is not a drive but just a subfolder '${folder.path}', 'fs' module will not work properly`)
	// Application now has read/write access to all contents in the picked folder (including sub-folders)
	uwpStorageCache.add(folder)
	return folder
}


// viewMode sets what style the picker should have. Either 'list' or 'thumbnal'
// startLocation sets where the picker should start.
function applyPickerOptions(picker, ext = ['*'], mode = 'list', startLoc = 'desktop') {
	picker.viewMode = Windows.Storage.Pickers.PickerViewMode[mode]
	picker.suggestedStartLocation = Pickers.PickerLocationId[startLoc]
	picker.fileTypeFilter.replaceAll(ext)
	return picker
}

// Returns UWP StorageFolder
export function uwpPickFolder(...args) {
	var picker = new Pickers.FolderPicker()
	applyPickerOptions(picker, ...args)
	return picker.pickSingleFolderAsync()
}

// Returns UWP StorageFolder
export function uwpPickFile(...args) {
	var picker = new Pickers.FileOpenPicker()
	applyPickerOptions(picker, ...args)
	return picker.pickSingleFileAsync()
}

export function uwpPickFileSave(...args) {
	var picker = new Pickers.FileSavePicker()
	var [extensions, viewMode, startLocation] = defaultPickerOptions(args)
	picker.viewMode = Windows.Storage.Pickers.PickerViewMode[viewMode]
}
