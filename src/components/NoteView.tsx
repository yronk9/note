import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import ReactMarkdown from 'react-markdown';
import { Eye, EyeOff, Edit, Trash2 } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  folderId: string;
}

const NoteView: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      if (!noteId) return;
      const noteDoc = await getDoc(doc(db, "notes", noteId));
      if (noteDoc.exists()) {
        setNote({ id: noteDoc.id, ...noteDoc.data() } as Note);
      }
    };
    fetchNote();
  }, [noteId]);

  const handleTogglePublic = async () => {
    if (!note) return;
    await updateDoc(doc(db, "notes", note.id), { isPublic: !note.isPublic });
    setNote({ ...note, isPublic: !note.isPublic });
  };

  const handleDelete = async () => {
    if (!note) return;
    if (window.confirm("Are you sure you want to delete this note?")) {
      await deleteDoc(doc(db, "notes", note.id));
      navigate(`/folder/${note.folderId}`);
    }
  };

  if (!note) return <div className="p-4">Loading...</div>;

  return (
    <div className="note-view p-4 bg-sky-light">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-sky-dark">{note.title}</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleTogglePublic}
            className="p-2 rounded bg-sky-medium text-white"
            title={note.isPublic ? "Make Private" : "Make Public"}
          >
            {note.isPublic ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
          <Link
            to={`/edit-note/${note.id}`}
            className="p-2 rounded bg-sky-medium text-white"
            title="Edit Note"
          >
            <Edit size={20} />
          </Link>
          <button
            onClick={handleDelete}
            className="p-2 rounded bg-red-500 text-white"
            title="Delete Note"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
      <div className="mb-4 bg-cloud-white p-4 rounded shadow prose">
        <ReactMarkdown>{note.content}</ReactMarkdown>
      </div>
      <Link
        to={`/folder/${note.folderId}`}
        className="text-sky-medium underline"
      >
        Back to Folder
      </Link>
    </div>
  );
};

export default NoteView;