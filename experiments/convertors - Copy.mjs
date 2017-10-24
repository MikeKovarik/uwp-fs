
/*
export function readableFromBlob(blob = this) {
	var chunkSize = MB
	var offset = 0
	var reader = new FileReader()
	var {size} = blob
	var stream = new Readable()
	stream._read = noop
	reader.onloadend = e => {
		var bytesRead = reader.result.byteLength
		offset += bytesRead
		var chunk = bufferFromArrayBuffer(reader.result)
		// Push the read chunk into our stream
		stream.push(chunk)
		if (offset >= size) {
			// we reached the end of the blob. This is the last chunk. End the stream.
			stream.push(null)
		} else {
			// We still have more chunks to process.
			processNextChunk()
		}
	}
	function processNextChunk() {
		var end = offset + chunkSize
		var slice = blob.slice(offset, end)
		reader.readAsArrayBuffer(slice)
	}
	if (chunkSize > 0) {
		// split the blob into chunks of given size and read them sequentally
		processNextChunk()
	} else {
		// chunksize 0 means read the whole blob at one go
		reader.readAsArrayBuffer(blob)
	}
	return stream
}
*/
