import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { Link, useNavigate } from "react-router-dom";

interface Folder {
  id: string;
  name: string;
  description: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchFolders(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchFolders = async (userId: string) => {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      setFolders(userDoc.data().folders || []);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleAddFolder = async () => {
    if (!user || !newFolderName.trim()) return;

    const newFolder: Folder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      description: newFolderDescription.trim(),
    };

    await updateDoc(doc(db, "users", user.uid), {
      folders: arrayUnion(newFolder),
    });

    setFolders([...folders, newFolder]);
    setNewFolderName("");
    setNewFolderDescription("");
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!user) return;

    const folderToDelete = folders.find((folder) => folder.id === folderId);
    if (!folderToDelete) return;

    await updateDoc(doc(db, "users", user.uid), {
      folders: arrayRemove(folderToDelete),
    });

    setFolders(folders.filter((folder) => folder.id !== folderId));
  };

  return (
    <div className="profile p-4 bg-sky-light">
      <h2 className="text-2xl font-bold mb-4 text-sky-dark">Your Profile</h2>
      {user && (
        <div className="mb-4">
          <p className="text-gray-600">Email: {user.email}</p>
        </div>
      )}
      <button
        onClick={handleSignOut}
        className="bg-red-500 text-white px-4 py-2 rounded mb-6"
      >
        Sign Out
      </button>
      <h3 className="text-xl font-semibold mb-2 text-sky-dark">Your Folders</h3>
      <div className="folders-list space-y-4 mb-6">
        {folders.map((folder) => (
          <div key={folder.id} className="bg-cloud-white shadow-md rounded-lg p-4">
            <h4 className="text-lg font-semibold mb-1 text-sky-dark">{folder.name}</h4>
            <p className="text-gray-600 mb-2">{folder.description}</p>
            <div className="flex space-x-2">
              <Link
                to={`/folder/${folder.id}`}
                className="bg-sky-medium text-white px-3 py-1 rounded text-sm"
              >
                View Notes
              </Link>
              <button
                onClick={() => handleDeleteFolder(folder.id)}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="add-folder">
        <h4 className="text-lg font-semibold mb-2 text-sky-dark">Add New Folder</h4>
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="Folder Name"
          className="w-full p-2 border rounded mb-2 bg-cloud-white"
        />
        <input
          type="text"
          value={newFolderDescription}
          onChange={(e) => setNewFolderDescription(e.target.value)}
          placeholder="Folder Description"
          className="w-full p-2 border rounded mb-2 bg-cloud-white"
        />
        <button
          onClick={handleAddFolder}
          className="bg-sky-medium text-white px-4 py-2 rounded"
        >
          Add Folder
        </button>
      </div>
    </div>
  );
};

export default Profile;