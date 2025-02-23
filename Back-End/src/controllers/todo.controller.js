import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";
import { Todo } from "../models/todo.model.js"

const createTodo = asyncHandler(async(req, res) => {
    const { content } = req.body;

    if(!content || !content.trim()){
        throw new ApiError(401, "Content is required");
    }

    const todo = await Todo.create({
        content,
        owner: req.user._id
    });

    return res.status(201).json(new ApiResponse(201, todo, "Todo created successfully"));
    
})

const getUserTodos = asyncHandler(async(req, res) => {
    const todos = await Todo.find({ owner: req.user._id });

    if(!todos.length){
        throw new ApiError(404, "Todos not found");
    }

    return res.status(200).json(new ApiResponse(200, todos, "Todos fetched successfully"));
})

const updateUserTodo = asyncHandler(async(req, res) => {
    const { todoId } = req.params;
    const { content } = req.body;

    if(!todoId){
        throw new ApiError(401, "Todo Id is required");
    }
    if(!isValidObjectId(todoId)){
        throw new ApiError(401, "Invalid todo Id");
    }

    const todo = await Todo.findById(todoId);
    if(!todo){
        throw new ApiError(404, "Todo not found");
    }

    if(!content || !content.trim()){
        throw new ApiError(401, "Content is required");
    }

    const updatedTodo = await Todo.findByIdAndUpdate(
        todoId,
        { content },
        { new: true, runValidators: true }
    );

    return res.status(200).json(new ApiResponse(200, updatedTodo, "Todo updated successfully"));
})

const deleteUserTodo = asyncHandler(async(req, res) => {
    const { todoId } = req.params;

    if(!todoId){
        throw new ApiError(401, "Todo Id is required");
    }
    if(!isValidObjectId(todoId)){
        throw new ApiError(401, "Invalid todo Id");
    }

    const todo = await Todo.findById(todoId);
    if(!todo){
        throw new ApiError(404, "Todo not found");
    }

    await Todo.findByIdAndDelete(todoId);

    return res.status(200).json(new ApiResponse(200, {}, "Todo deleted successfully"));
})

export {
    createTodo,
    getUserTodos,
    updateUserTodo,
    deleteUserTodo
}