import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { randomUsernameGenerator } from "../utils/generateUsername.js";
import { useParams } from "react-router-dom";

export const ChatPage = () => {
  const [message, setMessage] = useState("");
  const [recievedMessages, setRecievedMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [randomId, setRandomId] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const [sentButtonClicked, setSentButtonClicked] = useState(false);

  const { id } = useParams();

  const rId = window.sessionStorage.getItem("randomId");
  const username = window.sessionStorage.getItem("username");

  const socket = io("http://localhost:6040/", {
    withCredentials: true,
    auth: {
      randomId: rId,
    },
  });

  socket.on("connect", () => {
    console.log(socket.id);

    socket.emit("find-partner");
  });

  

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

      

    
    /*socket.emit("welcome-message", {
        rId: window.sessionStorage.getItem("randomId"),
        message: "hello from socket"
      });

      socket.on("welcome-message" , (data) => {
        console.log( JSON.stringify(data) , " ---message back from the server \n")
      })

      socket.on("welcome-in-room" , (data) => {
        console.log(JSON.stringify(data) , " ---message in welcome in room \n");
      })*/
  }, []);

  useEffect(() => {}, [sentButtonClicked]);

  const handleFormSubmission = (e) => {
    e.preventDefault();
    let updatedMessages = allMessages;
    updatedMessages = allMessages.concat({
      message: message,
      type: "sent",
    });
    setAllMessages(updatedMessages);
    
    setSentButtonClicked(!sentButtonClicked);
  };

  const data = { rId: window.sessionStorage.getItem("randomId") };

  



  return (
    <div
      id="Chat-Page-Main"
      className="w-screen h-screen bg-bg3 flex flex-col "
    >
      <div
        id="Chat-Container"
        className="flex flex-col w-full flex-grow overflow-auto"
      >
        {allMessages.map((element) => {
          if (element.type === "sent") {
            return (
              <div
                id="Sent-Message-Div"
                className="flex flex-row justify-end p-2 sm:p-4"
              >
                <ul className="bg-bg4 flex justify-center items-center p-2 rounded-md shadow-sm">
                  {element.message}
                </ul>
              </div>
            );
          } else {
            return (
              <div
                id="Received-Message-Div"
                className="flex flex-row justify-start p-2 sm:p-4 "
              >
                <ul className="bg-bg2 flex justify-center items-center p-2 rounded-md shadow-sm">
                  {element.message}
                </ul>
              </div>
            );
          }
        })}
      </div>
      <form
        id="Send-Message-form"
        className="flex flex-row justify-evenly p-2 sm:p-4 h-24 bg-bg2"
        method="post"
        onSubmit={(e) => handleFormSubmission(e)}
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
          className=" rounded-md shadow-md text-center flex justify-center items-center"
        >
          Send
        </button>
      </form>
    </div>
  );
};
