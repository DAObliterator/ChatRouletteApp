import { useState, useEffect, useContext, createContext } from "react";
import axios from "axios";
import { Box } from "@chakra-ui/react";
import { Text } from "@chakra-ui/react";
import { randomUsernameGenerator } from "./utils/generateUsername";
import { ModalDialogue } from "./components/ModalDialogue";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { ChatPage } from "./pages/ChatPage";


function App() {
 
  return (
    <div className="flex flex-col justify-center  items-center w-screen h-screen text-3xl bg-bg1 ">
      <Router>
        <Routes>
          <Route path="/" element={<Home></Home>} ></Route>
          <Route path="/chats/new/" element={<ChatPage></ChatPage>} ></Route>
        </Routes>
      </Router>
      
    </div>
  );
}

export default App;
