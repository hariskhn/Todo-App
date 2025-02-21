"use client"
import Form from "@/components/form";
import { loginWithEmailPassword } from "@/firebase/firebaseauth";

export default function Login(){
    return <Form text = "Login" func = {loginWithEmailPassword}/>
}