import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import ReactMarkdown from 'react-markdown';
import { Eye, EyeOff, Edit, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: any;
}

interface Folder {
  id: string;
  name: string;
  description: string;
}

const FolderView: React.FC = () => {
  const { folderId } = useParams<{ folderId: string }>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [expandedNotes, setExpandedNotes] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFolder = async () => {
      if (folderId) {
        const folderDoc = await getDoc(doc(db, "folders", folderId));
        if (folderDoc.exists()) {
          const folderData = { id: folderDoc.id, ...folderDoc.data() } as Folder;
          setFolder(folderData);
          setEditedName(folderData.name);
          setEditedDescription(folderData.description);
        }
      }
    };

    fetchFolder();

    const user = auth.currentUser;
    if (!user || !folderId) return;

    const notesQuery = query(
      collection(db, "notes"),
      where("userId", "==", user.uid),
      where("folderId", "==", folderId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
      const newNotes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
      setNotes(newNotes);
    });

    return () => unsubscribe();
  }, [folderId]);

  const handleSaveFolder = async () => {
    if (!folder) return;
    try {
      await updateDoc(doc(db, "folders", folder.id), {
        name: editedName,
        description: editedDescription,
      });
      setFolder({ ...folder, name: editedName, description: editedDescription });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating folder:", error);
    }
  };

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId) 
        : [...prev, noteId]
    );
  };

  return (
    <div className="folder-view p-4 bg-sky-light">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-sky-medium hover:text-sky-dark"
      >
        <ArrowLeft size={20} className="mr-1" /> Back
      </button>
      {isEditing ? (
        <div className="mb-4">
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
          />
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
          />
          <button
            onClick={handleSaveFolder}
            className="bg-sky-medium text-white px-4 py-2 rounded mr-2"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-bold mb-2 text-sky-dark">{folder?.name}</h1>
          <p className="text-gray-600 mb-4">{folder?.description}</p>
        </>
      )}
      <div className="flex space-x-2 mb-4">
        <Link
          to={`/add-note?folderId=${folderId}`}
          className="bg-sky-medium text-white px-4 py-2 rounded inline-block"
        >
          Add New Note
        </Link>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="bg-sky-medium text-white px-4 py-2 rounded inline-block"
        >
          {isEditing ? "Cancel Edit" : "Edit Details"}
        </button>
      </div>
      <div className="notes-list space-y-4">
        {notes.length === 0 ? (
          <p>No notes in this folder yet.</p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-cloud-white shadow-md rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-sky-dark">{note.title}</h2>
                <div className="flex items-center space-x-2">
                  {note.isPublic ? (
                    <Eye className="text-sky-medium" size={20} title="Public" />
                  ) : (
                    <EyeOff className="text-sky-medium" size={20} title="Private" />
                  )}
                  <Link to={`/edit-note/${note.id}`}>
                    <Edit className="text-sky-medium" size={20} title="Edit Note" />
                  </Link>
                </div>
              </div>
              <div className="text-gray-600 mb-2 prose">
                <ReactMarkdown>
                  {expandedNotes.includes(note.id) ? note.content : note.content.substring(0, 150)}
                </ReactMarkdown>
              </div>
              {note.content.length > 150 && (
                <button
                  onClick={() => toggleNoteExpansion(note.id)}
                  className="text-sky-medium hover:underline flex items-center"
                >
                  {expandedNotes.includes(note.id) ? (
                    <>
                      Read less <ChevronUp size={16} className="ml-1" />
                    </>
                  ) : (
                    <>
                      Read more <ChevronDown size={16} className="ml-1" />
                    </>
                  )}
                </button>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Created on {note.createdAt.toDate().toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FolderView;