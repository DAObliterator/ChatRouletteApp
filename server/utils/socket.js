socket.on("find-partner", async () => {
  console.log(
    `${socket.id} and ${socket.handshake.auth.randomId} --- inside find-partner \n`
  );

  const allSockets = await io.fetchSockets();
  const allRooms = io.sockets.adapter.rooms;
  let uniqueBrowserIdentifier = socket.handshake.auth.randomId;
  let noOfRooms = 0;
  let noOfRooms_ = 0;

  const allRoomNames = [...allRooms.keys()];

  allRooms.size > 1 &&
    allRoomNames.forEach((element) => {
      let roomParticipantsArray = element.split(":");
      if (!roomParticipantsArray.includes(uniqueBrowserIdentifier)) {
        //fmaking sure browser not in any room
        noOfRooms = noOfRooms + 1;
      } /*else {
        // if it is in a room
        console.log(allRooms[element] , " bhhh ")
        !allRooms[element].has(socket.id) && socket.join(element); //making sure current socket joins the room
      }*/
    });

  if (noOfRooms === allRooms.size) {
    //means the browser in not in any room

    let roomName = "";

    //find a browser that is not there in any room and that is not the current browser either
    if (allSockets.length > 1) {
      for (const i of allSockets) {
        let otherBrowserIdentfier = i.handshake.auth.randomId;

        if (
          otherBrowserIdentfier !== uniqueBrowserIdentifier &&
          uniqueBrowserIdentifier !== null
        ) {
          allRooms.size > 1 &&
            allRoomNames.forEach((element) => {
              let roomParticipantsArray = element.split(":");
              if (!roomParticipantsArray.includes(otherBrowserIdentfier)) {
                //fmaking sure browser not in any room
                noOfRooms_ = noOfRooms_ + 1;
              } else {
                i.join(allRooms[element]);
              }
            });

          if (noOfRooms_ === allRooms.size) {
            roomName =
              uniqueBrowserIdentifier > otherBrowserIdentfier
                ? `${uniqueBrowserIdentifier}:${otherBrowserIdentfier}`
                : `${otherBrowserIdentfier}:${uniqueBrowserIdentifier}`;

            socket.join(roomName);
            i.join(roomName);
            io.to(roomName).emit("found-partner", { roomName: roomName });
          }
        }
      }
    }
  }

  const allRoomNamesAfter = io.sockets.adapter.rooms;

  console.log(allRoomNamesAfter, " allRoomNames *** ");
});

socket.on("private-message", (data) => {
  console.log(
    `${socket.id} and ${socket.handshake.auth.randomId} --- inside private-message \n`
  );
  const allRooms = io.sockets.adapter.rooms;

  console.log(allRooms, "allRooms inside private-message listener (1) \n");

  const allRoomNames = [...allRooms.keys()];

  console.log(data, " grrr ");

  let count = 0;
  allRoomNames.forEach((element) => {
    if (element === data.roomName) {
      count = count + 1;
      socket.join(data.roomName);

      socket.broadcast.to(data.roomName).emit("private-message", {
        message: data.message,
        roomName: data.roomName,
        rId: data.rId,
      });
    }
  });

  console.log(allRooms, "allRooms inside private-message listener (2) \n");
});
