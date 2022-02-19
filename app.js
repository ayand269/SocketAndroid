const express = require('express');
const http = require('http');
const soketio = require('socket.io');

const app = express();

const server = http.createServer(app);
const io = soketio(server);

app.use(express.json());

io.sockets.on("connection", function (socket) {
    socket.setMaxListeners(10000)

    function log() {
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
    }

    socket.on('create or join', function (room) {
        console.log('Received request to create or join room ' + room);

        var clientsInRoom = io.sockets.adapter.rooms.get(room);
        var numClients = clientsInRoom ? clientsInRoom.size : 0;
        console.log('Room ' + room + ' now has ' + numClients + ' client(s)');

        if (numClients === 0) {
            socket.join(room);
            console.log('Client ID ' + socket.id + ' created room ' + room);
            socket.emit('created', room, socket.id);

        } else if (numClients === 1) {
            console.log('Client ID ' + socket.id + ' joined room ' + room);
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            socket.emit('joined', room, socket.id);
            io.sockets.in(room).emit('ready');
        } else { // max two clients
            socket.emit('full', room);
        }

        socket.on('message', function (message) {
            console.log('Client said: ', message);
            // for a real app, would be room-only (not broadcast)
            socket.broadcast.emit('message', message);
        });
    });

    socket.on('ipaddr', function () {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function (details) {
                if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                }
            });
        }
    });

    socket.on('bye', function () {
        console.log('received bye');
    });
});

const port = process.env.PORT || 5000;


server.listen(port, () =>
    console.log(`Server running at port ${port}`)
);