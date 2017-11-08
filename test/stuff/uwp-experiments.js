var StreamSocket = Windows.Networking.Sockets.StreamSocket
var Streams = Windows.Storage.Streams
const {FileAccessMode} = Windows.Storage
var {DataReader} = Windows.Storage.Streams







if (typeof Windows === 'object') {
	timeout(800)
		.then(() => readFileStream(KnownFolders.picturesLibrary, 'in.txt'))
		//.then(() => readFileStream(KnownFolders.picturesLibrary, 'in.jpg'))
		.catch(err => console.error(err))
	timeout(800)
		.then(() => readTcpStream('localhost', 9999))
		.catch(err => console.error(err))
}


async function readFileStream(folder, fileName) {
	var file = await folder.getFileAsync(fileName)
	var stream = await file.openAsync(FileAccessMode.read)
	return readableStreamFromUwpStream(stream)
}

async function readTcpStream(host = '127.0.0.1', port = 9999) {
	var socket = new StreamSocket()
	var hostName = new Windows.Networking.HostName(host)
	await socket.connectAsync(hostName, port)
	var stream = socket.inputStream
	return readableStreamFromUwpStream(stream)
}



async function readableStreamFromUwpStream(stream) {
	var isFinite = stream.size !== undefined
	var reader = new DataReader(stream)
	reader.inputStreamOptions = Streams.InputStreamOptions.partial
	if (isFinite) {
		await processFiniteStream(reader, stream.size)
		reader.close()
	} else {
		processInfiniteStream(reader)
	}
}

async function processFiniteStream(reader, size) {
	// reader.unconsumedBufferLength
	console.log('processFiniteStream')
	var offset = 0
	while (offset < size) {
		//while (reader.unconsumedBufferLength > 0) {
		var bytesToRead = Math.min(highWaterMark, size)
		var bytesRead = await reader.loadAsync(bytesToRead)
		// Create Buffer of the size that we know is ready for use to read from the stream.
		var chunk = new Buffer(bytesRead)
		// Now read the data from the stream into the chunk buffe we've just created.
		reader.readBytes(chunk)
		console.log(chunk.length)
		// Adjust offset to keep track of how much of the total size of the stream we've read so far.
		offset += bytesRead
	}
	//console.log('- reader.unconsumedBufferLength', reader.unconsumedBufferLength)
}

async function processInfiniteStream(reader) {
	console.log('processInfiniteStream')
	var bytesToRead = highWaterMark
	while (true) {
		// Unlike finite stream, infinite stream does not just read 0 bytes but waits for whenever
		// something arrives in the stream and only then loadAsync resolves number of bytes that arrived
		// that we can now read.
		var bytesRead = await reader.loadAsync(bytesToRead)
		// Create Buffer of the size that we know is ready for use to read from the stream.
		var chunk = new Buffer(bytesRead)
		// Now read the data from the stream into the chunk buffe we've just created.
		reader.readBytes(chunk)
		console.log(chunk)
	}
}








/*
//var highWaterMark = 1000
var highWaterMark = 10

async function read1() {
	var folder = Windows.Storage.KnownFolders.picturesLibrary
	var fileName = 'in.txt'

	var file = await folder.getFileAsync(fileName)
	//console.log('file', file)
	// FileRandomAccessStream, stream.size is a number. this stream is finite
	var stream = await file.openAsync(FileAccessMode.read)
	//console.log('stream', stream)
	var size = stream.size
	//console.log('stream.size', stream.size)
	// FileInputStream, inputStream.size is undefined. this stream is infinite
	var inputStream = stream.getInputStreamAt(0)
	//console.log('inputStream', inputStream)
	//console.log('inputStream.size', inputStream.size)
	var reader = new DataReader(stream)
	//console.log('reader', reader)
	console.log('- reader.unconsumedBufferLength', reader.unconsumedBufferLength)
	var receivedString = ''
	var killswitch = 5
	while (killswitch--) {
	//while (true) {
		console.log('---------------------------')
		//while (reader.unconsumedBufferLength > 0) {
		var bytesToRead = Math.min(highWaterMark, size)
		console.log('bytesToRead', bytesToRead)
		var bytesRead = await reader.loadAsync(bytesToRead)
		console.log('bytesRead', bytesRead)
		console.log('reader.unconsumedBufferLength', reader.unconsumedBufferLength)
		var chunk = reader.readString(bytesRead)
		console.log('chunk', chunk)
		receivedString += chunk
	}
	console.log('receivedString', receivedString)
	console.log('- reader.unconsumedBufferLength', reader.unconsumedBufferLength)
	reader.close()
}



async function localhostStream() {
	var socket = self.socket = new StreamSocket()
	//var host = '192.168.0.192'
	var host = '127.0.0.1'
	var port = 9999
	var hostName = new Windows.Networking.HostName(host)
	await socket.connectAsync(hostName, port)
	console.log('connected')
	var outputStream = self.outputStream = socket.outputStream
	//console.log('outputStream', outputStream)
	//console.log('outputStreams.size', outputStreams.size)
	// IInputStream, inputStream.size is undefined. this stream is infinite
	var inputStream = self.inputStream = socket.inputStream
	console.log('inputStream', inputStream)
	console.log('inputStream.size', inputStream.size)
	var reader = self.reader = new DataReader(socket.inputStream)
	reader.inputStreamOptions = Streams.InputStreamOptions.partial
	console.log('reader', reader)
	var killswitch = 5
	while (killswitch--) {
		console.log('------------------------------------------')
		console.log('reader.unconsumedBufferLength', reader.unconsumedBufferLength)
		var bytesRead = await reader.loadAsync(10)
		console.log('bytesRead', bytesRead)
		console.log('reader.unconsumedBufferLength', reader.unconsumedBufferLength)
		console.log('|' + reader.readString(bytesRead) + '|')
		console.log('reader.unconsumedBufferLength', reader.unconsumedBufferLength)
		//console.log('bytesRead', bytesRead)
		//var buffer = new Buffer(bytesRead)
		//console.log('buffer', buffer)
		//reader.readBytes(buffer)
		//console.log('buffer', buffer)
	}
}


if (typeof Windows === 'object') {
	timeout(800)
		//.then(read1())
		.catch(err => console.error(err))
	timeout(800)
		.then(localhostStream())
		.catch(err => console.error(err))
}

/*