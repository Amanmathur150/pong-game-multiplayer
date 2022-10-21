const express = require("express");
const app = express();
const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

app.use("/", (req, res, next) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
const server = app.listen(3000, () => {
  console.log("app is listen on 3000");
});

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let roomList = [];

const pongNameSpace = io.of("/pong");

pongNameSpace.on("connection", (socket) => {
  let room;
  let playerName;
  socket.on("ready", (readyData) => {
    // opponentplayerName
    if (readyData.roomId) {
      let isDonehere = false;
      roomList.forEach((room, index) => {
        if (
          room.roomId === readyData.roomId &&
          room.playerId.length < 2 &&
          room.playerId.length > 0 && room.isPrivate===true
        ) {
          room.playerId.push(readyData.opponentplayerName);
          isDonehere = true;
        }
      });
      if (!isDonehere) {
        roomList.push({
          roomId: readyData.roomId,
          playerId: [readyData.opponentplayerName],
          isPrivate : true
        });
      }
      room = readyData.roomId;
      playerName = readyData.opponentplayerName;
    } else {
      let isOneExressionIsTrue = false;
      roomList.forEach((rm, i) => {
        if (rm.playerId.length < 2 && rm.isPrivate ===false) {
          rm.playerId.push(readyData.opponentplayerName);
          room = rm.roomId;
          playerName = readyData.opponentplayerName;
          isOneExressionIsTrue = true;
        }
      });

      if (!isOneExressionIsTrue) {
        room = `Room${Math.floor(Date.now() * Math.random())}`.slice(0, 10);
        playerName = readyData.opponentplayerName;
        roomList.push({
          roomId: room,
          playerId: [readyData.opponentplayerName],
          isPrivate : false
        });
      }
      // * create Random Room
      // *check that if room is already create and have space on it
      // *
    }

    // create rooom to scale up to allow more and more player to play at same time
   
    socket.join(room);
    roomList.forEach((rooms) => {
      if (rooms.roomId === room && rooms.playerId.length === 2) {
        pongNameSpace
          .to(room)
          .emit("startGame", {
            refereeId: readyData.opponentplayerName,
            roomId: room,
            opponentplayerName:
              rooms.playerId[0] === playerName
                ? rooms.playerId[0]
                : rooms.playerId[1] === playerName
                ? rooms.playerId[1]
                : null,
            room: rooms,
          });
      }
    });
  });
  socket.on("paddleMove", (paddleData) => {
    // send paddle Data to client
    socket.to(room).emit("paddleMove", paddleData);
  });
  socket.on("ballMove", (ballData) => {
    // send paddle Data to client
    socket.to(room).emit("ballMove", ballData);
  });
  socket.on("disconnect", (reason) => {
    console.log(`Connected with ${socket.id} is now disconnected ${reason}`);
    socket.leave(room);
  });
});
