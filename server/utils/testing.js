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
