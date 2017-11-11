if (typeof require === 'function') {
	var originalFs = require('fs')
	var promisify = require('util').promisify
	var fs = {
		readdir: promisify(originalFs.readdir),
	}
	var cwd = process.cwd()
} else {
	var fs = window['uwp-fs']
	var cwd = fs.cwd
	mouka.setup('cdd')
}


describe('.readdir', () => {

	it(`./`, async () => fs.readdir('./'))
	it(`./fixtures/empty-folder`, async () => fs.readdir('./fixtures/empty-folder'))
	it(`./fixtures/non-existing`, async () => fs.readdir('./fixtures/non-existing'))
	it(`./fixtures/yet/another/subfolder`, async () => fs.readdir('./fixtures/yet/another/subfolder'))
	it(`./fixtures/ow-quotes.txt`, async () => fs.readdir('./fixtures/ow-quotes.txt'))
	it(`./fixtures/non-existing-file.txt`, async () => fs.readdir('./fixtures/non-existing-file.txt'))

})
