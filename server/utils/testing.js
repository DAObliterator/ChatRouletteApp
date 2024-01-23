io.of("/").sockets.forEach((element) => {
  console.log(
    element.handshake.headers.cookie,
    " cookie in socket handshake header (inside loop) \n"
  );
  if (element.id !== socket.id) {
    const newSocketObject = {
      socketId: element.id,
      randomId: element.handshake.headers.randomId,
      cookie: element.handshake.headers.cookie,
    };

    arrayOfSockets.push(newSocketObject);
  }
});

arrayOfSockets = arrayOfSockets.filter((element) => {
  return element.cookie !== undefined;
});

arrayOfSockets = arrayOfSockets.reverse();

for (let i = 0; i < arrayOfSockets.length; i++) {
  for (let j = 0; j < arrayOfSockets.length; j++) {
    if (arrayOfSockets[i].cookie === arrayOfSockets[j].cookie && i !== j) {
      //remove j from arrayOfSockets
      arrayOfSockets.splice(j, 1);
      j--;
    }
  }
}

console.log(arrayOfSockets, arrayOfSockets.length, " ---arrayOfSockets \n");

if (arrayOfSockets.length > 1) {
  let roomName = "room" + "you:";
  socket.handshake.headers.socketId &&
    socket.handshake.headers.cookie +
      "parnter:" +
      arrayOfSockets[Math.floor(Math.random() * arrayOfSockets.length)].cookie;

  console.log(roomName, " -- this is the roomName ");

  socket.join(roomName);

  const clients = io.sockets.adapter.rooms.get(roomName);

  const numClients = clients ? clients.size : 0;

  io.to(roomName).emit("new event", "Updates");

  let participants = "";

  for (const clientId of clients) {
    const clientSocket = io.sockets.sockets.get(clientId);

    participants = participants + " " + clientSocket;
  }

  io.to(roomName).emit(
    "welcome-message",
    `hello to ${roomName} and these are `,
    JSON.stringify(participants),
    `the participants \n`
  );
}

/*if (!socketsRidMap[data.rId]) {
      socketsRidMap[data.rId] = new Set();
      socketsRidMap[data.rId].add(socket.id); 
    } else if (!socketsRidMap[data.rId].has(socket.id)) {
      socketsRidMap[data.rId].add(socket.id);
    }
    console.log(socketsRidMap , " --- socketsRidMap --- \n");

    const sockets = await io.fetchSockets();

    for ( const i of sockets ) {
      if ( !socketsArray.includes(i.id) ) {
          socketsArray.push(i.id);
      }
    }

    if ( Array.isArray(socketsArray) && socketsArray.length > 1 ) {

      let receiverRandomId = "";

      const findReceiverSocketId = (array) => {
        let receiverSocketId = array[Math.floor(Math.random() * array.length)];
        if (receiverSocketId !== socket.id) {
          return receiverSocketId;
        } else {
          return findReceiverSocketId();
        }
      };

      let receiverSocketId = findReceiverSocketId(socketsArray);

      console.log(receiverSocketId, "--receiverSocketId");

      if (receiverSocketId !== socket.id) {
        for (const [key, value] of Object.entries(socketsRidMap)) {
          if (value.has(receiverSocketId)) {
            console.log(key, "--key ", value, "--value \n");
            receiverRandomId = key;
            break;
          }
        }

        console.log(
          receiverRandomId,
          " ---receiverRandomId--- ",
          data.rId,
          " ---senderRandomId--- \n"
        );

        socket.emit("found-partner", {
          participants: [data.rId, receiverRandomId],
        });

      }

    }

  });*/

/*socket.on("welcome-message" , (data) => {
    socket.emit("welcome-message" , { rId: data.rId , message: "hello back from the server" });

    socket.join("room-1");

    socket.to("room-1").emit( "welcome-in-room" , { message: "hello to all participants in room"})
  })*/

socket.join(socket.handshake.auth.rId);

// relating browser identity to socket
if (!roomsRidMap[data.rId]) {
  roomsRidMap[data.rId] = new Set();
  roomsRidMap[data.rId].add(socket.id);
} else if (!roomsRidMap[data.rId].has(socket.id)) {
  roomsRidMap[data.rId].add(socket.id);
}

for (const [key, value] of io.sockets.adapter.rooms) {
  if (value.size === 1 && key.length !== 20 && key === data.rId) {
    let rIdArray = Object.keys(userSocketMap);

    for (const i of rIdArray) {
      if (i !== data.rId) {
        if (
          io.sockets.adapter.rooms[data.rId] &&
          !io.sockets.adapter.rooms[data.rId].has(userSocketMap[i].id)
        ) {
          userSocketMap[i].join(data.rId);
        }
      }
    }

    console.log(io.sockets.adapter.rooms, "--rooms-- 0) \n");

    socket.emit("found-partner", {
      availableRoom: key,
    });
    break;
  }
}

socket.on("join-room", (data) => {
  console.log(
    `data emitted by join-room event ${socket.id} --socket.id  ${JSON.stringify(
      data
    )}`
  );
  socket.join(data.availableRoom);

  console.log(io.sockets.adapter.rooms);

  socket.broadcast.to(data.availableRoom).emit("welcome-message", {
    message: `${socket.handshake.auth.rId} browser just joined the room`,
    roomName: data.availableRoom,
  });
});

socket.on("private-message", (data) => {
  console.log(
    `${JSON.stringify(
      data
    )} --- data in private-message emitted from client side \n`
  );

  let rooms = io.sockets.adapter.rooms;

  io.to(data.roomName).emit("private-message", data);
});
