// Import Firebase modules from the CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword ,signInWithEmailAndPassword,updateProfile,signOut, signInWithPopup, GoogleAuthProvider  } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { doc, collection, setDoc, getDocs, deleteDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

//  web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDG7BnRub2Fa7XrXBTu37kAFNy6wafUBic",
    authDomain: "notes-app-login-1bc41.firebaseapp.com",
    projectId: "notes-app-login-1bc41",
    storageBucket: "notes-app-login-1bc41.appspot.com",
    messagingSenderId: "883656805017",
    appId: "1:883656805017:web:cb0114decd82ed81228608",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Authentication
const db = getFirestore(app);
const auth = getAuth(app);
export { 
    getAuth ,
    auth, 
    db, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider ,
    signInWithPopup,
    updateProfile, 
    signOut,
    doc,
    collection,
    setDoc,
    getDocs,
    deleteDoc,
    updateDoc,
    query,
    where
  };