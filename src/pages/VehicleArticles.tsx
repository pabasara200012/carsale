import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { uploadMultipleImages } from '../services/cloudinary';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

interface Article {
  id?: string;
  vehicleId: string;
  title: string;
  body: string;
  createdAt: any;
  author?: string;
}

interface Review {
  id?: string;
  vehicleId: string;
  userId?: string;
  userName?: string;
  rating: number;
  comment: string;
  createdAt: any;
}

const VehicleArticles: React.FC = () => {
  const { id } = useParams();
  const vehicleId = id || '';
  const { currentUser, isAdmin } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New article state (admin)
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [articleFiles, setArticleFiles] = useState<File[]>([]);

  // New review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);

  useEffect(() => {
    fetchData();
  }, [vehicleId]);

  const fetchData = async () => {
    if (!vehicleId) return;
    setLoading(true);
    try {
      const articlesQ = query(collection(db, 'vehicleArticles'), where('vehicleId', '==', vehicleId), orderBy('createdAt', 'desc'));
      const artSnap = await getDocs(articlesQ);
      const arts = artSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setArticles(arts as Article[]);

      const reviewsQ = query(collection(db, 'vehicleReviews'), where('vehicleId', '==', vehicleId), orderBy('createdAt', 'desc'));
      const revSnap = await getDocs(reviewsQ);
      const revs = revSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      setReviews(revs as Review[]);
    } catch (err) {
      console.error('Error fetching articles/reviews', err);
      setError('Failed to load articles or reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleAddArticle = async () => {
    if (!isAdmin) return;
    if (!title || !body) return;
    try {
      let imageUrls: string[] = [];
      if (articleFiles && articleFiles.length > 0) {
        // Limit to 4 images per article
        const limited = articleFiles.slice(0, 4);
        imageUrls = await uploadMultipleImages(limited);
      }

      await addDoc(collection(db, 'vehicleArticles'), {
        vehicleId,
        vehicleName: vehicleId ? '' : '',
        title,
        body,
        images: imageUrls,
        createdAt: new Date(),
        author: currentUser?.displayName || currentUser?.email || 'Admin'
      });
      setTitle('');
      setBody('');
      setArticleFiles([]);
      fetchData();
    } catch (err) {
      console.error('Add article failed', err);
    }
  };

  const handleDeleteArticle = async (articleId?: string) => {
    if (!isAdmin || !articleId) return;
    if (!confirm('Delete this article?')) return;
    try {
      await deleteDoc(doc(db, 'vehicleArticles', articleId));
      fetchData();
    } catch (err) {
      console.error('Delete article failed', err);
    }
  };

  const handleAddReview = async () => {
    if (!currentUser) {
      setError('You must be logged in to post a review');
      return;
    }
    if (!comment) return;
    try {
      let reviewImageUrls: string[] = [];
      if (reviewFiles && reviewFiles.length > 0) {
        const limited = reviewFiles.slice(0, 3);
        reviewImageUrls = await uploadMultipleImages(limited);
      }

      await addDoc(collection(db, 'vehicleReviews'), {
        vehicleId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        rating,
        comment,
        images: reviewImageUrls,
        createdAt: new Date()
      });
      setRating(5);
      setComment('');
      setReviewFiles([]);
      fetchData();
    } catch (err) {
      console.error('Add review failed', err);
    }
  };

  const handleDeleteReview = async (reviewId?: string) => {
    if (!isAdmin || !reviewId) return;
    if (!confirm('Delete this review?')) return;
    try {
      await deleteDoc(doc(db, 'vehicleReviews', reviewId));
      fetchData();
    } catch (err) {
      console.error('Delete review failed', err);
    }
  };

  if (loading) return <Layout><div className="p-6">Loading...</div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6" style={{ paddingTop: '75px' }}>
        <h1 className="text-2xl font-bold mb-4">Vehicle Articles & Reviews</h1>
        {error && <div className="mb-4 text-red-600">{error}</div>}

        {/* Reviews first (above articles) */}
        <section className="mb-8">
          <h2 className="font-semibold mb-2">Reviews</h2>
          {reviews.length === 0 && <p className="text-sm text-gray-600">No reviews yet.</p>}
          {reviews.map(r => (
            <div key={r.id} className="mb-3 p-3 border rounded">
              <div className="flex justify-between">
                <div className="font-medium">{r.userName}</div>
                <div className="text-sm text-gray-600">{new Date(r.createdAt?.seconds ? r.createdAt.toDate() : r.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-sm">Rating: {r.rating}/5</div>
              <div className="mt-1">{r.comment}</div>
              {r.images && r.images.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {r.images.map((img: string, idx: number) => (
                    <img key={idx} src={img} alt={`review-${idx}`} className="h-24 w-24 object-cover rounded" />
                  ))}
                </div>
              )}
              {isAdmin && (
                <div className="mt-2">
                  <button onClick={() => handleDeleteReview(r.id)} className="px-3 py-1 bg-red-200 rounded">Delete Review</button>
                </div>
              )}
            </div>
          ))}

          <div className="mt-4 p-4 border rounded bg-gray-50">
            <h4 className="font-semibold mb-2">Write a review</h4>
            {!currentUser && <p className="text-sm text-gray-600 mb-2">You must be logged in to post a review.</p>}
            <div className="flex gap-2 items-center mb-2">
              <label className="text-sm">Rating:</label>
              <select value={rating} onChange={e => setRating(parseInt(e.target.value))} className="p-1 border rounded">
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Your review" className="w-full mb-2 p-2 border rounded" />
            <div className="mb-2">
              <label className="text-sm">Images (optional, max 3):</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setReviewFiles(Array.from(e.target.files || []).slice(0,3))} />
            </div>
            <button onClick={handleAddReview} disabled={!currentUser} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">Submit Review</button>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="font-semibold mb-2">Articles</h2>
          {articles.length === 0 && <p className="text-sm text-gray-600">No articles yet.</p>}
          {articles.map(a => (
            <div key={a.id} className="mb-4 p-4 border rounded">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="text-sm text-gray-600">By {a.author} • {new Date(a.createdAt?.seconds ? a.createdAt.toDate() : a.createdAt).toLocaleString()}</p>
                  <div className="mt-2">{a.body}</div>
                  {a.images && a.images.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {a.images.map((img: string, idx: number) => (
                        <img key={idx} src={img} alt={`article-${idx}`} className="h-28 w-28 object-cover rounded" />
                      ))}
                    </div>
                  )}
                </div>
                {isAdmin && (
                  <div className="ml-4 flex flex-col gap-2">
                    <button onClick={() => handleDeleteArticle(a.id)} className="px-3 py-1 bg-red-200 rounded">Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isAdmin && (
            <div className="mt-4 p-4 border rounded bg-gray-50">
              <h4 className="font-semibold mb-2">Add Article</h4>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="w-full mb-2 p-2 border rounded" />
              <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Body" className="w-full mb-2 p-2 border rounded" />
              <div className="mb-2">
                <label className="text-sm">Images (optional, max 4):</label>
                <input type="file" accept="image/*" multiple onChange={(e) => setArticleFiles(Array.from(e.target.files || []).slice(0,4))} />
              </div>
              <button onClick={handleAddArticle} className="px-4 py-2 bg-blue-600 text-white rounded">Publish</button>
            </div>
          )}
        </section>

        <section>
          <h2 className="font-semibold mb-2">Reviews</h2>
          {reviews.length === 0 && <p className="text-sm text-gray-600">No reviews yet.</p>}
          {reviews.map(r => (
            <div key={r.id} className="mb-3 p-3 border rounded">
              <div className="flex justify-between">
                <div className="font-medium">{r.userName}</div>
                <div className="text-sm text-gray-600">{new Date(r.createdAt?.seconds ? r.createdAt.toDate() : r.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-sm">Rating: {r.rating}/5</div>
              <div className="mt-1">{r.comment}</div>
              {isAdmin && (
                <div className="mt-2">
                  <button onClick={() => handleDeleteReview(r.id)} className="px-3 py-1 bg-red-200 rounded">Delete Review</button>
                </div>
              )}
            </div>
          ))}

          <div className="mt-4 p-4 border rounded bg-gray-50">
            <h4 className="font-semibold mb-2">Write a review</h4>
            {!currentUser && <p className="text-sm text-gray-600 mb-2">You must be logged in to post a review.</p>}
            <div className="flex gap-2 items-center mb-2">
              <label className="text-sm">Rating:</label>
              <select value={rating} onChange={e => setRating(parseInt(e.target.value))} className="p-1 border rounded">
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Your review" className="w-full mb-2 p-2 border rounded" />
            <button onClick={handleAddReview} disabled={!currentUser} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">Submit Review</button>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default VehicleArticles;
