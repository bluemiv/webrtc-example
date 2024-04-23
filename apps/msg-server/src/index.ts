const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();

const totalRooms = {} as { [key: string]: { users: string[] } };

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: true,
  },
});

io.on('connection', (socket: any) => {
  console.log(`Client connected. socket: ${socket.id}`);

  socket.on('join', (data: { room: string }) => {
    if (!data?.room) return;

    socket.join(data.room);

    if (!totalRooms[data.room]) {
      totalRooms[data.room] = { users: [] };
    }
    totalRooms[data.room].users.push(socket.id);
    socket.room = data.room;

    console.log(`Join room ${data.room}. Socket ${socket.id}`);
  });

  socket.on('offer', (data: { sdp: string; room: string }) => {
    socket.to(data.room).emit('offer', { sdp: data.sdp, sender: socket.id });
  });

  socket.on('answer', (data: { sdp: string; room: string }) => {
    socket.to(data.room).emit('answer', { sdp: data.sdp, sender: socket.id });
  });

  socket.on('candidate', (data: { candidate: string; room: string }) => {
    socket.to(data.room).emit('candidate', { candidate: data.candidate, sender: socket.id });
  });

  socket.on('disconnect', () => {
    if (socket.room && totalRooms[socket.room]) {
      totalRooms[socket.room].users = totalRooms[socket.room].users.filter(
        (id) => id !== socket.id,
      );
      if (totalRooms[socket.room].users.length === 0) {
        delete totalRooms[socket.room];
      }
    }

    console.log('Client disconnected');
  });
});

server.listen(5000, () => {
  console.log('Listening on port 5000');
});
