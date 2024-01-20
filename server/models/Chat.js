import mongoose from "mongoose";
import { Schema } from "mongoose";


const ChatSchema = Schema({

    roomName: {
        type: String
    },
    participants: [{ type: String }],

} , { timestamps: true})


export const ChatModel = mongoose.model( "Chats"  , ChatSchema)