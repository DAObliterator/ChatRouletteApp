import mongoose from "mongoose";
import { Schema } from "mongoose";


const ChatSchema = Schema({

    participants: [{ type: String }],

} , { timestamps: true})


export const ChatModel = mongoose.model( "Chats"  , ChatSchema)