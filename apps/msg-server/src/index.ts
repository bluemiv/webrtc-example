const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

io.on('connection', (socket: any) => {
  console.log('Client connected');

  socket.on('offer', (data: any) => {
    socket.broadcast.emit('offer', data);
  });

  socket.on('answer', (data: any) => {
    socket.broadcast.emit('answer', data);
  });

  socket.on('candidate', (data: any) => {
    socket.broadcast.emit('candidate', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(5000, () => {
  console.log('Listening on port 5000');
});
