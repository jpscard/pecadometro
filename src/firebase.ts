import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, query, where, orderBy, limit, onSnapshot, getDocFromServer, getDocs, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDNclxdx3skASo0RjOO29xADndY554om3Y",
  authDomain: "pecadometro.firebaseapp.com",
  projectId: "pecadometro",
  storageBucket: "pecadometro.firebasestorage.app",
  messagingSenderId: "954447321651",
  appId: "1:954447321651:web:766433e408ee9ee6222146",
  measurementId: "G-G24FPPJWT4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, doc, getDoc, setDoc, collection, query, where, orderBy, limit, onSnapshot, getDocs, deleteDoc };

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();
