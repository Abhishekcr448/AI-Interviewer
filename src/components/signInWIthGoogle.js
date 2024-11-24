import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "./firebase";
import { toast } from "react-toastify";
import { setDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function SignInwithGoogle() {
  const navigate = useNavigate();

  // Function to handle Google sign-in
  async function googleLogin() {
    const provider = new GoogleAuthProvider();
    try {
      // Sign in with Google using Firebase authentication
      const result = await signInWithPopup(auth, provider);
      console.log(result);
      const user = result.user;

      if (user) {
        // Save user information to Firestore
        await setDoc(doc(db, "Users", user.uid), {
          email: user.email,
          firstName: user.displayName,
          photo: user.photoURL,
          lastName: "",
        });

        // Show success toast notification
        toast.success("User logged in Successfully", {
          position: "top-center",
        });

        // Navigate to home page with user ID in state
        navigate("/home", { state: user.uid });
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);

      // Show error toast notification
      toast.error("Failed to log in with Google", {
        position: "bottom-center",
      });
    }
  }

  return (
    <div>
      <p className="continue-p">--Or continue with--</p>
      <div
        style={{ display: "flex", justifyContent: "center", cursor: "pointer" }}
        onClick={googleLogin}
      >
        <img src={require("./google.png")} width={"60%"} alt="google-sign-in" />
      </div>
    </div>
  );
}

export default SignInwithGoogle;