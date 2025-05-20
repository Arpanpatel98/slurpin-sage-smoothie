import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDB_-d-Tx7wi5hhagq1LMmeaLGH6ikNH_g",
    authDomain: "slurpin-sage.firebaseapp.com",
    projectId: "slurpin-sage",
    storageBucket: "slurpin-sage.appspot.com",
    messagingSenderId: "1000000000000",
    appId: "1:1000000000000:web:1234567890abcdef1234567890abcdef",
  
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage }; 