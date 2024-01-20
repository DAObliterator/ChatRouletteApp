import React, { useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import { useNavigate } from "react-router-dom";

export const ModalDialogue = ({ showModal, setShowModal }) => {
  const [roomName, setRoomName] = useState("");

  const navigate = useNavigate();
  const handlePartnerCoupling = (e) => {
    e.preventDefault();

    const randomId = window.sessionStorage.getItem("randomId");
    const username = window.sessionStorage.getItem("username");

    const userDetails = { randomId, username };


  function initiateSocketConnection () {

      const socket = io("http://localhost:6040", {
        withCredentials: true,
        auth: {
          randomId,
        },
      });

      socket.on("welcome-message", (msg) => {
        console.log(msg, " message from room");
        setRoomName(msg.roomName);
        if (msg.participants && msg.participants.length > 1 && msg.roomName) {
             navigate(`/chat/new/${msg.roomName}`);
        } 
      });


    }

    initiateSocketConnection();

  

    

    /*
    FIND A PARNTER COMPLETE PAIRING CREATE A ROOM AND A ROOM ID USING TWO 
    UNIQUE SOCKET IDENTFIERS , USE THAT ROOM ID AT THE END OF THE ROUTE ,
    EACH COMPONENT THAT IS RENDERED AT THESE CUSTOM ROUTES ARE GOING TO BE 
    DIFFERENT SLIGHTLY
    */

    setShowModal(false);
    //navigate("/chats/new");
  };

  return (
    <div
      id="Modal-Dialogue-Background"
      className="w-screen h-screen flex flex-col bg-opacity-40 bg-slate-300 justify-center items-center absolute "
    >
      <button
        id="Modal-Close-btn-absolute"
        className="bg-inherit text-white font-bold text-lg absolute top-0 right-0 border-transparent"
        onClick={(e) => {
          e.preventDefault();
          setShowModal(false);
        }}
      >
        X
      </button>

      <div
        id="Modal-Dialogue-Main"
        className="flex flex-col p-2 sm:p-4 justify-center rounded-md shadow-md items-center w-1/4 text-txt1 text-xl bg-bg2"
      >
        <div
          id="Modal-Content"
          className="flex  text-lg tracking-wide font-bold justify-center items-center text-black"
        >
          Hello, {document.cookie /*this returns nothing */} Let's keep our
          conversations positive and inclusive. Please refrain from using
          abusive language or engaging in racist behavior. Together, we create a
          space where everyone feels valued. Thank you for your cooperation!
        </div>
        <button
          id="Modal-OK"
          className="text-lg text-txt2 border-transparent"
          style={{ display: `` }}
          onClick={(e) => handlePartnerCoupling(e)}
        >
          ACCEPT
        </button>
      </div>
    </div>
  );
};
