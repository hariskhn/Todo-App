import mongoose, { Schema } from "mongoose";

const todoSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    completed: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const Todo = mongoose.model("Todo", todoSchema);