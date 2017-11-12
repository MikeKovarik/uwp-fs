if (typeof require === 'function')
	var testUtils = require('./testUtils.js')
else
	mouka.setup('cdd')

var {fs, exists, ensureFolder, ensureFile, ensureDeleted} = testUtils


describe('.readdir', () => {

	it(`fd`, async () => {
		var first = await fs.open('.', 'r')
		fs.readdir('fixtures/non-empty-folder')
		var second = await fs.open('.', 'r')
		var result = [first, second]
		fs.close(first)
		fs.close(second)
		return result
	})
	it(`fixtures/non-empty-folder`, async () => fs.readdir('fixtures/non-empty-folder'))
	it(`fixtures/empty-folder`, async () => fs.readdir('fixtures/empty-folder'))
	it(`fixtures/non-existing-folder-1`, async () => fs.readdir('fixtures/non-existing-folder-1'))
	it(`fixtures/yet/another/subfolder`, async () => fs.readdir('fixtures/yet/another/subfolder'))
	it(`fixtures/ow-quotes.txt`, async () => fs.readdir('fixtures/ow-quotes.txt'))
	it(`fixtures/non-existing-file-1.txt`, async () => fs.readdir('fixtures/non-existing-file-1.txt'))

})

// note: these tests can cleanup or setup whatever they need or do
describe('.rmdir', () => {

	it(`file`, async () => {
		var path = 'fixtures/dynamic/file-to-delete-2.zip'
		await ensureFile(path)
		return [await fs.rmdir(path), await exists(path)]
	})
	it(`empty folder`, async () => {
		var path = 'fixtures/dynamic/empty-folder-to-delete-2'
		await ensureFolder(path)
		return [await fs.rmdir(path), await exists(path)]
	})
	it(`folder with contents`, async () => {
		var path = 'fixtures/dynamic/non-empty-folder-to-delete-2'
		await ensureFolder(path)
		await ensureFile(path + '/somefile.txt')
		return [await fs.rmdir(path), await exists(path)]
	})
	it(`non existing file`, async () => {
		var path = 'fixtures/dynamic/non-existing-file-2.txt'
		await ensureDeleted(path)
		return [await fs.rmdir(path), await exists(path)]
	})
	it(`non existing folder`, async () => {
		var path = 'fixtures/dynamic/non-existing-folder-2'
		await ensureDeleted(path)
		return [await fs.rmdir(path), await exists(path)]
	})

})


// note: these tests can cleanup or setup whatever they need or do
describe('.mkdir', () => {

	it(`simple`, async () => {
		var path = 'deleteme'
		await ensureFile(path)
		var status = await exists(path)
		await ensureDeleted(path)
		return status
	})
	it(`existing file`, async () => {
		var path = 'fixtures/dynamic/existing-file-3.txt'
		await ensureFile(path)
		return [await fs.mkdir(path), await exists(path)]
	})
	it(`existing folder`, async () => {
		var path = 'fixtures/dynamic/existing-folder-3'
		await ensureFolder(path)
		return [await fs.mkdir(path), await exists(path)]
	})
	it(`non existing file`, async () => {
		var path = 'fixtures/dynamic/non-existing-file-3.txt'
		await ensureDeleted(path)
		return [await fs.mkdir(path), await exists(path)]
	})
	it(`non existing folder`, async () => {
		var path = 'fixtures/dynamic/non-existing-foler-3'
		await ensureDeleted(path)
		return [await fs.mkdir(path), await exists(path)]
	})
	it(`nested cascading`, async () => {
		await ensureDeleted('fixtures/dynamic/nested')
		return [
			await  fs.mkdir('fixtures/dynamic/nested/'),
			await  fs.mkdir('fixtures/dynamic/nested/very/'),
			await  fs.mkdir('fixtures/dynamic/nested/very/deeply'),
			await    exists('fixtures/dynamic/nested/very/deeply')
		]
	})
	it(`nested directly`, async () => {
		await ensureDeleted('fixtures/dynamic/nested')
		return [
			await  fs.mkdir('fixtures/dynamic/nested/very/deeply'),
			await    exists('fixtures/dynamic/nested/very/deeply')
		]
	})
	it(`nested in file`, async () => {
		await ensureDeleted('fixtures/dynamic/xyz.txt')
		var path = 'fixtures/dynamic/xyz.txt/folder'
		await ensureDeleted(path)
		return [await fs.mkdir(path), await exists(path)]
	})

})
