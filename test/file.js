if (typeof require === 'function')
	var testUtils = require('./testUtils.js')
else
	mouka.setup('cdd')

var {fs, exists, ensureFolder, ensureFile, ensureDeleted} = testUtils


describe('.readFile', () => {

	function itReadsFile(path) {
		it(path, async () => fs.readFile(path))
	}

	// file
	itReadsFile(`./fixtures/ow-quotes.txt`)
	itReadsFile(`./fixtures/Empty.dat`)
	itReadsFile(`./fixtures/EXTENSIONLESS`)
	// folders
	itReadsFile(`./`)
	itReadsFile(`./fixtures/`)
	itReadsFile(`./fixtures/empty-folder`)
	itReadsFile(`./fixtures/yet/another/subfolder`)
	// incorrect partial path or missing files/folders
	itReadsFile(`./fixtures/ow-quotes`)
	itReadsFile(`./fixtures/non-existing-file.txt`)
	itReadsFile(`./fixtures/non-existing`)
	itReadsFile(`./fixtures/non-existing-folder/non-existing-file.txt`)

	it(`fd before and after reading file`, async () => {
		var firstFd = await fs.open('.', 'r')
		fs.readFile('./fixtures/ow-quotes.txt')
		var secondFd = await fs.open('.', 'r')
		return [firstFd, secondFd]
	})

	// Encodings rely on buffer module
	it('encoding: ascii', async () => fs.readFile(`./fixtures/ow-quotes.txt`, 'ascii'))
	it('encoding: utf8', async () => fs.readFile(`./fixtures/ow-quotes.txt`, 'utf8'))
	it('encoding: utf16le', async () => fs.readFile(`./fixtures/ow-quotes.txt`, 'utf16le'))
	it('encoding: ucs2', async () => fs.readFile(`./fixtures/ow-quotes.txt`, 'ucs2'))
	it('encoding: base64', async () => fs.readFile(`./fixtures/ow-quotes.txt`, 'base64'))
	it('encoding: latin1', async () => fs.readFile(`./fixtures/ow-quotes.txt`, 'latin1'))
	it('encoding: binary', async () => fs.readFile(`./fixtures/ow-quotes.txt`, 'binary'))
	it('encoding: hex', async () => fs.readFile(`./fixtures/ow-quotes.txt`, 'hex'))

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
describe('writeFile()', () => {

	it(`.writeFile() non-existing absolute filepath`, async function() {
		return fs.writeFile('.\\non-existing-folder\\file.txt', 'data')
	})
	
})
*/