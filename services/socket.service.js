const logger = require('./logger.service')

var gIo = null

function setupSocketAPI(http) {
    gIo = require('socket.io')(http, {
        cors: {
            origin: '*',
        }
    })
    gIo.on('connection', socket => {
        logger.info(`New connected socket [id: ${socket.id}]`)

        socket.on('disconnect', socket => {
            logger.info(`Socket disconnected [id: ${socket.id}]`)
        })
        socket.on('user-watch', userId => {
            logger.info(`user-watch from socket [id: ${socket.id}], on user ${userId}`)
            socket.join('watching:' + userId)

        })
        socket.on('set-user-socket', userId => {
            logger.info(`Setting socket.userId = ${userId} for socket [id: ${socket.id}]`)
            socket.userId = userId
        })
        socket.on('unset-user-socket', () => {
            logger.info(`Removing socket.userId for socket [id: ${socket.id}]`)
            delete socket.userId
        })
        socket.on('save-task', ({ savedTask, loggedinUser }) => {
            const res = { type: 'task-saved', data: savedTask, userId: loggedinUser._id }
            broadcast(res)
        })
        socket.on('remove-task', ({ removedTask, loggedinUser }) => {
            const res = { type: 'task-removed', data: removedTask, userId: loggedinUser._id }
            broadcast(res)
        })
        socket.on('duplicate-tasks', ({ tasksToDuplicate, loggedinUser }) => {
            const res = { type: 'tasks-duplicated', data: tasksToDuplicate, userId: loggedinUser._id }
            broadcast(res)
        })
        socket.on('remove-group', ({ group, loggedinUser }) => {
            const res = { type: 'group-removed', data: group, userId: loggedinUser._id }
            broadcast(res)
        })
        socket.on('save-board', ({ savedBoard, loggedinUser }) => {
            const res = { type: 'board-saved', data: savedBoard, userId: loggedinUser._id }
            broadcast(res)
        })
        socket.on('add-board', ({ boardData, loggedinUser }) => {
            const res = { type: 'board-added', data: boardData, userId: loggedinUser._id }
            broadcast(res)
        })
        socket.on('save-group', ({ data, loggedinUser }) => {
            const res = { type: 'group-saved', data, userId: loggedinUser._id }
            broadcast(res)
        })
        socket.on('update-group', ({ group, loggedinUser }) => {
            const res = { type: 'group-updated', data: group, userId: loggedinUser._id }
            broadcast(res)
        })
    })
}

function emitTo({ type, data, label }) {
    if (label) gIo.to('watching:' + label.toString()).emit(type, data)
    else gIo.emit(type, data)
}

async function emitToUser({ type, data, userId }) {
    userId = userId.toString()
    const socket = await _getUserSocket(userId)

    if (socket) {
        logger.info(`Emiting event: ${type} to user: ${userId} socket [id: ${socket.id}]`)
        socket.emit(type, data)
    } else {
        logger.info(`No active socket for user: ${userId}`)
        // _printSockets()
    }
}

// If possible, send to all sockets BUT not the current socket 
// Optionally, broadcast to a room / to all
async function broadcast({ type, data, userId }) {

    userId = userId.toString()
    logger.info(`Broadcasting event: ${type}`)
    const excludedSocket = await _getUserSocket(userId)
    if (excludedSocket) {
        logger.info(`Broadcast to all excluding user: ${userId}`)
        excludedSocket.broadcast.emit(type, data)
    } else {
        logger.info(`Emit to all`)
        gIo.emit(type, data)
    }
}

async function _getUserSocket(userId) {
    const sockets = await _getAllSockets()
    const socket = sockets.find(s => s.userId === userId)
    return socket
}

async function _getAllSockets() {
    // return all Socket instances
    const sockets = await gIo.fetchSockets()
    return sockets
}

async function _printSockets() {
    const sockets = await _getAllSockets()
    console.log(`Sockets: (count: ${sockets.length}):`)
    sockets.forEach(_printSocket)
}

function _printSocket(socket) {
    console.log(`Socket - socketId: ${socket.id} userId: ${socket.userId}`)
}

module.exports = {
    // set up the sockets service and define the API
    setupSocketAPI,
    // emit to everyone / everyone in a specific room (label)
    emitTo,
    // emit to a specific user (if currently active in system)
    emitToUser,
    // Send to all sockets BUT not the current socket - if found
    // (otherwise broadcast to a room / to all)
    broadcast,
}
