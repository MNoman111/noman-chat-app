const path = require("path")
const http = require("http")
const express = require("express");
const socketio = require("socket.io")
const Filter = require("bad-words")
const { generateMessage } = require("./utils/messages")
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users")

const publicPath = path.join( __dirname ,"./../public");
const PORT = process.env.PORT;

const app = express();
const server = http.createServer(app)
const io = socketio(server)

app.use( express.static(publicPath) );

app.get("", (req,res) => {
    res.render("index");
} )

// let count = 0;

// io.on( "connection", (socket) => {
//     console.log("New Websocket connection.");
//     socket.emit("countUpdated", count)
//     socket.on( "increment", () => {
//         count++;
//         // socket.emit("countUpdated", count);
//         io.emit("countUpdated", count);
//     } )
// } )

let message = "Welcome!";

io.on( "connection", (socket) => {
    console.log("New Connection.");    
    socket.on("join", ({username, room}, callback) => {
        const { error, user} = addUser({ id: socket.id, username, room })
        if( error ){
            return callback(error)
        }
        socket.join(user.room);

        socket.emit( "welcome", generateMessage("Admin",  message ) )
        socket.broadcast.to(user.room).emit("welcome", generateMessage( "Admin", `${user.username} has joined.` ))
        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback();
    })

    socket.on("userMessage", (userMessage, callback) => {
        const filter = new Filter();
        if(filter.isProfane(userMessage)){
            return callback("Profanity is not allowed.", message)
        }
        const user = getUser(socket.id);
        if( user ){
            io.to(user.room).emit("welcome", generateMessage( user.username, userMessage ))
            callback(undefined, "Message has been delivered!")    
        }
    })

    socket.on("disconnect", () => {
        const user = removeUser(socket.id);
        if( user ){
            io.to(user.room).emit("welcome",generateMessage( "Admin", `${user.username} has left.` ));
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on("location", (position, callback) => {
        const user = getUser(socket.id);
        if( user ){
            io.to(user.room).emit("locationMessage", generateMessage( user.username, `https://google.com/maps?q=${position.lat},${position.long}` ) )
            callback("location shared!")
        }
    } )

} )



server.listen( PORT, () => {
    console.log("Server is running on Port: " + PORT);
} )