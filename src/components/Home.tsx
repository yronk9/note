import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Trash2, Eye, EyeOff, X, Bold, Italic, List, ListOrdered } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface Note {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: any;
  folderId: string;
}

interface Folder {
  id: string;
  name: string;
}

const Home: React.FC = () => {
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all');
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteFolderId, setNewNoteFolderId] = useState("");
  const [newNoteIsPublic, setNewNoteIsPublic] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notesQuery = query(
      collection(db, "notes"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(5)
    );

    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const newNotes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Note[];
      setRecentNotes(newNotes);
    });

    const foldersQuery = query(
      collection(db, "folders"),
      where("userId", "==", user.uid)
    );

    const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
      const newFolders = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setFolders(newFolders);
      if (newFolders.length > 0 && !newNoteFolderId) {
        setNewNoteFolderId(newFolders[0].id);
      }
    });

    return () => {
      unsubscribeNotes();
      unsubscribeFolders();
    };
  }, [newNoteFolderId]);

  const handleDelete = async (noteId: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      await deleteDoc(doc(db, "notes", noteId));
    }
  };

  const handleAddNote = async () => {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "notes"), {
      title: newNoteTitle,
      content: newNoteContent,
      isPublic: newNoteIsPublic,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId: user.uid,
      folderId: newNoteFolderId,
    });

    setNewNoteTitle("");
    setNewNoteContent("");
    setNewNoteIsPublic(false);
    setIsNewNoteModalOpen(false);
  };

  const handleAddFolder = async () => {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, "folders"), {
      name: newFolderName,
      userId: user.uid,
    });

    setNewFolderName("");
    setIsNewFolderModalOpen(false);
  };

  const insertMarkdown = (markdownSymbol: string) => {
    const textarea = document.getElementById('newNoteContent') as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    let newText;
    if (markdownSymbol === '- ' || markdownSymbol === '1. ') {
      const lineStart = before.lastIndexOf('\n') + 1;
      newText = before.substring(0, lineStart) + markdownSymbol + before.substring(lineStart) + selection + after;
    } else {
      newText = before + markdownSymbol + selection + markdownSymbol + after;
    }

    setNewNoteContent(newText);
    textarea.focus();
    textarea.setSelectionRange(start + markdownSymbol.length, end + markdownSymbol.length);
  };

  const filteredNotes = recentNotes.filter(note => {
    if (visibility === 'all') return true;
    if (visibility === 'public') return note.isPublic;
    if (visibility === 'private') return !note.isPublic;
  });

  return (
    <div className="home p-4 bg-sky-light">
      <h1 className="text-3xl font-bold mb-6 text-sky-dark">Welcome to Your Notes</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-sky-dark">Your Folders</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <Link
              key={folder.id}
              to={`/folder/${folder.id}`}
              className="bg-cloud-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold text-sky-dark">{folder.name}</h3>
            </Link>
          ))}
          <button
            onClick={() => setIsNewFolderModalOpen(true)}
            className="bg-sky-medium text-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow flex items-center justify-center"
          >
            <span className="text-lg">+ New Folder</span>
          </button>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-sky-dark">Recent Notes</h2>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as 'all' | 'public' | 'private')}
            className="bg-cloud-white border border-sky-medium rounded px-2 py-1"
          >
            <option value="all">All Notes</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>
        </div>
        <div className="space-y-4">
          {filteredNotes.map((note) => {
            const isContentTruncated = note.content.length > 150;
            const displayContent = isContentTruncated
              ? note.content.substring(0, 150) + '...'
              : note.content;

            return (
              <div
                key={note.id}
                className="bg-cloud-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold text-sky-dark">{note.title}</h3>
                  <div className="flex space-x-2">
                    <Link to={`/edit-note/${note.id}`}>
                      <Pencil className="text-sky-medium hover:text-sky-dark" size={20} />
                    </Link>
                    <button onClick={() => handleDelete(note.id)}>
                      <Trash2 className="text-red-500 hover:text-red-700" size={20} />
                    </button>
                    {note.isPublic ? (
                      <Eye className="text-sky-medium" size={20} />
                    ) : (
                      <EyeOff className="text-sky-medium" size={20} />
                    )}
                  </div>
                </div>
                <div className="text-gray-600 mb-2">
                  <ReactMarkdown>{displayContent}</ReactMarkdown>
                </div>
                {isContentTruncated && (
                  <Link
                    to={`/note/${note.id}`}
                    className="text-sky-medium hover:underline"
                  >
                    Read more
                  </Link>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={() => setIsNewNoteModalOpen(true)}
          className="bg-sky-medium text-white px-4 py-2 rounded mt-4 inline-block"
        >
          Add New Note
        </button>
      </section>

      {/* New Note Modal */}
      {isNewNoteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Note</h3>
              <button onClick={() => setIsNewNoteModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Note Title"
              className="w-full p-2 mb-4 border rounded"
            />
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
                <ReactMarkdown>{newNoteContent}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                id="newNoteContent"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Note Content"
                className="w-full p-2 mb-4 border rounded h-40"
              />
            )}
            <div className="mb-4">
              <label htmlFor="newNoteFolderId" className="block text-sky-dark mb-2">
                Folder
              </label>
              <select
                id="newNoteFolderId"
                value={newNoteFolderId}
                onChange={(e) => setNewNoteFolderId(e.target.value)}
                className="w-full p-2 border rounded bg-cloud-white"
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newNoteIsPublic}
                  onChange={(e) => setNewNoteIsPublic(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sky-dark">Make this note public</span>
              </label>
            </div>
            <button
              onClick={handleAddNote}
              className="bg-sky-medium text-white px-4 py-2 rounded"
            >
              Add Note
            </button>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Folder</h3>
              <button onClick={() => setIsNewFolderModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder Name"
              className="w-full p-2 mb-4 border rounded"
            />
            <button
              onClick={handleAddFolder}
              className="bg-sky-medium text-white px-4 py-2 rounded"
            >
              Add Folder
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;