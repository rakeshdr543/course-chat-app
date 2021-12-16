const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')

const { generateMessage, generateLocationMessage } = require('./utils/message')
const { addUser, removeUser, getUser, getUsersRoom } = require('./utils/user')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectPath))

io.on('connection', (socket) => {
    console.log('socket connection success!')

    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }
        socket.join(user.room)

        socket.emit('message', generateMessage('Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage', (newMessage, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(newMessage)) {
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, newMessage))
        callback()
    })

    socket.on('sendLocation', (position, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${position.latitude},${position.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', `${user.username} has left`)
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersRoom(user.room)
            })
        }
    })
})
server.listen(port, () => {
    console.log(`Listening on ${port}`)
})