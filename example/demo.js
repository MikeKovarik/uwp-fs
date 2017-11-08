var fs = window['uwp-fs']

var appPath = Windows.Storage.ApplicationData.current.localFolder.path

var link = document.createElement('a')
link.href = appPath

document.body.appendChild(link)

link.addEventListener('click', e => {
	Windows.System.Launcher.launchFolderAsync()
})

var {Pickers} = Windows.Storage



document.querySelector('#request-folder')
	.addEventListener('click', async e => {
		var folder = await fs.uwpPickAndCacheDrive()
	})


//fs.ready.then(main)
setTimeout(main, 1100)

async function main() {
/*
	fs.uwpTraverseStorage('C:\\Users\\kenrm\\OneDrive\\Dev\\uwp-fs')
		//.then(data => console.log('then', data))
		.catch(err => console.log('catch', err))

	fs.uwpTraverseStorage('C:\\Users\\kenrm\\OneDrive\\Dev\\uwp-fs\\LICENSE')
		//.then(data => console.log('then', data))
		.catch(err => console.log('catch', err))

	fs.uwpTraverseStorage('C:\\Users\\kenrm\\OneDrive\\Dev\\uwp-fs\\.gitignore')
		//.then(data => console.log('then', data))
		.catch(err => console.log('catch', err))

	fs.uwpTraverseStorage('C:\\Users\\kenrm\\OneDrive\\Dev\\uwp-fs\\index.mjs')
		//.then(data => console.log('then', data))
		.catch(err => console.log('catch', err))
*/

	fs.uwpExperiment('C:\\Users\\kenrm\\OneDrive\\Dev\\uwp-fs')
		.then(data => console.log('then', data))
		.catch(err => console.log('catch', err))

	fs.uwpExperiment('C:\\Users\\kenrm\\OneDrive\\Dev\\uwp-fs\\LICENSE')
		.then(data => console.log('then', data))
		.catch(err => console.log('catch', err))

	fs.uwpExperiment('C:\\Users\\kenrm\\OneDrive\\Dev\\uwp-fs\\index.mjs')
		.then(data => console.log('then', data))
		.catch(err => console.log('catch', err))

}