import { useEffect, useState } from "react";
import PostForm from "../components/PostForm";
import PostList from "../components/PostList";
import { getPosts, createPost, updatePost, deletePost } from "../api/postsApi";
import { useAuth } from "../context/AuthContext";

function DashboardPage() {
  const [posts, setPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [error, setError] = useState("");
  const { user, logout } = useAuth();

  const fetchPosts = async () => {
    try {
      const data = await getPosts();
      setPosts(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch posts");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts();
    const t = setInterval(fetchPosts, 15000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (payload) => {
    try {
      setError("");
      if (editingPost) {
        await updatePost(editingPost._id, payload);
        setEditingPost(null);
      } else {
        await createPost(payload);
      }
      await fetchPosts();
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
    }
  };

  const handleDelete = async (id) => {
    try {
      setError("");
      await deletePost(id);
      await fetchPosts();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="container">
      <div className="topbar">
        <h1>Scheduler Dashboard</h1>
        <div>
          <span className="user-label">{user?.email}</span>
          <button className="secondary" onClick={logout}>Logout</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <PostForm onSubmit={handleSubmit} editingPost={editingPost} cancelEdit={() => setEditingPost(null)} />
      <PostList posts={posts} onEdit={setEditingPost} onDelete={handleDelete} />
    </div>
  );
}

export default DashboardPage;
