function createFileReaderStream(blob) {
  const queuingStrategy = new CountQueuingStrategy({highWaterMark: 1024})
  var reader = new FileReader(blob)
  return new ReadableStream({
    start(controller) {
      // unused
    },
    pull(controller) {
      return new Promise((resolve, reject) => {
        reader.onload = resolve
        reader.onerror = reject
      }).then(() => reader.result)
      reader.readAsArrayBuffer(blob)
    },
    cancel(reason) {
      reader.abort()
    },
  }, queuingStrategy)
}

class FileReaderStream {
  constructor(blob) {
    this.reader = new FileReader(blob)
  }
  pull(controller) {
    return new Promise((resolve, reject) => {
      this.reader.onload = resolve
      this.reader.onerror = reject
    }).then(() => this.reader.result)
    this.reader.readAsArrayBuffer(blob)
  },
  cancel(reason) {
    this.reader.abort()
  }
}
return new ReadableStream(FileReaderStream(someFile), {highWaterMark: 1024})