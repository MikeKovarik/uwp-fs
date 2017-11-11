if (typeof require === 'function') {
	var originalFs = require('fs')
	var promisify = require('util').promisify
	var fs = {
		open: promisify(originalFs.open),
		close: promisify(originalFs.close),
		readFile: promisify(originalFs.readFile),
		writeFile: promisify(originalFs.writeFile),
		readdir: promisify(originalFs.readdir),
		rename: promisify(originalFs.rename),
		unlink: promisify(originalFs.unlink),
		watch: originalFs.watch,
	}
	var cwd = process.cwd()
} else {
	var fs = window['uwp-fs']
	var cwd = fs.cwd
	mouka.setup('cdd')
}

var timeout = (millis = 0) => new Promise(resolve => setTimeout(resolve, millis))

describe('watch()', () => {

	describe('events, non-recursive', () => {

		var fswatcher
		before(() => fswatcher = fs.watch('fixtures/watch'))
		after(() => fswatcher.close())

		function watchIt(name, doSomething) {
			it(name, async () => {
				var changes = []
				var listener = (type, file) => changes.push([type, file])
				fswatcher.on('change', listener)
				await doSomething()
				await timeout(500)
				fswatcher.removeListener('change', listener)
				return changes
			})
		}

		watchIt(`creating xyz.txt`, () => fs.writeFile('fixtures/watch/xyz.txt', 'data'))

		watchIt(`deleting xyz.txt`, () => fs.unlink('fixtures/watch/xyz.txt'))

		watchIt(`creating and deleting xyz.txt`, async () => {
			await fs.writeFile('fixtures/watch/xyz.txt', 'data')
			await timeout(500)
			await fs.unlink('fixtures/watch/xyz.txt')
		})

		watchIt(`creating myfold/nested.txt`, async () => {
			await fs.writeFile('fixtures/watch/myfold/nested.txt', 'data')
		})

		watchIt(`deleting myfold/nested.txt`, async () => {
			await fs.unlink('fixtures/watch/myfold/nested.txt')
		})

		watchIt(`creating myfold/deeply/nested.txt`, async () => {
			await fs.writeFile('fixtures/watch/myfold/deeply/nested.txt', 'data')
		})

		watchIt(`deleting myfold/deeply/nested.txt`, async () => {
			await fs.unlink('fixtures/watch/myfold/deeply/nested.txt')
		})

	})

})
