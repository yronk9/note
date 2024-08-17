import React from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

const SignIn: React.FC = () => {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if the user document already exists
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // If the user document doesn't exist, create it with default folders
        await setDoc(userDocRef, {
          folders: [
            { id: "ideas", name: "Ideas", description: "Your brilliant ideas" },
            { id: "tasks", name: "Tasks", description: "Your to-do list" },
            { id: "journal", name: "Journal", description: "Your personal journal" }
          ]
        });
      }

      navigate("/profile");
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <div className="sign-in p-4 flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">Sign In</h2>
      <button
        onClick={handleGoogleSignIn}
        className="bg-white text-gray-700 font-semibold py-2 px-4 border border-gray-300 rounded shadow flex items-center"
      >
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google logo"
          className="w-6 h-6 mr-2"
        />
        Sign in with Google
      </button>
    </div>
  );
};

export default SignIn;