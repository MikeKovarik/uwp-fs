if (typeof require === 'function') {
	var originalFs = require('fs')
	var promisify = require('util').promisify
	var fs = {
		readFile: promisify(originalFs.readFile),
		writeFile: promisify(originalFs.writeFile),
	}
	var cwd = process.cwd()
} else {
	var fs = window['uwp-fs']
	var cwd = fs.cwd
	mouka.setup('cdd')
}


describe('.readFile', () => {

	it(`./fixtures/ow-quotes.txt`, async () => fs.readFile('./fixtures/ow-quotes.txt'))
/*
	it(`./fixtures/ow-quotes`, async () => fs.readFile('./fixtures/ow-quotes'))
	it(`./fixtures/non-existing-file.txt`, async () => fs.readFile('./fixtures/non-existing-file.txt'))
	it(`./`, async () => fs.readFile('./'))
	it(`./fixtures/empty-folder`, async () => fs.readFile('./fixtures/empty-folder'))
	it(`./fixtures/non-existing`, async () => fs.readFile('./fixtures/non-existing'))
	it(`./fixtures/yet/another/subfolder`, async () => fs.readFile('./fixtures/yet/another/subfolder'))

	it(`fd before and after reading file`, async () => {
		var firstFd = await fs.open('.', 'r')
		fs.readFile('./fixtures/ow-quotes.txt')
		var secondFd = await fs.open('.', 'r')
		return [firstFd, secondFd]
	})
*/
})
/*
describe('.writeFile', () => {

	var data = 'hello world'
	it(`./fixtures/empty-folder`, async () => fs.writeFile('./fixtures/empty-folder', data))
	it(`./fixtures/non-existing/new-file.txt`, async () => fs.writeFile('./fixtures/non-existing/new-file.txt', data))
	it(`./fixtures/new-file.txt`, async () => fs.writeFile('./fixtures/new-file.txt', data))

})
*/

/*
describe('readFile()', () => {

	it(`.readFile() existing relative filepath`, async function() {
		return fs.readFile('.\\fixtures\\ow-quotes.txt')
	})
	it(`.readFile() existing semi-absolute filepath`, async function() {
		return fs.readFile('\\fixtures\\ow-quotes.txt')
	})
	it(`.readFile() existing absolute filepath`, async function() {
		return fs.readFile(cwd + '\\fixtures\\ow-quotes.txt')
	})
	it(`.readFile() non-existing relative filepath`, async function() {
		return fs.readFile('.\\fixtures\\not-existing-file.txt')
	})
	it(`.readFile() non-existing semi-absolute filepath`, async function() {
		return fs.readFile('\\fixtures\\not-existing-file.txt')
	})
	it(`.readFile() non-existing absolute filepath`, async function() {
		return fs.readFile(cwd + '\\fixtures\\not-existing-file.txt')
	})
	
})


describe('writeFile()', () => {

	it(`.writeFile() non-existing absolute filepath`, async function() {
		return fs.writeFile('.\\non-existing-folder\\file.txt', 'data')
	})
	
})
*/