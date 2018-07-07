var app = require('express')();
var server = require('http').Server(app);
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

    socket.on('disconnect', socket => {
		console.log('user disconnected')
	})
})



server.listen(port, () => {
	console.log(`Server is running on port ${port}`)
})