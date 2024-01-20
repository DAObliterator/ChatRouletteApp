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

app.use(
  cors({
    origin: "http://localhost:5173",
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
  console.log(req.session, " -- req.session in /check-session \n");
  if (req.session.randomId && req.session.username) {
    res.status(200).json({
      message: "randomId and username successfully added to the req.session \n",
    });
  } else {
    res.status(404).json({ message: "failed 😭" });
  }
});

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let arrayOfSockets = [];
let activeChats = [];
let roomNames =[];
let arrayOfSockets2 = [];

io.on("connection", async (socket) => {

  console.log("connected")
  //socket initialization

  const randomId = socket.handshake.auth.randomId; //here randomId is correct

  console.log(
    randomId,
    " :randomId",
    socket.handshake.headers.cookie,
    " :cookie \n"
  ); //logging identity of socket also the unique identifier that binds socket to each session

  socket.join(randomId);

  io.of("/").sockets.forEach((element) => {
    console.log(
      element.handshake.auth.randomId,
      " --randomId (from)  -- unique to each browser -- \n"
    );
    if (!arrayOfSockets.includes(element.handshake.auth.randomId)) {
      arrayOfSockets.push(element.handshake.auth.randomId);
      arrayOfSockets2.push( { randomId: element.handshake.auth.randomId , socket: element} );
    }
  });

  console.log(arrayOfSockets, " ---arrayOfSockets--- \n");

  const findParnter = (array) => {
    let to = array[Math.floor(Math.random() * array.length)];

    if (to !== socket.handshake.headers.randomId) {
      console.log(to, "--to--");
      return to;
    } else {
      return findParnter(array);
    }
  };

  const to = findParnter(arrayOfSockets); // returns correct to

  if ( to !== randomId) {

    const roomName = "room:" + randomId + to;

    socket.join(roomName);

    console.log( socket.id , "sender socket id \n");

    for ( const i of roomNames) {
      if (i.randomId === to) {
        i.socket.join(roomName);
        console.log(i.socket.id , " receiver socket.id after joining room \n");
      }
    }


    if ( !roomNames.includes(roomName)) {
      roomNames.push(roomName);
    }

    socket.to(roomName).emit("welcome-message", {
      participants: [randomId, to],
      roomName: roomName,
    });

  }

  socket.on("private message", (data) => {
    if (data) {
      console.log(data, "data from private message event \n");
      try {
        console.log( io.sockets.adapter.rooms , " all active rooms \n")
        socket.to(data.room).emit("private message", (data) => { //got it there is no room called data.room
          console.log(data , " attempting to emit \n");
        });
      } catch (error) {
        console.error(`Error emitting private message: ${error}`);
      }

    } 
      //console.log(data, " 8 ) ");
      
    
  
  });


  /*console.log(to, " ---to--- \n");

  let roomsCurrentUserIn = 0;
  let roomsreceiverUserIn = 0;

  for (const i of activeChats) {
    if ( Array.isArray(i.participants) ? i.participants.includes(randomId) : false) {
      roomsCurrentUserIn = roomsCurrentUserIn + 1;
    }
    if (Array.isArray(i.participants) ? i.participants.includes(to) : false) {
      roomsreceiverUserIn = roomsreceiverUserIn + 1;
    }
  }

  if (roomsCurrentUserIn === 0 && roomsreceiverUserIn === 0) {
    if (arrayOfSockets.length > 1 && randomId !== to) {

      activeChats.push({
        id: activeChats.length > 0 ? activeChats.length : 0,
        participants: [ randomId , to],
      });

    }
    
  }

  console.log(activeChats, " --activeChats Array --- \n");

  for ( const i of activeChats ) {

    if (i.participants.length > 1) {
      const roomName = 'room-' + i.participants[0] + "-" + i.participants[1];
      if (!roomNames.includes(roomName)) {
           roomNames.push(roomName);
      }
    
    }

  }

  for ( const roomName of roomNames ) {
      if (roomName.includes(randomId)) {
        socket.join(roomName);

        io.to(roomName).emit("roomCreationSuccessfull", (roomName) => {
          console.log("roomName --- ", roomName);
        });
      }
  }

  console.log(roomNames)*/

});

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(` server listening on ${PORT}`);
});
