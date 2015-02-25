var express = require('express'),
app = express(),
http = require('http'),
server = http.createServer(app),
io = require('socket.io').listen(server);
server.listen(9000);
// routing
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/index.html');
});
// usernames which are currently connected to the chat
var usernames = {};
// rooms which are currently available in chat
var rooms = [];
io.sockets.on('connection', function (socket) {
	socket.on('adduser', function (username, room) {
		socket.username = username;
		socket.room = room;
		usernames[username] = username;
		socket.join(room);
		socket.emit('updatechat', 'SERVER', 'You are connected. Start chatting');
        socket.broadcast.to(room).emit('updatechat', 'SERVER', username + ' has connected to this room');
    });
	socket.on('createroom', function () {
		var new_room = (""+Math.random()).substring(2,7);
		rooms.push(new_room);
        socket.emit('updatechat', 'SERVER', 'Your room is ready, invite someone using this ID:' + new_room);
		socket.emit('roomcreated', new_room);
	});
    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function (data) {
        // we tell the client to execute 'updatechat' with 2 parameters
        io.sockets. in (socket.room).emit('updatechat', socket.username, data);
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function () {
        // remove the username from global usernames list
        delete usernames[socket.username];
        // update list of users in chat, client-side
        io.sockets.emit('updateusers', usernames);
        // echo globally that this client has left
        if(socket.username !== undefined){
        	socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        	socket.leave(socket.room);
        }
    });
});