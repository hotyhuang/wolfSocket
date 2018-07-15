var app = require('express')();
var fs = require('fs')
var server = require('https').createServer({
	key: fs.readFileSync('certs/server-key.pem'), 
    cert: fs.readFileSync('certs/server-crt.pem'), 
    ca: fs.readFileSync('certs/ca-crt.pem'),
}, app);
var io = require('socket.io')(server);

const port = 8002

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html')
})

io.on('connection', (socket) => {
	console.log('a user connected')

	socket.on('join', (data) => {
        console.log(data)
    })

    socket.on('message', (data) => {
        console.log('Received user message:', data)

        socket.broadcast.emit('client', data)
    })

    socket.on('disconnect', socket => {
		console.log('user disconnected')
	})
})



server.listen(port, () => {
	console.log(`Server is running on port ${port}`)
})