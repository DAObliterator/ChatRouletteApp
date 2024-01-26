import express from "express";
import dotenv from "dotenv";
import path from "path";
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

let socketsMap = {};

io.on("connection", (socket) => {
  

  console.log(socket.id, " -in-connection- ");

  socketsMap[socket.handshake.auth.randomId] = socket.id;

  socket.on("find-partner", async () => {

    const currentRandomId = socket.handshake.auth.randomId;

    const allSockets = await io.fetchSockets();

    for (const i of allSockets) {
      const randomId = i.handshake.auth.randomId;

      console.log(
        randomId,
        " randomId ",
        i.id,
        " socket.id ",
        i.inRoom,
        " room status \n "
      );

      if (
        (randomId !== currentRandomId ) &&
        i.inRoom === undefined
      ) {

        let roomName =
           currentRandomId > randomId
             ? `${currentRandomId}:${randomId}`
             : `${randomId}:${currentRandomId}`;


        socket.join(roomName)
         // i want to execute a function after the successfull completion of this function

        socket.inRoom = true;

        i.join(roomName)

        i.inRoom = true;

        io.to(roomName).emit("room-joined" , { roomName: roomName } )

      }
    }
  });

  socket.on("private-message" , (data) => {

    io.to(data.roomName).emit("private-message" , data );

  })

});

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(` server listening on ${PORT}`);
});
