var net = require('net')


var client = new net.Socket()
client.connect(9999, '127.0.0.1', () => {
	console.log('Connected')
	client.write('Hello, server! Love, Client.')
})