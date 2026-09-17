
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "resq-ai-f677c.firebaseapp.com",
  projectId: "resq-ai-f677c",
  storageBucket: "resq-ai-f677c.firebasestorage.app",
  messagingSenderId: "301762599128",
  appId: "1:301762599128:web:37463decb1f23d77f01fad",
  measurementId: "G-D5MTJJC9Z9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const goolgeProvider = new GoogleAuthProvider()