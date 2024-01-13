import React, { useState } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

export const ChatPage = () => {
  const [message, setMessage] = useState("");

  const handleMessageTransmission = async (e) => {
    e.preventDefault();

    const socket = io("http://localhost:6040", {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
      autoConnect: false,
    });

    if (message) {
      console.log(`this is the message ${message}`);
      const uniqueId = uuidv4();
      socket.emit("chat-message", { message });
    }

    axios
      .get("http://localhost:6040/authenticate-user", {
        withCredentials: true,
      })
      .then((response) => {
        console.log( response.headers["set-cookie"], " cookie \n");
      })
      .catch((error) => {});

    /*const response = await fetch("http://localhost:6040/authenticate-user", {
      method: "GET", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include"
    });

    const result = await response.headers.getSetCookie();
    console.log( result , " ---cookie--- ")*/
  };

  return (
    <div
      id="Chat-Page-Main"
      className="w-screen h-screen bg-bg3 flex flex-col "
    >
      <div id="Chat-Container" className="flex flex-col w-full flex-grow">
        {" "}
      </div>
      <form
        id="Send-Message-form"
        className="flex flex-row justify-evenly p-2 sm:p-4 h-24 bg-bg2"
        method="post"
        onSubmit={(e) => handleMessageTransmission(e)}
      >
        <div
          id="Profile-Image-Wrapper"
          className="flex flex-col items-center justify-center "
        >
          <img
            src="/avatardummy.png"
            id="Profile-Dummy"
            className="rounded-full w-12 h-12"
          />
        </div>

        <input
          type="text"
          className="flex-grow rounded-md m-2"
          placeholder="Hi..."
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          id="Send-Message-Button"
          className=" rounded-md shadow-md text-center"
        >
          Send
        </button>
      </form>
    </div>
  );
};
