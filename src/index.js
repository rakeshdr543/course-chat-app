const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectPath))

io.on('connection', (socket) => {
    console.log('socket connection success!')

    socket.emit('message', 'Welcome!')
    socket.broadcast.emit('message', 'new user joined')

    socket.on('newMessage', (newMessage, callback) => {
        const filter = new Filter()
        if (filter.isProfane(newMessage)) {
            return callback('Profanity is not allowed')
        }
        io.emit('message', newMessage)
        callback()
    })

    socket.on('sendLocation', (position, callback) => {
        io.emit('message', `https://google.com/maps?q=${position.latitude},${position.longitude}`)
        callback()
    })

    socket.on('disconnect', () => {
        io.emit('message', 'A user has left')
    })
})
server.listen(port, () => {
    console.log(`Listening on ${port}`)
})