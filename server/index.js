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
console.log(process.env.SECRET);
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

app.get("/initialize-session", async (req, res) => {
  try {
    const sess = req.session;
    console.log(req.session, " --- req.session --- \n");
    res.status(200).json({ message: "session init" });
  } catch (error) {
    res.status(404).json({ message: `session init fail ${error}` });
  }
});

app.get("/chats/initiateChat", (req, res) => {
  console.log(`req recieved to chats/initiateChat endpoint`);
});

app.get("/findPartner", (req, res) => {
  /* out of all sockets availabe select one randomly... */

  console.log(` get request received to findPartner endpoint \n`);

  res.status(200).json({ message: "success" });
});

app.get("/authenticate-user", (req, res) => {
  console.log(req.headers.cookie, " --cookie in /authenticate-user --- ");
  res.status(200).json({ status: "success" });
});

const activeUsers = {};

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", async (socket) => {
  console.log(socket.id, " ---socket user connected  \n");

  socket.on("chat-message", (msg) => {
    console.log("message: " + JSON.stringify(msg));
  });
});

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(` server listening on ${PORT}`);
});
