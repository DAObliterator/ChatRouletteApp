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

let randomIdSocketsMap = new Map();

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log(socket.id, " --- ");

  socket.on("find-partner", async () => {
    const allSockets = await io.fetchSockets();

    const allRooms = io.sockets.adapter.rooms;

    let uniqueBrowserIdentifier = socket.handshake.auth.randomId;

    for (const i of allSockets) {
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
    }

    console.log(allRooms , "--allRooms--")

    socket.to(roomName).emit("welcome-message", `hello to room ${roomName}`);
  });
});

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(` server listening on ${PORT}`);
});
