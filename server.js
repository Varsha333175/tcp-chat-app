const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
    },
});

app.use(cors());
app.use(express.json());

let clients = [];
let kickedUsers = new Set();

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('set-profile', (profile) => {
        if (kickedUsers.has(profile.nickname)) {
            socket.emit('kicked', 'the system');
            socket.disconnect();
            return;
        }

        socket.profile = profile;

        // Remove any previous connection with the same nickname
        const existingClientIndex = clients.findIndex(client => client.profile.nickname === profile.nickname);
        if (existingClientIndex !== -1) {
            clients[existingClientIndex].disconnect();
            clients.splice(existingClientIndex, 1);
        }

        clients.push(socket);
        io.emit('message', { text: `${profile.nickname} joined the chat`, sender: 'system', type: 'system' });
        broadcastUsers();
    });

    socket.on('message', (message) => {
        if (!kickedUsers.has(socket.profile.nickname)) {
            io.emit('message', { text: message.text, sender: socket.profile.nickname, type: 'user' });
        }
    });

    socket.on('kick', (nickname, byUser) => {
        if (kickedUsers.has(socket.profile.nickname)) return;

        const clientToKick = clients.find(client => client.profile && client.profile.nickname === nickname);
        if (clientToKick) {
            clientToKick.emit('kicked', byUser);
            clientToKick.disconnect();
            clients = clients.filter(client => client !== clientToKick);
            kickedUsers.add(nickname);
            io.emit('message', { text: `${nickname} was kicked from the chat by ${byUser}`, sender: 'system', type: 'system' });
            broadcastUsers();
        }
    });

    socket.on('disconnect', () => {
        if (socket.profile && !kickedUsers.has(socket.profile.nickname)) {
            io.emit('message', { text: `${socket.profile.nickname} left the chat`, sender: 'system', type: 'system' });
            clients = clients.filter(client => client !== socket);
            broadcastUsers();
        }
        console.log('Client disconnected');
    });

    const broadcastUsers = () => {
        const users = clients.map(client => client.profile);
        io.emit('users', users);
    };
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
