// this test is BDD (classic assert testing like mocha), not a CDD (comparative mouka testing)
var assert = chai.assert
// this test it only for browser
var fs = window['uwp-fs']
var cwd = fs.cwd
var {getPathFromURL} = fs._internals
mouka.setup('bdd')


describe('path resolution', () => {

	const C = 'C:\\'

	function itResolves(...args) {
		if (args.length === 3) {
			var name = args.shift()
			var [initial, desired] = args
		} else {
			var [initial, desired] = args
			var name = `${initial} === ${desired}`
		}
		it(name, () => {
			var actual = getPathFromURL(initial)
			console.log('initial', initial)
			console.log('desired', desired)
			console.log('actual ', actual)
			assert.equal(actual, desired)
		})
	}

	itResolves('cwd === cwd', cwd, cwd)

	itResolves('.', cwd)

	itResolves('./',  cwd)
	itResolves('.\\', cwd)
	
	itResolves('/',  'C:\\')
	itResolves('\\', 'C:\\')
	
	itResolves('C:/',  'C:\\')
	itResolves('C:\\', 'C:\\')

	itResolves('/Windows',  'C:\\Windows')
	itResolves('\\Windows', 'C:\\Windows')

	itResolves(`/fixtures`,   'C:\\fixtures')
	itResolves(`\\fixtures`,  'C:\\fixtures')
	itResolves(`fixtures`,    cwd + '\\fixtures')
	itResolves(`./fixtures`,  cwd + '\\fixtures')
	itResolves(`./fixtures/`, cwd + '\\fixtures')

	itResolves(`fixtures/ow-quotes.txt`,     cwd + '\\fixtures\\ow-quotes.txt')
	itResolves(`fixtures\\ow-quotes.txt`,    cwd + '\\fixtures\\ow-quotes.txt')
	itResolves(`fixtures\\ow-quotes.txt`,    cwd + '\\fixtures\\ow-quotes.txt')
	itResolves(`./fixtures/ow-quotes.txt`,   cwd + '\\fixtures\\ow-quotes.txt')
	itResolves(`./fixtures\\ow-quotes.txt`,  cwd + '\\fixtures\\ow-quotes.txt')
	itResolves(`.\\fixtures\\ow-quotes.txt`, cwd + '\\fixtures\\ow-quotes.txt')

	// TODO
	// fixtures\ow-quotes.txt === .\fixtures\ow-quotes.txt
	// \Windows === C:\Windows
	// cwd + \\fixtures\\not-existing-file.txt === ABSOLUTE_PATH_CWD\\fixtures\\not-existing-file.txt

})


/*
// .watch() related path tests

function symmetricDiff(arr1, arr2) {
	var result = []
	for (var i = 0; i < arr1.length; i++)
		if (!arr2.includes(arr1[i]))
			result.push(arr1[i])
	for (i = 0; i < arr2.length; i++)
		if (!arr1.includes(arr2[i]))
			result.push(arr2[i])
	return result
}

var a = [
	'watch\\myfold\\New folder\\zip.zip',
	'watch\\aaa.txt',
	'watch\\myfold\\ccc.txt',
	'watch\\4.txt',
	'watch\\myfold\\some-file.txt',
	'watch\\myfold\\New folder\\another\\one\\aaa.txt',
	'watch\\myfold\\New folder\\another\\one\\zip.zip',
	'watch\\myfold\\New folder\\another\\one\\bbb.txt',
]

console.log(a.sort((a, b) => b.split('\\').length - a.split('\\').length))

*/