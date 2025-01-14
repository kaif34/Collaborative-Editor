const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static('public'));

let connectedUsers = new Set();
let documentContent = '';

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    connectedUsers.add(socket.id);

    // Send current document state to new user
    socket.emit('text-change', documentContent);
    
    // Broadcast new user to everyone
    io.emit('user-connected', socket.id);
    
    socket.on('text-change', (content) => {
        documentContent = content;
        socket.broadcast.emit('text-change', content);
    });

    socket.on('cursor-move', (position) => {
        socket.broadcast.emit('cursor-move', {
            userId: socket.id,
            position: position
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        connectedUsers.delete(socket.id);
        io.emit('user-disconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});