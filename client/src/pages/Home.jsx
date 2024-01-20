import React , { useState , useEffect } from 'react';
import axios from 'axios';
import { ModalDialogue } from '../components/ModalDialogue';
import { randomUsernameGenerator } from '../utils/generateUsername';

export const Home = () => {
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    console.log("useEffect executed");

    const randomId = randomUsernameGenerator().randomId;
    const username = randomUsernameGenerator().username;

    if ( !window.sessionStorage.getItem("randomId") && !window.sessionStorage.getItem("username")) {
       window.sessionStorage.setItem("randomId", randomId);
       window.sessionStorage.setItem("username", username);
    }
   
    axios
      .post(
        "http://localhost:6040/initialize-session",
        { randomId, username },
        { withCredentials: true }
      )
      .then((response) => {
        console.log(
          response.data,
          response.headers["set-cookie"],
          " response.data and cookie "
        );
        window.localStorage.setItem(
          "sessionId",
          response.headers["set-cookie"]
        );
      })
      .catch((error) => {
        console.log(
          error,
          " --- error happened while attempting to initialize session \n"
        );
      });
  }, []);

  const destroyModal = () => {
    setShowModal(false);
  };

  return (
    <div className="flex flex-col justify-center  items-center w-screen h-screen text-3xl bg-bg1 ">
      <h1
        id="app-name-heading"
        className="text-4xl font-bold tracking-widest text-center m-2 p-4 "
      >
        TBA
      </h1>
      <div
        id="main-div"
        className="bg-opacity-20 bg-bg2 w-3/4 rounded-md shadow-md  p-8"
      >
        <div
          id="welcome-div"
          className="flex flex-col justify-evenly items-center "
        >
          <h1 className="text-txt1 font-extrabold text-3xl tracking-wide text-center">
            Hello , Welcome OFFICER lets hook you up with someone to chat{" "}
            with...
          </h1>
          <button
            className="sm-text-2xl tracking-wider text-lg rounded-md hover:text-white bg-gray-700 text-black font-bold m-4 p-2 w-40 h-16"
            onClick={(e) => {
              e.preventDefault();
              setShowModal(true);
            }}
          >
            {" "}
            YES{" "}
          </button>
        </div>
      </div>
      <div
        id="about-app-div"
        className="flex flex-row justify-evenly sm:m-4 m-2 sm:p-4 p-2"
      ></div>
      {showModal && (
        <ModalDialogue
          showModal={showModal}
          setShowModal={setShowModal}
        ></ModalDialogue>
      )}
    </div>
  );
}
