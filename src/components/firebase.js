import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCE-0JFKGE5DhaNxjuMW2GC1JMIOrdkJcM",
  authDomain: "login-auth-2f84c.firebaseapp.com",
  databaseURL: "https://login-auth-2f84c-default-rtdb.firebaseio.com",
  projectId: "login-auth-2f84c",
  storageBucket: "login-auth-2f84c.appspot.com",
  messagingSenderId: "235023793488",
  appId: "1:235023793488:web:b37da8a536e6bbeb65c055"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/**
 * Get a random question from the document specified by the docPath.
 * @param {string} docPath - The path to the document in Firestore.
 * @returns {Promise<string|null>} - A random question from the document or null if not found.
 */
export const getQuestion = async (docPath) => {
  try {
    const docRef = doc(db, docPath);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();

    if (data && data.Questions && Array.isArray(data.Questions)) {
      const randomQuestion = data.Questions[Math.floor(Math.random() * data.Questions.length)];
      console.log(randomQuestion);
      return randomQuestion;
    }
  } catch (error) {
    console.error("Error fetching question:", error);
  }
  return null;
};

/**
 * Get a predefined set of questions.
 * @returns {Promise<Object>} - An object containing theoretical and coding questions.
 */
export const getQuestionSet = async () => {
  return {
    "theoretical_questions": [
      "What is machine learning?",
      "What is deep learning?",
      "What is AI?"
    ],
    "coding_questions": [
      "Write a function to reverse a string in Java.",
      "Find the largest number in an array using Python."
    ]
  };
};