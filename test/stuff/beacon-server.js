var net = require('net')


var port = 9999

var server = net.createServer()

server.on('connection', socket => {
	console.log('socket conntected')
	var interval = setInterval(() => socket.write('yo!'), 1000)
	socket.once('close', () => {
		console.log('socket closed')
		clearInterval(interval)
	})
	socket.once('error', () => {})
})

server.listen(port)