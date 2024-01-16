import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { randomUsernameGenerator } from "../utils/generateUsername.js";

export const ChatPage = () => {
  const [message, setMessage] = useState("");
  const [recievedMessages, setRecievedMessages] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:6040/check-session", { withCredentials: true })
      .then((response) => {
        console.log(
          response.data,
          " response.data from the /check-session endpoint \n"
        );
      })
      .catch((error) => {
        console.log(
          `errror happened while trying to access the /check-session endpoint ${error} \n`
        );
      });
  }, []);

  const handleMessageTransmission = async (e) => {
    e.preventDefault();
  };

  return (
    <div
      id="Chat-Page-Main"
      className="w-screen h-screen bg-bg3 flex flex-col "
    >
      <div id="Chat-Container" className="flex flex-col w-full flex-grow">
        {recievedMessages.map((element) => {
          return (
            <ul className="w-32 h-8 rounded-md bg-bg2 shadow-md p-2 sm:p-4 text-xs font-semibold text-white">
              {element}
            </ul>
          );
        })}
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
            src="/DaObliterator.png"
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
