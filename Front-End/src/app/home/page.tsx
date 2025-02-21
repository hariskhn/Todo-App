"use client";
import { auth } from "@/firebase/firebaseauth";
import { db, saveTodo } from "@/firebase/firebasefirestore";
import {
  onAuthStateChanged,
  Unsubscribe,
} from "firebase/auth";
import {
  collection,
  DocumentData,
  onSnapshot,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Home() {
  const [todo, setTodo] = useState("");
  const [allTodos, setAllTodos] = useState<DocumentData[]>([]);
  const [editTodoId, setEditTodoId] = useState<string | null>(null);

  useEffect(() => {
    let detachOnAuthListiner = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchTodosRealtime();
      }
    });

    return () => {
      if (readTodosRealtime) {
        console.log("Component Unmount.");
        readTodosRealtime();
        detachOnAuthListiner();
      }
    };
  }, []);

  let readTodosRealtime: Unsubscribe;

  const fetchTodosRealtime = () => {
    let collectionRef = collection(db, "todos");
    let currentUserUID = auth.currentUser?.uid;
    let condition = where("uid", "==", currentUserUID);
    let q = query(collectionRef, condition);

    readTodosRealtime = onSnapshot(q, (querySnapshot) => {
      let userTodo = querySnapshot.docs.map((todoDoc) => {
        return {
          ...todoDoc.data(),
          id: todoDoc.id,
        };
      });
      setAllTodos(userTodo);
    });
  };

  const handleSaveOrUpdate = async () => {
    if (editTodoId) {
      // Edit Mode: Update the todo in Firestore
      const todoDocRef = doc(db, "todos", editTodoId);
      await updateDoc(todoDocRef, { todo });
      setEditTodoId(null); // Reset edit mode
    } else {
      // Add Mode: Save a new todo
      saveTodo(todo);
    }
    setTodo(""); // Clear input
  };

  const handleEdit = (todoId: string, todoText: string) => {
    setTodo(todoText); // Set todo text in input field
    setEditTodoId(todoId); // Set the todo ID being edited
  };

  const handleDelete = async (todoId: string) => {
    const todoDocRef = doc(db, "todos", todoId);
    await deleteDoc(todoDocRef); // Delete the todo in Firestore
  };

  return (
    <div className="mx-7 my-5">
      <h1 className="text-5xl font-bold mb-5">Todos</h1>
      <div className="flex items-center gap-3 mb-5">
        <input
          type="text"
          placeholder="Type here"
          className="input input-bordered w-full max-w-xs"
          value={todo}
          onChange={(e) => setTodo(e.target.value)}
        />
        <button className="btn btn-neutral" onClick={handleSaveOrUpdate}>
          {editTodoId ? "Update" : "Submit"}
        </button>
      </div>

      {allTodos.length > 0 ? (
        allTodos.map(({ id, todo }) => (
          <div key={id} className="p-4">
            <p className="mb-3 text-xl font-semibold">{todo}</p>
            <div className="flex gap-4">
              <button
                className="border py-2 px-3 rounded-md hover:bg-black hover:text-white"
                onClick={() => handleEdit(id, todo)}
              >
                Edit
              </button>
              <button
                className="border py-2 px-3 rounded-md hover:bg-black hover:text-white"
                onClick={() => handleDelete(id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      ) : (
        <></>
      )}
    </div>
  );
}
