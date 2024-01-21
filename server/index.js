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

let activeChats = [];
let roomNames = [];
let arrayOfSockets = [];

io.on("connection", async (socket) => {
  console.log("connected");
  //socket initialization

  //const randomId = socket.handshake.auth.randomId; //here randomId is correct

  socket.on("create-room", (data) => {
    console.log(data, " data from create room event \n");

    let from = data.randomId;
    //storing all active sockets in an array coupled with a unique identifier
    // to know which browser they are coming from
    io.of("/").sockets.forEach((element) => {
      if (!arrayOfSockets.includes(element.handshake.auth.randomId)) {
        arrayOfSockets.push({
          randomId: element.handshake.auth.randomId,
          socket: element,
        });
      }
    });

    //finding a Parnter out of all active sockets
    if (arrayOfSockets.length > 1) {
      const findParnter = (array) => {
        let to = array[Math.floor(Math.random() * array.length)];

        if (to.randomId !== data.randomId) {
          return to;
        } else {
          return findParnter(array);
        }
      };

      const to = findParnter(arrayOfSockets);

      socket.join(`${from}:${to.randomId}`);
      to.socket.join(`${from}:${to.randomId}`);
      const roomName = from + ":" + to.randomId;
      roomNames.push(roomName);

      socket.emit("welcome-message", {
        roomName,
        participants: [from, to.randomId],
      });
    }
  });

  let roomNames2 = [];
  let count = 0;
  socket.on("private-message", (data) => {
    count = count + 1;

    console.log(
      socket.id,
      ` ---socket.id --- ${count} inside of private-message \n`
    );

    io.of("/").sockets.forEach((element) => {
      if (!arrayOfSockets.includes(element.handshake.auth.randomId)) {
        arrayOfSockets.push({
          randomId: element.handshake.auth.randomId,
          socket: element,
        });
      }
    });

    const sender = data.room.split(":")[0]; //this is a unique identifier that all sockets send from the same browser are coupled with , sockets change on reinitialization but identifier doesnt
    const receiver = data.room.split(":")[1];

    socket.join(data.room);

    for (const i of arrayOfSockets) {
      if (i.randomId === receiver) {
        i.socket.join(data.room);
        console.log(i.socket.id, " --- id of the other socket in the room \n");
      }
    }

    console.log(
      io.sockets.adapter.rooms,
      " all rooms inside private message \n"
    );

    io.to(data.room).emit("private-message", data);
  });
});

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(` server listening on ${PORT}`);
});
