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

io.on("connection", async (socket) => {
  console.log(
    socket.handshake.headers.cookie,
    "---cookie in socket.handshake.headers--"
  );

  io.of("/").sockets.forEach((element) => {
    console.log(
      element.handshake.headers.cookie,
      " cookie in socket handshake header (inside loop) \n"
    );
    if (element.id !== socket.id) {
      const newSocketObject = {
        socketId: element.id,
        randomId: element.handshake.headers.randomId,
        cookie: actualSessionId(element.handshake.headers.cookie),
      };

      arrayOfSockets.push(newSocketObject);
    }
  });

  
  arrayOfSockets = arrayOfSockets.filter((element) => {
    return element.cookie !== undefined
  });

  console.log(arrayOfSockets, " ---arrayOfSockets \n");


  if (arrayOfSockets.length > 1) {
    let roomName =
      "room" +
      socket.id +
      arrayOfSockets[Math.floor(Math.random() * arrayOfSockets.length)]
        .cookie;

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
});

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(` server listening on ${PORT}`);
});
