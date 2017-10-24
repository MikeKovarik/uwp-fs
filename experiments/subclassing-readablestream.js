// But for now, there’s always the sweet taste the forbidden fruit form the garden of dirty hacks:
new (class MyStream1 extends ReadableStream {
	constructor() {
		var start, pull, close
		var underlying = {}
		var started = new Promise(resolve => {
			underlying.start = arg => {
				setTimeout(() => {
					underlying.start = start
					underlying.pull = pull
					underlying.close = close
					underlying.start(arg)
					resolve()
				})
			}
		})
		underlying.pull = arg => started.then(() => underlying.pull(arg))
		underlying.close = arg => started.then(() => underlying.close(arg))
		super(underlying)
		start = this.start
		pull = this.pull
		close = this.close
		this.start = this.pull = this.close = undefined
	}
	start(controller) {
		console.log('start', controller)
	}
	pull(controller) {
		console.log('pull', controller)
	}
	close(controller) {
		console.log('close', controller)
	}
})



new (class MyStream2 extends ReadableStream {
	constructor() {
		super({
			start(controller) {
				console.log('start', controller)
			},
			pull(controller) {
				console.log('pull', controller)
			}
		})
	}
})