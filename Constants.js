// convert integer to string with filled 0s
// 2 => 002, 34 => 034
const toNumberLength = (value, len = 3) => {
	const res = String(value)
	let zeros = '',
		diff = len - res.length
	while(diff > 0) {
		zeros += '0'
		diff--
	}
	return zeros + res
}

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
const shuffle = (arr = []) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr
}

// here Array.fill does not work
// idk why......
const fillArray = (length, value) => {
	const arr = []
	while(length > 0) {
		arr.push(value)
		length--
	}
	return arr
}

module.exports = new function() {
	var rooms = {},
		existRoomIds = new Set([])

	const convertIdToNumber = id => Number(id)

	this.getRoom = id => rooms[id]
	this.getAllRooms = () => rooms
	// this.getRoomId = id => Number(id)
	this.getAllRoomIds = () => [...existRoomIds]
	this.getPlayers = roomId => (rooms[roomId] || {}).players
	this.getPlayer = (roomId, index) => {
		const players = this.getPlayers(roomId) || {}
		const socketId = Object.keys(players).find(_p => players[_p].index === index)
		return players[socketId]
	}

	this.generateNewRoom = (inputs = {}) => {
		// get new room id
		const existIdArray = [...existRoomIds].map(id => convertIdToNumber(id)).sort()
		let newId = 1
		const inorder = existIdArray.some((existId, index) => {
			if(existId > index + 1) {
				newId = index + 1
				return true
			}
			return false
		})
		newId = inorder ? newId : existIdArray.length + 1
		const _newId = toNumberLength(newId)


		// get role distribution
		// status: 0 - dead
		//		   1 - alive
		//		   2 - skill 1 (cure) used
		//		   3 - skill 2 (poison) used
		const { villager, wolf, gods = [] } = inputs
		const villagerPlayers = fillArray(villager, 'villager'),
			wolfPlayers = fillArray(wolf, 'wolf')
		const roles = [...villagerPlayers, ...wolfPlayers, ...gods]
		shuffle(roles)


		const newRoom = {
			id: _newId,
			createTime: new Date(),
			roles,
			players: {}
		}

		// manipulate rooms
		existRoomIds.add(_newId)
		rooms[_newId] = newRoom

		return newRoom
	}

	this.deleteRoom = roomId => {
		existRoomIds.delete(roomId)
		delete rooms[roomId]
	}

	this.clearAllRoom = () => {
		existRoomIds.clear()
		rooms = {}
	}

	// play actions
	// ---------------------------
	this.sitDown = (roomId, socketId, userInfo, index) => {
		const thisRoom = rooms[roomId]
		if(thisRoom) {
			thisRoom.players[socketId] = {
				index,
				role: thisRoom.roles[index],
				status: 1,
				socketId,
				userInfo
			}
		}
	}

	this.updatePlayer = (roomId, socketId, property, index) => {
		const thisRoom = rooms[roomId]
		if(thisRoom) {
			const _player = thisRoom.players[socketId]
			thisRoom.players[socketId] = Object.assign({}, _player, property)
		}
	}
}

// init data storage
// rooms = {
// 	"roomId" : {
// 		id: "123456",
//		roles: ['villager', 'seer', 'wolf',....]
// 		players: {
//			"<socketId>": {
	// 			role: 'villager',
	// 			status: 1,
	//			socketId: 'SKDMOQW',
	//			userInfo: {....}
	// 		},
//			....	
//		},
// 		....
// 		],
// 		createTime: Data(),
// 	}
// }