import mongoose, { Mongoose } from "mongoose";
import { Schema } from "mongoose";

const MessageSchema = Schema({
    sender: {
        type: String
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId
    },
    message: {
        type: String
    } 
}, { timestamps: true } );


export const MessageModel = mongoose.model( "Messages" , MessageSchema );