import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHG5fJS69-X2jtuJ7NEy6_YYRySo71yzQ",
  authDomain: "mtgglenwood.firebaseapp.com",
  projectId: "mtgglenwood",
  storageBucket: "mtgglenwood.firebasestorage.app",
  messagingSenderId: "431691367188",
  appId: "1:431691367188:web:13a492c1f746917ab83801"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
