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
  const [ allMessages , setAllMessages ] = useState([]);

  const { id } = useParams();

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

       const socket = io("http://localhost:6040", {
         withCredentials: true,
         auth: {
           randomId,
         },
       });

       const sender = id.split(":")[0]; //this is a unique identifier that all sockets send from the same browser are coupled with , sockets change on reinitialization but identifier doesnt
       const receiver = id.split(":")[1];

      socket.on("private-message", (data) => {
        if (data.sender !== sender) {
          console.log(data, "--new data in room-- \n"); //not logging
          setRecievedMessages([...recievedMessages, data.message]);
          setAllMessages([
            ...allMessages,
            { type: "received", message: data.message },
          ]);
        }
      });

    setRandomId(window.sessionStorage.getItem("randomId"));
  }, []);

  const handleMessageTransmission = (e) => {
    e.preventDefault();
    console.log(`handleMessageTransmission \n`);

    setSentMessages([...sentMessages, message]);
    setAllMessages([
      ...allMessages,
      { type: "sent", message: message },
    ]);

    try {
      const socket = io("http://localhost:6040", {
        withCredentials: true,
        auth: {
          randomId,
        },
      });

      const sender = id.split(":")[0]; //this is a unique identifier that all sockets send from the same browser are coupled with , sockets change on reinitialization but identifier doesnt
      const receiver = id.split(":")[1];

      console.log(allMessages, ` allMessages `);


      socket.emit(
        "private-message",
        { room: id, message: message, sender: sender , receiver: receiver },
        (data) => {
          if (data) {
            console.log(data, " private message data "); //not logging
          }
        }
      );

      
    } catch (error) {
      console.log( error , " --error happened")//not logging either
    }
  };

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
          if (element.type === "sent" ) {
            return (
              <div id="Sent-Message-Div" className="flex flex-row justify-end p-2 sm:p-4">
                <ul className="bg-bg4 flex justify-center items-center p-2 rounded-md shadow-sm" >
                  {element.message}
                </ul>
              </div>
            )
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
          className=" rounded-md shadow-md text-center flex justify-center items-center"
        >
          Send
        </button>
      </form>
    </div>
  );
};
