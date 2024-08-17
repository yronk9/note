import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { ArrowLeft, Trash2 } from 'lucide-react';
import { onAuthStateChanged } from "firebase/auth";

const AddEditFolder: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [user, setUser] = useState(auth.currentUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        navigate('/signin');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchFolder = async () => {
      if (folderId && user) {
        try {
          const folderDoc = await getDoc(doc(db, "folders", folderId));
          if (folderDoc.exists() && folderDoc.data().userId === user.uid) {
            const folderData = folderDoc.data();
            setName(folderData.name);
            setDescription(folderData.description);
          } else {
            setError("You don't have permission to edit this folder.");
          }
        } catch (error) {
          console.error("Error fetching folder:", error);
          setError("Error fetching folder data. Please try again.");
        }
      }
    };

    fetchFolder();
  }, [folderId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be signed in to perform this action.");
      return;
    }

    const folderData = {
      name,
      description,
      userId: user.uid,
      updatedAt: serverTimestamp(),
    };

    try {
      if (folderId) {
        await updateDoc(doc(db, "folders", folderId), folderData);
      } else {
        folderData.createdAt = serverTimestamp();
        await addDoc(collection(db, "folders"), folderData);
      }
      navigate("/folders");
    } catch (error) {
      console.error("Error saving folder:", error);
      setError("Error saving folder. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!user || !folderId) {
      setError("You must be signed in to perform this action.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this folder? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "folders", folderId));
        navigate("/folders");
      } catch (error) {
        console.error("Error deleting folder:", error);
        setError("Error deleting folder. Please try again.");
      }
    }
  };

  if (!user) {
    return <div>Redirecting to sign in...</div>;
  }

  return (
    <div className="add-edit-folder p-4 bg-sky-light">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-sky-medium hover:text-sky-dark"
      >
        <ArrowLeft size={20} className="mr-1" /> Back
      </button>
      <h2 className="text-2xl font-bold mb-4 text-sky-dark">
        {folderId ? "Edit Folder" : "Add New Folder"}
      </h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sky-dark mb-2">
            Folder Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 border rounded bg-cloud-white"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sky-dark mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded bg-cloud-white h-32"
          />
        </div>
        <div className="flex justify-between items-center">
          <button
            type="submit"
            className="bg-sky-medium text-white px-4 py-2 rounded hover:bg-sky-dark"
          >
            {folderId ? "Update Folder" : "Add Folder"}
          </button>
          {folderId && (
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center"
            >
              <Trash2 size={16} className="mr-2" /> Delete Folder
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddEditFolder;