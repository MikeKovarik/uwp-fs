const {FileAccessMode} = Windows.Storage


const maxuint32 = 4294967295
/*
// TODO: test aborting and errors on reader
export function readableStreamFromUwpStream(blob, options) {
	// HighWaterMark is limitting how large chunks we can read.
	var highWaterMark = options.highWaterMark || options.chunkSize || defaultChunkSize
	// loadAsync only takes UINT32 value.
	highWaterMark = Math.min(highWaterMark, maxuint32)
	// Set watermark so that the stream does not read one byte at a time.
	var queuingStrategy = new CountQueuingStrategy(highWaterMark)
	// Size of the read data and current position inside it.
	var {size} = blob
	var offset = 0
	//
	var controller
	// Open browser's FileReader class needed for accesing binary data from blob.
	var reader = new FileReader()
	// Each time we read a chunk from the blob, convert it to buffer and push it to the stream.
	reader.onload = e => {
		// Mark the ammount of bytes we read with the last chunk.
		var bytesRead = reader.result.byteLength
		// Keep track of how much we read so far and where the next chunk starts.
		offset += bytesRead
		// By default FileReader returns browser's ArrayBuffer that we need to convert to node Buffer.
		var chunk = new Uint8Array(reader.result)
		// Push the read chunk into our stream.
		controller.enqueue(chunk)
		// End the stream if we reached the end of the blob and this was the last chunk.
		if (offset >= size)
			controller.close()
	}
	// TODO: Properly handle errors
	reader.onerror = err => {
		// TODO
	}
	// Create instance of the ReadableStream
	return new ReadableStream({
		// In start we should be setting everything up be we are already doing that
		start(ctrl) {
			controller = ctrl
		},
		// We're only slicing and reading data from file/blob if consumer asks for it.
		pull(controller) {
			// Only read chunk of desired ammount of bytes from the whole file/blob
			// NOTE: controller.desiredSize is never larger than highWaterMark
			var bytesToRead = Math.min(size - offset, controller.desiredSize)
			// Extract the chunk of 'bytesToRead' size, starting at 'offset'.
			var blobChunk = blob.slice(offset, offset + bytesToRead)
			// And let reader turn the chunk info ArrayBuffer (onload gets called).
			reader.readAsArrayBuffer(blobChunk)
			// Return promise which is either 
			return new Promise((resolve, reject) => {
				// NOTE: 'load' is fired on successful read and is already used by chunk reader
				//       'loadend' is fired after either 'load' or 'error'. But if 'error' occurs, 
				//       by then we've already rejected promise and there shouldn't be a problem. 
				reader.onloadend = resolve
				reader.onerror = reject
				reader.onabort = reject
			})
		},
		// Handle cancelation of the stream safely by stopping reader.
		cancel(reason) {
			reader.abort()
		}
	}, queuingStrategy)
}
*/






export function readableStreamFromUwpStream(uwpStream) {
	var readable = new Readable
	_readableStreamFromUwpStream(readable, readableStream)
	return readable
}
export async function _readableStreamFromUwpStream(readable, uwpStream) {
	var isFinite = uwpStream.size !== undefined
	var reader = new DataReader(uwpStream)
	reader.inputStreamOptions = Streams.InputStreamOptions.partial

	var readChunk = () => {
		// Create Buffer of the size that we know is ready for use to read from the stream.
		var chunk = Buffer.allocUnsafe(bytesRead)
		// Now read the data from the stream into the chunk buffe we've just created.
		reader.readBytes(chunk)
		return chunk
	}
	/*if (isFinite) {*/
		var offset = 0
		var reading = false
		readable._read = async maxSize => {
			if (reading) return
			reading = true
			var bytesToRead = Math.min(maxSize, size)
			// First we announce the intent to read 'bytesToRead' ammount from the stream.
			var bytesRead = await reader.loadAsync(bytesToRead)
			// Adjust offset to keep track of how much of the total size of the stream we've read so far.
			offset += bytesRead
			// ----
			var chunk = readChunk(bytesRead)
			// Push the read chunk into our stream.
			if (offset >= size) {
				readable.push(chunk)
				// End the stream if we reached the end of the blob and this was the last chunk.
				readable.push(null)
			} else {
				// Unlock next _read cycle
				reading = false
				readable.push(chunk)
			}
		}
	/*} else {
		// Unlike finite stream, infinite stream does not just read 0 bytes but waits for whenever
		// something arrives in the stream and only then loadAsync resolves number of bytes that arrived
		// that we can now read.
		readable._read = async maxSize => {
			var bytesToRead = maxSize
			while (true) {
				// First we announce the intent to read 'bytesToRead' ammount from the stream.
				var bytesRead = await reader.loadAsync(bytesToRead)
				// ----
				readChunk(bytesRead)
			}
		}
	}*/

	reader.close()
	//readable.push(null)
}



/*
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
		var chunk = Buffer.allocUnsafe(bytesRead)
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
		var chunk = Buffer.allocUnsafe(bytesRead)
		// Now read the data from the stream into the chunk buffe we've just created.
		reader.readBytes(chunk)
		console.log(chunk)
	}
}

*/


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


if (typeof Windows !== 'undefined') {
	var {DataReader, DataWriter} = Windows.Storage.Streams
	var collision = Windows.Storage.CreationCollisionOption
}


//var file = await targetFolder.getFileAsync(fileName)
//var iBuffer = await FileIO.readBufferAsync(file)
export function bufferFromIbuffer(iBuffer) {
	var reader = DataReader.fromBuffer(iBuffer)
	var byteSize = reader.unconsumedBufferLength
	var nodeBuffer = Buffer.allocUnsafe(byteSize)
	var data = reader.readBytes(nodeBuffer)
	reader.close()
	return nodeBuffer
}

