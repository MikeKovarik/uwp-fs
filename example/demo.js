var fs = window['uwp-fs']

var $installedLocation = document.querySelector('#installedLocation')
var $localFolder = document.querySelector('#localFolder')
var $requestAccess = document.querySelector('#request-access')
var $readFilePath = document.querySelector('#readFile-path')
var $readFile = document.querySelector('#readFile')
var $readdirPath = document.querySelector('#readdir-path')
var $readdir = document.querySelector('#readdir')
var $log = document.querySelector('#log')

var installedLocation = Windows.ApplicationModel.Package.current.installedLocation.path
$installedLocation.textContent = installedLocation
$localFolder.textContent = Windows.Storage.ApplicationData.current.localFolder.path

$readFilePath.value = installedLocation + '\\index.js'
$readdirPath.value = 'C:\\Windows'

$requestAccess.addEventListener('click', async e => {
	var folder = await fs.uwpPickAndCacheDrive()
})

$readFile.addEventListener('click', async e => {
	var path = $readFilePath.value || ''
	fs.readFile(path)
		.then(buffer => logToDom(buffer.toString()))
		.catch(logToDom)
})
$readdir.addEventListener('click', async e => {
	var path = $readdirPath.value || ''
	fs.readdir(path, (err, array) => {
		if (err)
			logToDom(err)
		else
			logToDom(array)
	})
})

function logToDom(arg) {
	var string
	try {
		string = JSON.stringify(arg, null, 2)
	} catch(err) {
		string = arg.toString()
	}
	$log.textContent = string
}

