"use client"
import Form from "@/components/form";
import { signupWithEmailPassword } from "@/firebase/firebaseauth";

export default function Signup(){
    return <Form text = "Signup" func = {signupWithEmailPassword}/>
}