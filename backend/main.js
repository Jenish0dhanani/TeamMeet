// const express = require('express');
// const app = express();
// const cors = require('cors')
// app.use(cors());

// app.use("/auth" ,require("./jwtAuth"))
// app.use(cors({origin: '*'}));
// app.use(express.json());// req.body


// app.listen(5000,()=>{
//     console.log('server running on localhost:5000')
// });
const fs = require('fs')
const cors = require('cors')
const express = require('express')
var privateKey = fs.readFileSync('localhost.key');
var certificate = fs.readFileSync('localhost.cert');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
//{key:privateKey,cert:certificate},
var app = require('express')(),
    server = require('https').createServer({key:privateKey,cert:certificate},app)
    // io = require('socket.io')(server, {
    //     'pingTimeout': 180000,
    //     'pingInterval': 25000,
    //     cors: {
    //         origin: "*"
    //     }
    // });
const wss = new WebSocketServer({ server: server });


app.use(cors());
app.use(cors({ origin: '*' }));
app.use("/auth", require("./jwtAuth"))
app.use(express.json());

var users = [];
var numberofuser = {}
    // io.on('connection',(socket)=>{
    //   socket.on('message',(msg)=>{
    //     console.log('received: %s', message);
    //     io.broadcast(message);
    //   })
    // })

// io.broadcast = function (data) {
//   this.clients.forEach(function (client) {
//     if (client.readyState === socket.OPEN) {
//       client.send(data);
//     }
//   });
// };

app.use('/uploads', express.static('./backend/public/images'));


wss.on('connection', function(ws) {
    ws.room = []
        // ws.send(JSON.stringify({msg:"user joined"}));
        // console.log('User connected');
    ws.on('message', function(message) {
        // Broadcast any received message to all clients

        var message = JSON.parse(message);
        if (message.message) {
            message['time'] = new Date()
            console.log(message)
        }
        var roomName = message.roomName
        if (roomName) {
            if (!ws.room.includes(roomName)) {
                ws.room.push(roomName)
            }

        }
        console.log(ws.room)
        if (message.roomName) {
            if (message.close) {
                ws.close()
            }
            wss.broadcast(JSON.stringify(message));
        }
        // if(messag.msg){console.log('message: ',messag.msg)}
        // console.log(ws.room)
        console.log('received: %s', message);
        // wss.broadcast(message);
    });

    ws.on('error', () => ws.terminate());
});

wss.broadcast = function(data) {
    this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {

            if (client.room.indexOf(JSON.parse(data).roomName) > -1) {
                client.send(data)
            }
        }
        // console.log('data is'+JSON.stringify(data))
        // if (client.room.indexOf(JSON.parse(data).roomName) > -1) {
        //   client.send(data)
        // }
    });
};


// io.on('connection', (socket) => {
//     socket.on('join', (roomId) => {
//             const roomClients = io.sockets.adapter.rooms[roomId] || { length: 0 }
//             var numberOfClients = roomClients.length
//             users.push(socket)
//                 // var room = io.sockets.adapter.rooms[roomId];
//                 // numberOfClients=Object.keys(room).length;

//             // const numberOfClients = 1
//             console.log(numberOfClients)
//                 // These events are emitted only to the sender socket.
//             if (numberOfClients == 0) {
//                 console.log(`Creating room ${roomId} and emitting room_created socket event`)
//                 socket.join(roomId)
//                 numberOfClients++
//                 numberofuser = { roomId: { numberOfClients: numberOfClients } }
//                 socket.emit('room_created', roomId)
//             } else {
//                 numberOfClients++
//                 numberofuser = { roomId: { numberOfClients: numberOfClients } }
//                 console.log(numberOfClients)
//                 socket.join(roomId)
//                 socket.emit('room_joined', roomId)
//             }
//             // else if (numberOfClients == 1) {
//             //   console.log(`Joining room ${roomId} and emitting room_joined socket event`)
//             //   numberOfClients++
//             //   numberofuser={roomId:{numberOfClients:numberOfClients}}
//             //   console.log(numberOfClients)
//             //   socket.join(roomId)
//             //   socket.emit('room_joined', roomId)
//             // } else {
//             //   console.log(`Can't join room ${roomId}, emitting full_room socket event`)
//             //   socket.emit('full_room', roomId)
//             // }
//         })
//         //message

//     socket.on('message', (msg, roomId) => {
//         console.log(msg, roomId);
//         socket.broadcast.to(roomId).emit('message-broadcast', msg, Date());
//     })

//     // These events are emitted to all the sockets connected to the same room except the sender.
//     socket.on('start_call', (roomId) => {
//         console.log(`Broadcasting start_call event to peers in room ${roomId}`)
//         socket.broadcast.to(roomId).emit('start_call')
//     })
//     socket.on('webrtc_offer', (event) => {
//         console.log(`Broadcasting webrtc_offer event to peers in room ${event.roomId}`)
//         socket.broadcast.to(event.roomId).emit('webrtc_offer', event.sdp)
//     })
//     socket.on('webrtc_answer', (event) => {
//         console.log(`Broadcasting webrtc_answer event to peers in room ${event.roomId}`)
//         socket.broadcast.to(event.roomId).emit('webrtc_answer', event.sdp)
//     })
//     socket.on('webrtc_ice_candidate', (event) => {
//         console.log(`Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`)
//         socket.broadcast.to(event.roomId).emit('webrtc_ice_candidate', event)
//     })
//     socket.on("hangup", (roomId) => {
//         console.log(roomId)
//         console.log(`Call ended in room ${roomId}`)
//         io.to(roomId).emit('leave', roomId)
//         numberofuser = {}
//     })

// })

//aa

app.start = app.listen = function() {
    console.log('server running on localhost || 192.168.43.119:5000')
    return server.listen.apply(server, arguments)
}

app.start(5000)

app.get('/',(req,res)=>{
    res.send('backend working')
})

// app.start(5000)