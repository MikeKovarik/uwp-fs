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
		createReadStream: originalFs.createReadStream,
		createWriteStream: originalFs.createWriteStream,
		watch: originalFs.watch,
	}
	var cwd = process.cwd()
} else {
	var fs = window['uwp-fs']
	var cwd = fs.cwd

	mouka.setup()
}

var timeout = (millis = 0) => new Promise(resolve => setTimeout(resolve, millis))

describe('createReadStream()', () => {

	it(`returns ReadStream`, async () => fs.createReadStream('fixtures/ow-quotes.txt').constructor.name)

	it(`promisify`, async () => {
		var stream = fs.createReadStream('fixtures/ow-quotes.txt')
		return promisifyReadable(stream)
	})

	it(`nonexistent path returns`, async () => {
		return promisifyReadable(fs.createReadStream('fixtures/not-existing.txt'))
	})

	it(`folder path returns`, async () => {
		return promisifyReadable(fs.createReadStream('fixtures/'))
	})

})


function promisifyReadable(stream) {
	var chunks = []
	var promise = new Promise((resolve, reject) => {
		stream.on('data', chunk => chunks.push(chunk))
		stream.on('end', () => resolve(Buffer.concat(chunks)))
		stream.on('error', reject)
	})
	stream.then = promise.then.bind(promise)
	stream.catch = promise.catch.bind(promise)
	return stream
}