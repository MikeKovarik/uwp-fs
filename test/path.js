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