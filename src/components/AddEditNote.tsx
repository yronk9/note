import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import ReactMarkdown from 'react-markdown';
import { Bold, Italic, List, ListOrdered, ArrowLeft, Trash2 } from 'lucide-react';

interface Folder {
  id: string;
  name: string;
}

const AddEditNote: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [folderId, setFolderId] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const fetchFolders = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const foldersQuery = query(collection(db, "folders"), where("userId", "==", user.uid));
      const foldersSnapshot = await getDocs(foldersQuery);
      const foldersList = foldersSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setFolders(foldersList);

      const params = new URLSearchParams(location.search);
      const defaultFolderId = params.get('folderId');
      if (defaultFolderId) {
        setFolderId(defaultFolderId);
      } else if (foldersList.length > 0) {
        setFolderId(foldersList[0].id);
      }
    };

    const fetchNote = async () => {
      if (noteId) {
        const noteDoc = await getDoc(doc(db, "notes", noteId));
        if (noteDoc.exists()) {
          const noteData = noteDoc.data();
          setTitle(noteData.title);
          setContent(noteData.content);
          setIsPublic(noteData.isPublic);
          setFolderId(noteData.folderId);
        }
      }
    };

    fetchFolders();
    fetchNote();
  }, [noteId, location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const noteData = {
      title,
      content,
      isPublic,
      userId: user.uid,
      folderId,
      updatedAt: serverTimestamp(),
    };

    try {
      if (noteId) {
        await updateDoc(doc(db, "notes", noteId), noteData);
      } else {
        noteData.createdAt = serverTimestamp();
        await addDoc(collection(db, "notes"), noteData);
      }
      navigate(`/folder/${folderId}`);
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleDelete = async () => {
    if (!noteId) return;
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteDoc(doc(db, "notes", noteId));
        navigate(`/folder/${folderId}`);
      } catch (error) {
        console.error("Error deleting note:", error);
      }
    }
  };

  const insertMarkdown = (markdownSymbol: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    let newText;
    if (markdownSymbol === '- ' || markdownSymbol === '1. ') {
      // For lists, insert at the beginning of the line
      const lineStart = before.lastIndexOf('\n') + 1;
      newText = before.substring(0, lineStart) + markdownSymbol + before.substring(lineStart) + selection + after;
    } else {
      newText = before + markdownSymbol + selection + markdownSymbol + after;
    }

    setContent(newText);
    textarea.focus();
    textarea.setSelectionRange(start + markdownSymbol.length, end + markdownSymbol.length);
  };

  return (
    <div className="add-edit-note p-4 bg-sky-light">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center text-sky-medium hover:text-sky-dark"
      >
        <ArrowLeft size={20} className="mr-1" /> Back
      </button>
      <h2 className="text-2xl font-bold mb-4 text-sky-dark">
        {noteId ? "Edit Note" : "Add New Note"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sky-dark mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full p-2 border rounded bg-cloud-white"
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sky-dark mb-2">
            Content
          </label>
          <div className="flex space-x-2 mb-2">
            <button type="button" onClick={() => insertMarkdown('**')} className="p-1 bg-sky-medium text-white rounded">
              <Bold size={16} />
            </button>
            <button type="button" onClick={() => insertMarkdown('*')} className="p-1 bg-sky-medium text-white rounded">
              <Italic size={16} />
            </button>
            <button type="button" onClick={() => insertMarkdown('- ')} className="p-1 bg-sky-medium text-white rounded">
              <List size={16} />
            </button>
            <button type="button" onClick={() => insertMarkdown('1. ')} className="p-1 bg-sky-medium text-white rounded">
              <ListOrdered size={16} />
            </button>
            <button type="button" onClick={() => setPreviewMode(!previewMode)} className="p-1 bg-sky-medium text-white rounded">
              {previewMode ? 'Edit' : 'Preview'}
            </button>
          </div>
          {previewMode ? (
            <div className="w-full p-2 border rounded bg-cloud-white h-40 overflow-y-auto prose">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full p-2 border rounded bg-cloud-white h-40"
            />
          )}
        </div>
          <div>
            <label htmlFor="folder" className="block text-sky-dark mb-2">
              Folder
            </label>
            <select
              id="folder"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              required
              className="w-full p-2 border rounded bg-cloud-white"
            >
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sky-dark">Make this note public</span>
            </label>
          </div>
          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="bg-sky-medium text-white px-4 py-2 rounded hover:bg-sky-dark"
            >
              {noteId ? "Update Note" : "Add Note"}
            </button>
            {noteId && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center"
              >
                <Trash2 size={16} className="mr-2" /> Delete Note
              </button>
            )}
          </div>
          </form>
          </div>
          );
          };

          export default AddEditNote;