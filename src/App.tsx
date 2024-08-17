import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import Home from "./components/Home";
import SignIn from "./components/SignIn";
import { User as FirebaseUser } from "firebase/auth";
import WelcomeScreen from "./components/WelcomeScreen";
import BottomTabBar from "./components/BottomTabBar";
import NoteView from "./components/NoteView";
import AddEditNote from "./components/AddEditNote";
import FolderList from "./components/FolderList";
import FolderView from "./components/FolderView";
import AddEditFolder from "./components/AddEditFolder";

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="app flex flex-col min-h-screen bg-sky-light">
        <main className="flex-grow">
          {user ? (
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/folders" element={<FolderList />} />
              <Route path="/folder/:folderId" element={<FolderView />} />
              <Route path="/add-folder" element={<AddEditFolder />} />
              <Route path="/edit-folder/:folderId" element={<AddEditFolder />} />
              <Route path="/note/:noteId" element={<NoteView />} />
              <Route path="/add-note" element={<AddEditNote />} />
              <Route path="/edit-note/:noteId" element={<AddEditNote />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<WelcomeScreen />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </main>
        {user && <BottomTabBar />}
      </div>
    </Router>
  );
};

export default App;