// imports
var app = require('express')()
var fs = require('fs')
const env = require('./EnvConst.js')
const http = require('http')
const https = require('https')
const DB = require('./Constants.js')

// config server
//--------------------
var server = env.https ?
			https.createServer({
				key: fs.readFileSync('certs/wolf.key'), 
			    cert: fs.readFileSync('certs/wolf.crt'),
			    ca: fs.readFileSync('certs/myCA.pem')
			}, app)
			:
			http.createServer(app)

var io = require('socket.io')(server, {

});

const port = 8002


// server methods
// ----------------------------------------
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html')
})

app.get('/rooms', (req, res) => {
	res.send(DB.getAllRooms())
})

app.get('/room/:id', (req, res) => {
	res.send(DB.getRoom(req.params.id))
})

app.get('/roomsDB', (req, res) => {
	res.send(io.sockets.adapter.rooms)
})

app.get('/room/db/:id', (req, res) => {
	res.send(io.sockets.adapter.rooms[req.params.id])
})


// set socket
// ----------------------------------------
io.on('connection', (socket) => {
	console.log('a user connected')
	
	const getSocketId = () => {
		return Object.keys(socket.rooms)[0]
	}

	// socket room will be remove automatically, if no one in the room
	// check if everyone left the room
	const checkDeleteRoom = () => {
		const roomId = socket.joinedRoomId
		
		if( !io.sockets.adapter.rooms[roomId] ) {
			DB.deleteRoom(roomId)
		}
	}

	//
	const leaveRoom = () => {
		const roomId = socket.joinedRoomId
		socket.leave(roomId)
		checkDeleteRoom()
	}

	//
	const joinRoom = (roomId) => {
		if(socket.joinedRoomId) {
    		if(socket.joinedRoomId === roomId) {
    			// do nothing
    		} else {
    			leaveRoom()
    			socket.join(roomId)
    			socket.joinedRoomId = roomId
    		}
    	} else {
    		socket.join(roomId)
			socket.joinedRoomId = roomId
    	}
	}

	// Join & Leave
	//----------------------------------
    socket.on('disconnect', () => {
		checkDeleteRoom()
	})
    

    // room interactions
    //----------------------------------
    socket.on('createRoom', roles => {
    	const room = DB.generateNewRoom(roles)

    	joinRoom(room.id)
    	
    	io.in(room.id).emit('getRoomId', room.id)
    	io.in(room.id).emit('getRoomRoles', room.roles)
    	io.in(room.id).emit('client', 'Create room: ' + room.id)
    })

	socket.on('joinRoom', roomId => {
		if( DB.getAllRoomIds().includes(roomId) ) {
			joinRoom(roomId)
			socket.emit('getRoomRoles', DB.getRoom(roomId).roles)
		} else {
			socket.emit('client', 'Room does not exist.')
		}
	})

	socket.on('messageRoom', text => {
		io.in(socket.joinedRoomId).emit('client', text)
	})

	socket.on('leaveRoom', () => {
		leaveRoom()
	})

	socket.on('manualDisconnect', () => {
		socket.disconnect(true)
	})


	// player interactions
	// -------------------------------
	socket.on('sitDown', data => {
		const { userInfo, index } = data
		const { joinedRoomId } = socket
		DB.sitDown(joinedRoomId, getSocketId(), userInfo, index)
		// io.in(joinedRoomId).emit('updatePlayers', DB.getPlayers(joinedRoomId))
		io.in(joinedRoomId).emit('updatePlayer', DB.getPlayer(joinedRoomId, index), index)
	})

	socket.on('updatePlayer', data => {
		const { property, index } = data
		const { joinedRoomId } = socket
		DB.updatePlayer(socket.joinedRoomId, getSocketId(), property, index)
		io.in(joinedRoomId).emit('updatePlayer', DB.getPlayer(joinedRoomId, index), index)
	})
})

server.listen(port, () => {
	console.log(`Server is running on port ${port}`)
})