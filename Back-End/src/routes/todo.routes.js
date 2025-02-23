import { Router } from "express";
import { createTodo, getUserTodos, updateUserTodo, deleteUserTodo } from "../controllers/todo.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/")
    .post(createTodo)
    .get(getUserTodos);

router.route("/:todoId")
    .patch(updateUserTodo)
    .delete(deleteUserTodo);

export default router;