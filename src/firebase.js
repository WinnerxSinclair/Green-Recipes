// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
import {getStorage} from "firebase/storage";
import { getAuth } from 'firebase/auth'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDfyZc2zBGHdeyYyt8HD5JG99yD9ctzcBs",

  authDomain: "green-recipes-demo.firebaseapp.com",

  projectId: "green-recipes-demo",

  storageBucket: "green-recipes-demo.appspot.com",

  messagingSenderId: "546230743183",

  appId: "1:546230743183:web:c9dc0b4d003ef13bb840fa",

  measurementId: "G-CG5JZF0JE9"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


export const storage = getStorage(app);

export const firebaseAppAuth = getAuth(app);
export const db = getFirestore(app);