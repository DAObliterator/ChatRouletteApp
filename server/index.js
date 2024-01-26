import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import session from "express-session";
import bodyParser from "body-parser";
import MongoStore from "connect-mongo";
import http from "http";
dotenv.config({ path: "./config.env" });
const app = express();
const server = http.createServer(app);
import { Server } from "socket.io";
import { actualSessionId } from "./utils/actualSessionId.js";
import { Socket } from "dgram";
import express from "express";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);





const DB = process.env.DATABASE_STRING.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(() => {
    console.log(`database connection was successfull ! :) \n`);
  })
  .catch((error) => {
    console.log(
      `error - ${error} happened while attempting to connect to database :) \n `
    );
  });

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "build")));

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
    exposedHeaders: ["set-cookie"],
  })
);

app.use(
  session({
    name: "sessionId",
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.DATABASE_STRING,
      collection: "sessions", // Collection name to store sessions
      ttl: 7 * 24 * 60 * 60,
      cookie: { secure: false },
    }),
    cookie: {
      path: "/",
      secure: false,
    },
  })
);

app.post("/initialize-session", async (req, res) => {
  try {
    const sess = req.session;
    if (!req.session.username && !req.session.randomId) {
      req.session.randomId = req.body.randomId;
      req.session.username = req.body.username;

      const mongoStore = req.sessionStore;

      const sessionId = req.sessionID;

      const sessionCollection = mongoStore.collection;

      sessionCollection.updateOne(
        { _id: sessionId },
        {
          $set: {
            randomId: req.body.randomId,
            username: req.body.username,
          },
        }
      );
    }
    res.status(200).json({ message: "session init" });
  } catch (error) {
    res.status(404).json({ message: `session init fail ${error}` });
  }
});

app.get("/check-session", (req, res) => {
  if (req.session.randomId && req.session.username) {
    res.status(200).json({
      message: "randomId and username successfully added to the req.session \n",
    });
  } else {
    res.status(404).json({ message: "failed 😭" });
  }
});

let randomIdSocketsMap = new Map();

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let  socketsMap = {}

io.on("connection", (socket) => {
  console.log(socket.id, " --- ");

  socketsMap[socket.handshake.auth.randomId] = socket.id;

  socket.on("find-partner", async () => {

    console.log(`${socket.id} and ${socket.handshake.auth.randomId} --- inside find-partner \n`);

    const allSockets = await io.fetchSockets();
    const allRooms = io.sockets.adapter.rooms;
    let uniqueBrowserIdentifier = socket.handshake.auth.randomId;
    let noOfRooms = 0;
    let noOfRooms_ = 0;

    const allRoomNames = [...allRooms.keys()];

    allRooms.size > 1 &&  allRoomNames.forEach((element) => {
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
      if ( allSockets.length > 1) {

        for (const i of allSockets) {
          let otherBrowserIdentfier = i.handshake.auth.randomId ;

          if (otherBrowserIdentfier !== uniqueBrowserIdentifier && uniqueBrowserIdentifier !== null) {
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
              io.to(roomName).emit("found-partner" , {roomName: roomName})
            }
          }

        }

      }
      
    }

    const allRoomNamesAfter = io.sockets.adapter.rooms;

    console.log(allRoomNamesAfter , " allRoomNames *** ")

   

    /*for (const i of allSockets) {
      //find a randomSocket
      // Check if randomIdSocketsMap has an entry for the current randomId
      if (!randomIdSocketsMap.has(uniqueBrowserIdentifier) ) {
        // If not, create a new Set and add it to the map
        randomIdSocketsMap.set(uniqueBrowserIdentifier, new Set());
      }

      // Add the current socket to the set associated with the randomId
      randomIdSocketsMap.get(uniqueBrowserIdentifier).add(i);
    }
    console.log(randomIdSocketsMap , "---")

    let roomName = "";
    for (const [key, value] of randomIdSocketsMap) {
      if (key !== uniqueBrowserIdentifier) {
        if (
          !allRooms.has(`${key}:${uniqueBrowserIdentifier}`) ||
          !allRooms.has(`${uniqueBrowserIdentifier}:${key}`)
        ) {
          if (key > uniqueBrowserIdentifier) {
            roomName = `${key}:${uniqueBrowserIdentifier}`;

            socket.join(roomName);
            value.forEach((i) => {
              if (!(allRooms[`${key}:${uniqueBrowserIdentifier}`].has(i))) {
                i.join(roomName);
              }
            });
            break;
          } else {
            roomName = `${uniqueBrowserIdentifier}:${key}`;

            socket.join(roomName);
            value.forEach((i) => {
              if (!allRooms[`${uniqueBrowserIdentifier}:${key}`].has(i)) {
                i.join(roomName);
              }
            });
            break;
          }
        } else if (!allRooms[`${key}:${uniqueBrowserIdentifier}`].has(socket.id)) {
          roomName = `${key}:${uniqueBrowserIdentifier}`;

          socket.join(roomName);
          value.forEach((i) => {
            if (!allRooms[`${key}:${uniqueBrowserIdentifier}`].has(i.id)) {
              i.join(roomName);
            }
          });
          break;
        } else if (!allRooms[`${uniqueBrowserIdentifier}:${key}`].has(socket.id)) {
          roomName = `${uniqueBrowserIdentifier}:${key}`;

          socket.join(roomName);
          value.forEach((i) => {
            if (!allRooms[`${uniqueBrowserIdentifier}:${key}`].has(i.id)) {
              i.join(roomName);
            }
          });
          break;
        }
      }
    }*/

     

    
  });

  socket.on("private-message", (data) => {

    console.log(
      `${socket.id} and ${socket.handshake.auth.randomId} --- inside private-message \n`
    );
    const allRooms = io.sockets.adapter.rooms;

    console.log(allRooms, "allRooms inside private-message listener (1) \n");

    const allRoomNames = [...allRooms.keys()];

    console.log(data, " grrr ");

    let count =0;
    allRoomNames.forEach((element) => {
     
      if (element === data.roomName) {
         count = count + 1;
        socket.join(data.roomName);

        socket.broadcast.to(data.roomName).emit("private-message", {
          message: data.message,
          roomName: data.roomName,
          rId: data.rId
        });
      } 
    });

    console.log(allRooms, "allRooms inside private-message listener (2) \n");
 
  });

 

});

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(` server listening on ${PORT}`);
});
