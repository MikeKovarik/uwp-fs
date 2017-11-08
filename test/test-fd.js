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
	// WARNING: Follwing cwd points to actual location of this test and test logs as it was exported by node.
	// It gets rid of the bin/debug/appx subpath
	//let installPath = Windows.ApplicationModel.Package.current.installedLocation.path
	//let split = installPath.split('\\').slice(0, -3)
	//split.push('test')
	//var nodeCwd = split.join('\\')
	// This is location of where the application will be installed and unbundled
	var cwd = fs.cwd
}


describe('fd', () => {

	var firstFd
	it(`first ever .open('.') should return 3`, async function() {
		firstFd = await fs.open('.', 'r')
		return firstFd
	})
	it(`.close('.') should release fd 3 which can then be taken again`, async function() {
		await fs.close(firstFd)
		var secondFd = await fs.open('.', 'r')
		await fs.close(secondFd)
		return secondFd === 3
	})

	it(`.open() subsequent fds should be incremented`, async function() {
		// open three fds
		var a = await fs.open('.', 'r')
		var b = await fs.open('.', 'r')
		var c = await fs.open('.', 'r')
		// cleanup
		fs.close(a)
		fs.close(b)
		fs.close(c)
		// should be [3, 4, 5]
		return [a, b, c]
	})

	it(`.open() lowest unused (released) fd is used`, async function() {
		// open first three fds
		var a = await fs.open('.', 'r')
		var b = await fs.open('.', 'r')
		var c = await fs.open('.', 'r')
		// close fd 4
		fs.close(b)
		// open next fd which should get value 4 since we've previously released 4
		var d = await fs.open('.', 'r')
		// cleanup
		fs.close(a)
		fs.close(c)
		fs.close(d)
		// should be [3, 4, 5, 4]
		return [a, b, c, d]
	})


})


describe('path resolution', () => {

	// TODO
	// fixtures\ow-quotes.txt === .\fixtures\ow-quotes.txt
	// \Windows === C:\Windows
	// cwd + \\fixtures\\not-existing-file.txt === ABSOLUTE_PATH_CWD\\fixtures\\not-existing-file.txt

})


describe('.open', () => {

	afterEach(async fd => await fs.close(fd))


	it(`.`,    async () => fs.open('.', 'r'))

	it(`./`,   async () => fs.open('./', 'r'))
	it(`.\\`,  async () => fs.open('.\\', 'r'))

	it(`/`,    async () => fs.open('/', 'r'))
	it(`\\`,   async () => fs.open('\\', 'r'))

	it(`C:/`,  async () => fs.open('C:/', 'r'))
	it(`C:\\`, async () => fs.open('C:\\', 'r'))

	it(`fixtures`,    async () => fs.open('fixtures', 'r'))
	it(`./fixtures`,  async () => fs.open('./fixtures', 'r'))
	it(`./fixtures/`, async () => fs.open('./fixtures/', 'r'))

	it(`\\Windows`,   async () => fs.open('\\Windows', 'r'))

	it(`fixtures\\ow-quotes.txt`, async () => fs.open('fixtures\\ow-quotes.txt', 'r'))
	it(`.\\fixtures\\ow-quotes.txt`, async () => fs.open('.\\fixtures\\ow-quotes.txt', 'r'))
	it(`\\fixtures\\ow-quotes.txt`, async () => fs.open('\\fixtures\\ow-quotes.txt', 'r'))
	it(cwd + '\\fixtures\\ow-quotes.txt', async () => fs.open(cwd + '\\fixtures\\ow-quotes.txt', 'r'))

	it(`fixtures\\not-existing-file.txt`, async () => fs.open('fixtures\\not-existing-file.txt', 'r'))
	it(`.\\fixtures\\not-existing-file.txt`, async () => fs.open('.\\fixtures\\not-existing-file.txt', 'r'))
	it(`\\fixtures\\not-existing-file.txt`, async () => fs.open('\\fixtures\\not-existing-file.txt', 'r'))
	it(cwd + '\\fixtures\\not-existing-file.txt', async () => fs.open(cwd + '\\fixtures\\not-existing-file.txt', 'r'))
	
	// TODO test again non existing folder as well

})


describe('.readdir', () => {

	it(`./`, async () => fs.readdir('./'))
	it(`./fixtures/empty-folder`, async () => fs.readdir('./fixtures/empty-folder'))
	it(`./fixtures/non-existing`, async () => fs.readdir('./fixtures/non-existing'))
	it(`./fixtures/yet/another/subfolder`, async () => fs.readdir('./fixtures/yet/another/subfolder'))
	it(`./fixtures/ow-quotes.txt`, async () => fs.readdir('./fixtures/ow-quotes.txt'))
	it(`./fixtures/non-existing-file.txt`, async () => fs.readdir('./fixtures/non-existing-file.txt'))

})

describe('.readFile', () => {

	it(`./`, async () => fs.readFile('./'))
	it(`./fixtures/empty-folder`, async () => fs.readFile('./fixtures/empty-folder'))
	it(`./fixtures/non-existing`, async () => fs.readFile('./fixtures/non-existing'))
	it(`./fixtures/yet/another/subfolder`, async () => fs.readFile('./fixtures/yet/another/subfolder'))
	it(`./fixtures/ow-quotes.txt`, async () => fs.readFile('./fixtures/ow-quotes.txt'))
	it(`./fixtures/non-existing-file.txt`, async () => fs.readFile('./fixtures/non-existing-file.txt'))

	it(`fd before and after reading file`, async () => {
		var firstFd = await fs.open('.', 'r')
		fs.readFile('./fixtures/ow-quotes.txt')
		var secondFd = await fs.open('.', 'r')
		return [firstFd, secondFd]
	})

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