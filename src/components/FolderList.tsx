import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from 'lucide-react';

interface Folder {
  id: string;
  name: string;
  description: string;
}

const FolderList: React.FC = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const foldersQuery = query(
      collection(db, "folders"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(foldersQuery, (snapshot) => {
      const newFolders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Folder[];
      setFolders(newFolders);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="folder-list p-4 bg-sky-light">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-sky-medium hover:text-sky-dark"
      >
        <ArrowLeft size={20} className="mr-1" /> Back
      </button>
      <h1 className="text-3xl font-bold mb-6 text-sky-dark">Your Folders</h1>
      <Link
        to="/add-folder"
        className="bg-sky-medium text-white px-4 py-2 rounded mb-4 inline-block"
      >
        Add New Folder
      </Link>
      <div className="folders-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {folders.map((folder) => (
          <Link
            key={folder.id}
            to={`/folder/${folder.id}`}
            className="bg-cloud-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2 text-sky-dark">{folder.name}</h2>
            <p className="text-gray-600">{folder.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FolderList;