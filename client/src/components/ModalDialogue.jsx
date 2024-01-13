import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

export const ModalDialogue = ({ showModal, setShowModal }) => {

 

  const socket = io("http://localhost:6040")
  const navigate = useNavigate();
  const handlePartnerCoupling = (e) => {
    e.preventDefault();
    console.log(" --- :) --- ");
    axios
      .get("http://localhost:6040/chats/initiateChat", { withCredentials: true })
      .then((response) => {
        console.log(response.data, " response from /findParnter endpoint \n");
      })
      .catch((error) => {
        console.log(error, " error happened! ");
      })
      .finally((data) => {
        console.log(data, " ---inside finally \n");
      });

    setShowModal(false);
    navigate("/chat/new");
    
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
          Hello, {document.cookie /*this returns nothing */} Let's keep our conversations positive and inclusive. Please
          refrain from using abusive language or engaging in racist behavior.
          Together, we create a space where everyone feels valued. Thank you for
          your cooperation!
        </div>
        <button
          id="Modal-OK"
          className="text-lg text-txt2 border-transparent"
          onClick={(e) => handlePartnerCoupling(e)}
        >
          ACCEPT
        </button>
      </div>
    </div>
  );
};
