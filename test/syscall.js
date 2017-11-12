if (typeof require === 'function') {
	var originalFs = require('fs')
	var promisify = require('util').promisify
	var fs = {
		open: promisify(originalFs.open),
		close: promisify(originalFs.close),
		read: promisify(originalFs.read),
		exists: promisify(originalFs.exists),
		stat: promisify(originalFs.stat),
	}
	var cwd = process.cwd()
} else {
	var fs = window['uwp-fs']
	var cwd = fs.cwd
	mouka.setup('cdd')
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



describe('.open', () => {

	afterEach(async fd => await fs.close(fd))

	it(`./`,   async () => fs.open('./', 'r'))
	it(`C:\\`, async () => fs.open('C:\\', 'r'))
	it(`\\Windows`,   async () => fs.open('\\Windows', 'r'))

	it(`fixtures\\ow-quotes.txt`, async () => fs.open('fixtures\\ow-quotes.txt', 'r'))
	it(`fixtures\\not-existing-file.txt`, async () => fs.open('fixtures\\not-existing-file.txt', 'r'))
	it(`fixtures/not-existing-foler/`, async () => fs.open('fixtures/not-existing-foler/', 'r'))

})



describe('.read', () => {

	describe(`file, correct path, fd with 'r' flag`, () => {

		var fd
		beforeEach(async () => fd = await fs.open('fixtures/ow-quotes.txt', 'r'))
		afterEach(async () => await fs.close(fd))

		// note: filling buffer with 1s to test proper reading into buffer.

		const content = 'The world could always use more healers!'

		it(`whole file`, async () => {
			var buffer = Buffer.alloc(content.length, 1)
			return fs.read(fd, buffer, 0, content.length, 0)
		})
		it(`partial (first half)`, async () => {
			var buffer = Buffer.alloc(20, 1)
			return fs.read(fd, buffer, 0, 20, 0)
		})
		it(`partial (second half)`, async () => {
			var buffer = Buffer.alloc(20, 1)
			return fs.read(fd, buffer, 0, 20, 20)
		})
		it(`sebsequent, by chunks`, async () => {
			var buffer = Buffer.alloc(40, 1)
			await fs.read(fd, buffer, 0, 10, 0)
			await fs.read(fd, buffer, 10, 10, 10)
			await fs.read(fd, buffer, 20, 10, 20)
			await fs.read(fd, buffer, 30, 10, 30)
			return buffer
		})
		it(`sebsequent, by chunks with -1 position`, async () => {
			var buffer = Buffer.alloc(40, 1)
			await fs.read(fd, buffer, 0, 10, -1)
			await fs.read(fd, buffer, 10, 10, -1)
			await fs.read(fd, buffer, 20, 10, -1)
			await fs.read(fd, buffer, 30, 10, -1)
			return buffer
		})
		it(`7 characters from middle of file into beginning of small buffer`, async () => {
			var buffer = Buffer.alloc(7, 1)
			return fs.read(fd, buffer, 0, 7, 32)
		})
		it(`into second half of buffer`, async () => {
			var buffer = Buffer.alloc(17, 1)
			return fs.read(fd, buffer, 10, 7, 32)
		})
		it(`into second middle of buffer`, async () => {
			var buffer = Buffer.alloc(17, 1)
			return fs.read(fd, buffer, 5, 7, 32)
		})
		it(`into beginning of buffer`, async () => {
			var buffer = Buffer.alloc(17, 1)
			return fs.read(fd, buffer, 0, 7, 32)
		})
		it(`rewrite`, async () => {
			var buffer = Buffer.alloc(6, 1)
			await fs.read(fd, buffer, 0, 6, 33)
			await fs.read(fd, buffer, 0, 5, 4)
			return buffer
		})

		// todo: offset negative
		// todo: offset 0
		// todo: offset in middle
		// todo: offset beyond
		// todo: position negative
		// todo: position 0
		// todo: position in middle
		// todo: position beyond

		// buffer size 15, read 9 characters at offset 13
		it(`offset overflowing end of buffer`, async () => {
			var buffer = Buffer.alloc(15, 1)
			return fs.read(fd, buffer, 13, 9, 0)
		})
		// buffer size 15, read into offset 18
		it(`offset beyond the size of buffer`, async () => {
			var buffer = Buffer.alloc(15, 1)
			return fs.read(fd, buffer, 18, 9, 0)
		})
		// buffer size 15, read 9 characters into buffer of the same size, but at -2 offset
		it(`offset negative`, async () => {
			var buffer = Buffer.alloc(15, 1)
			return fs.read(fd, buffer, -2, 9, 0)
		})
		// file has 40 character, read 15, starting at position 32
		it(`position overflowing end of file`, async () => {
			var buffer = Buffer.alloc(15, 1)
			return fs.read(fd, buffer, 0, 15, 32)
		})
		it(`position beyond the size of file`, async () => {
			var buffer = Buffer.alloc(15, 1)
			return fs.read(fd, buffer, 0, 15, 50)
		})
		// read 20 chars starting at -10 position in stream
		it(`position negative`, async () => {
			var buffer = Buffer.alloc(20, 1)
			return fs.read(fd, buffer, 0, 20, -10)
		})

		// read 26 characters into buffer only 13 bytes wide
		it(`into small buffer`, async () => {
			var buffer = Buffer.alloc(13, 1)
			return fs.read(fd, buffer, 0, 26, 0)
		})
		it(`into undefined buffer`, async () => {
			var buffer = undefined
			return fs.read(fd, buffer, 0, 26, 0)
		})
		it(`into null buffer`, async () => {
			var buffer = null
			return fs.read(fd, buffer, 0, 26, 0)
		})
		it(`into empty object buffer`, async () => {
			var buffer = {}
			return fs.read(fd, buffer, 0, 26, 0)
		})
		it(`into empty array buffer`, async () => {
			var buffer = []
			return fs.read(fd, buffer, 0, 26, 0)
		})

	})

	describe(`folder and incorrect or partial paths, fd with 'r' flag`, () => {

		var fd
		afterEach(async () => await fs.close(fd))

		function itReads(path) {
			it(path, async () => {
				var fd = await fs.open(path, 'r')
				var buffer = Buffer.alloc(3)
				return fs.read(fd, buffer, 0, 3, 0)
			})
		}

		// file
		itReads(`./fixtures/ow-quotes.txt`)
		// folders
		itReads(`./`)
		itReads(`./fixtures/`)
		itReads(`./fixtures/empty-folder`)
		itReads(`./fixtures/yet/another/subfolder`)
		// incorrect partial path or missing files/folders
		itReads(`./fixtures/ow-quotes`)
		itReads(`./fixtures/non-existing-file.txt`)
		itReads(`./fixtures/non-existing`)
		itReads(`./fixtures/non-existing-folder/non-existing-file.txt`)

	})

	describe(`edge cases`, () => {

		it(`empty file`, async () => {
			var fd = await fs.open('fixtures/Empty.dat', 'r')
			var buffer = Buffer.alloc(0)
			return fs.read(fd, buffer, 0, 0, 0)
		})

	})

	// TODO: other flags and malformed arguments

})


describe('.exists', () => {

	it(`file`, async () => fs.exists('fixtures/ow-quotes.txt'))
	it(`folder`, async () => fs.exists('fixtures'))
	it(`non existing file`, async () => fs.exists('fixtures/not-existing-file.txt'))
	it(`non existing folder`, async () => fs.exists('fixtures/not-existing-foler'))

})


describe('.unlink', () => {

	it(`file`, async () => fs.unlink('fixtures/to-be-deleted.zip'))
	it(`folder`, async () => fs.unlink('folder-to-delete'))
	it(`non existing file`, async () => fs.unlink('fixtures/not-existing-file.txt'))
	it(`non existing folder`, async () => fs.unlink('fixtures/not-existing-foler'))

})




// WARNING: stats of files are almost impossible to comparatively match becaute they'll
//          be deleted and recreated with each compile.
//          Testing is only based on 'does it exist' and 'what type is it' basis.
describe('.stat', () => {

	function getShapeOfStat(stat) {
		return {
			size: stat.size,
			atimeMs: typeof stat.atimeMs,
			mtimeMs: typeof stat.mtimeMs,
			ctimeMs: typeof stat.ctimeMs,
			birthtimeMs: typeof stat.birthtimeMs,
			atime: stat.atime && stat.atime.constructor.name,
			mtime: stat.mtime && stat.mtime.constructor.name,
			ctime: stat.ctime && stat.ctime.constructor.name,
			birthtime: stat.birthtime && stat.birthtime.constructor.name,
		}
	}

	it(`file`, async () => {
		var stat = await fs.stat('fixtures/ow-quotes.txt')
		return getShapeOfStat(stat)
	})

	it(`folder`, async () => {
		var stat = await fs.stat('fixtures')
		return getShapeOfStat(stat)
	})

	it(`non existing file`, async () => {
		var stat = await fs.stat('fixtures/not-existing-file.txt')
		return getShapeOfStat(stat)
	})

	it(`non existing folder`, async () => {
		var stat = await fs.stat('fixtures/not-existing-foler')
		return getShapeOfStat(stat)
	})

})




describe('complex example', () => {
/*
	it(`1`, async () => {
		fs.exists(fileName, function(exists) {
			if (exists) {
				// get information about the file
				fs.stat(fileName, function(error, stats) {
					// open the file (getting a file descriptor to it)
					fs.open(fileName, "r", function(error, fd) {
						var buffer = new Buffer(stats.size)
						// read its contents into buffer
						fs.read(fd, buffer, 0, buffer.length, null, function(error, bytesRead, buffer) {
							var data = buffer.toString("utf8", 0, buffer.length)
							fs.close(fd)
						})
					})
				})
			}
		})
	})
*/
	it(`1`, async () => {
		var path = 'fixtures/ow-quotes.txt'
		var exists = await fs.exists(path)
		if (!exists) return
		// get information about the file
		var stats = await fs.stat(path)
		// open the file (getting a file descriptor to it)
		var fd = await fs.open(path, 'r')
		var buffer = new Buffer(stats.size)
		// read its contents into buffer
		await fs.read(fd, buffer, 0, buffer.length, null)
		var data = buffer.toString()
		fs.close(fd)
		return data
	})

})

