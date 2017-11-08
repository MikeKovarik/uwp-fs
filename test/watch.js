if (typeof require === 'function') {
	var originalFs = require('fs')
	var promisify = require('util').promisify
	var fs = {
		open: promisify(originalFs.open),
		close: promisify(originalFs.close),
		readFile: promisify(originalFs.readFile),
		writeFile: promisify(originalFs.writeFile),
		readdir: promisify(originalFs.readdir),
		watch: promisify(originalFs.watch),
	}
	var cwd = process.cwd()
} else {
	var fs = window['uwp-fs']
	var cwd = fs.cwd
}


setTimeout(() => {

	fs.watch('fixtures/watch', (type, name) => console.log(type, name))

}, 1000)
