if (typeof require === 'function')
	var testUtils = require('./testUtils.js')
else
	mouka.setup('cdd')

var {fs, exists, ensureFolder, ensureFile, ensureDeleted} = testUtils


describe('.readdir', () => {
	return

	it(`./`, async () => fs.readdir('./'))
	it(`fixtures/empty-folder`, async () => fs.readdir('fixtures/empty-folder'))
	it(`fixtures/non-existing-folder-1`, async () => fs.readdir('fixtures/non-existing-folder-1'))
	it(`fixtures/yet/another/subfolder`, async () => fs.readdir('fixtures/yet/another/subfolder'))
	it(`fixtures/ow-quotes.txt`, async () => fs.readdir('fixtures/ow-quotes.txt'))
	it(`fixtures/non-existing-file-1.txt`, async () => fs.readdir('fixtures/non-existing-file-1.txt'))

})

// note: these tests can cleanup or setup whatever they need or do
describe('.rmdir', () => {

	it(`file`, async () => {
		var path = 'fixtures/file-to-delete-2.zip'
		await ensureFile(path)
		return [await fs.rmdir(path), await exists(path)]
	})
	it(`empty folder`, async () => {
		var path = 'fixtures/empty-folder-to-delete-2'
		await ensureFolder(path)
		return [await fs.rmdir(path), await exists(path)]
	})
	it(`folder with contents`, async () => {
		var path = 'fixtures/non-empty-folder-to-delete-2'
		await ensureFolder(path)
		await ensureFile(path + '/somefile.txt')
		return [await fs.rmdir(path), await exists(path)]
	})
	it(`non existing file`, async () => {
		var path = 'fixtures/non-existing-file-2.txt'
		await ensureDeleted(path)
		return [await fs.rmdir(path), await exists(path)]
	})
	it(`non existing folder`, async () => {
		var path = 'fixtures/non-existing-folder-2'
		await ensureDeleted(path)
		return [await fs.rmdir(path), await exists(path)]
	})

})


// note: these tests can cleanup or setup whatever they need or do
describe('.mkdir', () => {

	it(`existing file`, async () => {
		var path = 'fixtures/existing-file-3.txt'
		await ensureFile(path)
		return [await fs.mkdir(path), await exists(path)]
	})
	it(`existing folder`, async () => {
		var path = 'fixtures/existing-folder-3'
		await ensureFolder(path)
		return [await fs.mkdir(path), await exists(path)]
	})
	it(`non existing file`, async () => {
		var path = 'fixtures/non-existing-file-3.txt'
		await ensureDeleted(path)
		return [await fs.mkdir(path), await exists(path)]
	})
	it(`non existing folder`, async () => {
		var path = 'fixtures/non-existing-foler-3'
		await ensureDeleted(path)
		return [await fs.mkdir(path), await exists(path)]
	})

})
