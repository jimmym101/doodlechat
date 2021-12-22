// Dependencies
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const {messageFormat, noticeFormat, saveDoodlePath, resetMessages, resetDoodle, doodlePaths, messages} = require('./utilities/messages.js');
const {userJoin, getUser, removeUser, getAllUsers} = require('./utilities/users.js');
// Initialise dependencies
const app = express();
const server = http.createServer(app);
const io = socketio(server);
// Entry Point
app.use(express.static(path.join(__dirname, 'public')));
// Port
const PORT = process.env.PORT || 3000;

// Socket.io - for doodlechat
io.on('connection', socket => {
    // New user connected - emit client count, doodles and chat history to user
    if (messages.length > 0) {
        messages.forEach(message => {
            socket.emit('message', messageFormat(message.username, message.userMessage, false));
        });
    }
    // Welcome message with instructions to join chat
    socket.emit('message', messageFormat('Doodlechat', 'Welcome to Doodlechat! Enter your name below to join the chat.', false));

    if (doodlePaths.length > 0) {
        doodlePaths.forEach(doodle => {
            socket.emit('doodle', doodle);
        });
    }
    io.emit('count', io.sockets.server.eio.clientsCount);
    // User joined chat
    socket.on('joinChat', (username) => {
        if (username == "") {
            return false;
        }
        // Join user to chat
        const user = userJoin(socket.id, username, 'group');
        socket.join(user.room);
        // Broadcast to all other connected clients, excluding the newly connected client
        socket.broadcast.emit('notice', noticeFormat('notice', `${username} has joined the chat`)); 
        // Message to new client only
        socket.emit('newJoin', 'accepted');
        socket.emit('notice', noticeFormat('notice', 'You have joined the chat'));
    });
    // Catch user messages
    socket.on('userMessage', (msg) => {
        if (msg == "") {
            return false;
        }
        const user = getUser(socket.id);
        if (user) {
            socket.emit('message',  messageFormat('You', msg, false));
            socket.broadcast.emit('message', messageFormat(user.username, msg, true));
        }
    });
    // Catch doodles
    socket.on('doodle', data => {
        // Emit their doodle to other clients and save too array of doodle paths
        socket.broadcast.emit('doodle', data);
        saveDoodlePath(data);
    });
    // Reset doodle
    socket.on('reset', () => {
        resetDoodle();
        io.emit('doodleReset', true);
    });
    // Client disconnected
    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        if (user) {
            io.emit('notice', noticeFormat('notice', `${user.username} has left the chat`));
        }
        // Reset messages and doodles if no users left
        if (io.sockets.server.eio.clientsCount < 1) {
            resetMessages();
            resetDoodle();
        } else {
            // Emit new count to active users
            io.emit('count', io.sockets.server.eio.clientsCount);
        }
    });
});



// Server listen 
server.listen(PORT, () => console.log(`Server running on port: ${PORT}`));