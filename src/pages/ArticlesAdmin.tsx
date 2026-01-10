import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { collection, query, orderBy, getDocs, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import { uploadMultipleImages } from '../services/cloudinary';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

interface Article {
  id?: string;
  vehicleId: string;
  title: string;
  body: string;
  createdAt: any;
  author?: string;
  images?: string[];
}

const ArticlesAdmin: React.FC = () => {
  const { isAdmin, currentUser } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [newVehicleId, setNewVehicleId] = useState('');
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    fetchArticles();
  }, [isAdmin]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'vehicleArticles'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setArticles(items);
    } catch (err) {
      console.error('Failed to fetch articles', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Delete this article?')) return;
    try {
      await deleteDoc(doc(db, 'vehicleArticles', id));
      fetchArticles();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const startEdit = (a: Article) => {
    setEditingId(a.id || null);
    setEditTitle(a.title);
    setEditBody(a.body);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateDoc(doc(db, 'vehicleArticles', editingId), { title: editTitle, body: editBody });
      setEditingId(null);
      fetchArticles();
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleCreate = async () => {
    if (!newVehicleId && !newVehicleName) return;
    if (!newTitle || !newBody) return;
    try {
      let images: string[] = [];
      if (newFiles && newFiles.length > 0) {
        const limited = newFiles.slice(0, 4);
        images = await uploadMultipleImages(limited);
      }

      await addDoc(collection(db, 'vehicleArticles'), {
        vehicleId: newVehicleId,
        vehicleName: newVehicleName,
        title: newTitle,
        body: newBody,
        images,
        createdAt: new Date(),
        author: currentUser?.displayName || currentUser?.email || 'Admin'
      });
      setNewVehicleId(''); setNewTitle(''); setNewBody(''); setNewVehicleName(''); setNewFiles([]);
      fetchArticles();
    } catch (err) {
      console.error('Create failed', err);
    }
  };

  if (!isAdmin) return <Layout><div className="p-6" style={{ paddingTop: '75px' }}>Access denied</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6" style={{ paddingTop: '75px' }}>
        <h1 className="text-2xl font-bold mb-4">Articles Management</h1>

        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h3 className="font-semibold mb-2">Create New Article</h3>
          <input value={newVehicleId} onChange={e => setNewVehicleId(e.target.value)} placeholder="Vehicle ID (optional)" className="w-full mb-2 p-2 border rounded" />
          <input value={newVehicleName} onChange={e => setNewVehicleName(e.target.value)} placeholder="Vehicle Name (optional)" className="w-full mb-2 p-2 border rounded" />
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" className="w-full mb-2 p-2 border rounded" />
          <textarea value={newBody} onChange={e => setNewBody(e.target.value)} rows={4} placeholder="Body" className="w-full mb-2 p-2 border rounded" />
          <div className="mb-2">
            <label className="text-sm">Images (optional, max 4):</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setNewFiles(Array.from(e.target.files || []).slice(0,4))} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded">Publish</button>
            <button onClick={() => { setNewBody(''); setNewTitle(''); setNewVehicleId(''); setNewVehicleName(''); setNewFiles([]); }} className="px-4 py-2 bg-gray-200 rounded">Clear</button>
          </div>
        </div>

        {loading ? <div>Loading...</div> : (
          <div className="space-y-4">
            {articles.map(a => (
              <div key={a.id} className="p-3 border rounded bg-white flex items-start gap-3">
                {/* Thumbnail (small) */}
                {a.images && a.images.length > 0 ? (
                  <img src={a.images[0]} alt="thumb" className="h-16 w-24 object-cover rounded-md flex-shrink-0" />
                ) : (
                  <div className="h-16 w-24 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center text-gray-400">No Image</div>
                )}

                <div className="flex-1">
                  <div className="text-xs text-gray-500">{a.vehicleName || a.vehicleId} • By {a.author}</div>
                  {editingId === a.id ? (
                    <>
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full mb-2 p-2 border rounded" />
                      <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={2} className="w-full p-2 border rounded" />
                      <div className="flex gap-2 mt-2">
                        <button onClick={saveEdit} className="px-3 py-1 bg-green-600 text-white rounded">Save</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-medium text-sm">{a.title}</div>
                      <div className="text-sm text-gray-700 mt-1 line-clamp-2">{a.body}</div>
                    </>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-2">
                  <button onClick={() => startEdit(a)} className="px-3 py-1 bg-yellow-100 text-sm rounded">Edit</button>
                  <button onClick={() => handleDelete(a.id)} className="px-3 py-1 bg-red-100 text-sm rounded">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ArticlesAdmin;
