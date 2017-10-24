/*
function Readable() {
}
Readable.prototype.bark = function(name) {
	console.log('WOOF', name)
}
*/
class Readable {
	constructor() {
	}
	bark(name) {
		console.log('WOOF', name)
	}
}

function CustomFn() {
	console.log('instanceof Readable', this instanceof Readable)
	var isInstance = this instanceof CustomFn
	console.log('Readable', Readable)
	console.log('Readable.constructor', Readable.constructor)
	console.log('Readable.prototype.constructor', Readable.prototype.constructor)
	Readable.call(this)
	if (isInstance) {
		console.log('instantiated with new CustomFn()')
	} else {
		console.log('called as a function CustomFn()')
	}
	console.log(this)
	console.log('instanceof Readable', this instanceof Readable)
}
CustomFn.prototype._constructor = function() {
	this.bark('Custom')
}
CustomFn.prototype.something = function() {
	console.log('does something else')
}
CustomFn.prototype = Object.create(Readable.prototype)

class CustomClass extends Readable {
	constructor() {
		super()
		console.log('CustomClass')
		console.log('name', this.constructor.name)
		console.log('instanceof Readable', this instanceof Readable)
	}
}

var readable = new Readable()
console.log('-------------------------------------------------------------------')
CustomFn.call(readable)
console.log('-------------------------------------------------------------------')
new CustomFn()
