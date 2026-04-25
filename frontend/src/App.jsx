import { useCallback, useEffect, useMemo, useState } from "react";
import PostForm from "./components/PostForm";
import PostList from "./components/PostList";
import AuthForm from "./components/AuthForm";
import { getPosts, createPost, updatePost, deletePost, retryPost } from "./api/postsApi";
import {
  getLinkedInAuthUrl,
  getLinkedInStatus,
  disconnectLinkedIn,
  getXAuthUrl,
  getXStatus,
  disconnectX,
  getMetaAuthUrl,
  getProviderStatus,
  disconnectProvider
} from "./api/integrationApi";
import "./styles.css";

const disconnected = { connected: false, needsReconnect: false };

function ProviderCard({ title, status, onConnect, onDisconnect, accountLabel = "Account" }) {
  const providerClass = `provider-card provider-${title.toLowerCase()}`;
  return (
    <div className={`card ${providerClass}`}>
      <h2>{title} Connection</h2>
      <p>
        Status:
        {" "}
        <span className={`status-pill ${status.connected ? "status-connected" : "status-disconnected"}`}>
          {status.connected ? "Connected" : "Not connected"}
        </span>
      </p>
      {status.connected && status.needsReconnect && (
        <p className="error">{title} needs reconnect. Publishing may fail until reconnected.</p>
      )}
      {status.connected && status.displayName && <p>{accountLabel}: {status.displayName}</p>}
      {status.connected && status.authorUrn && <p>Author: {status.authorUrn}</p>}
      {status.connected && status.expiresAt && (
        <p>Access token expires: {new Date(status.expiresAt).toLocaleString()}</p>
      )}
      {status.connected && status.lastRefreshAt && (
        <p>Last refresh: {new Date(status.lastRefreshAt).toLocaleString()}</p>
      )}
      {status.connected && status.lastPublishAt && (
        <p>Last publish: {new Date(status.lastPublishAt).toLocaleString()}</p>
      )}
      {status.connected && status.lastPublishError && (
        <p className="error">Last publish error: {status.lastPublishError}</p>
      )}
      <div className="row">
        {(!status.connected || status.needsReconnect) && (
          <button onClick={onConnect}>
            {status.needsReconnect ? `Reconnect ${title}` : `Connect ${title}`}
          </button>
        )}
        {status.connected && (
          <button className="danger" onClick={onDisconnect}>
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
}

function App() {
  const [posts, setPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [linkedInStatus, setLinkedInStatus] = useState(disconnected);
  const [xStatus, setXStatus] = useState(disconnected);
  const [facebookStatus, setFacebookStatus] = useState(disconnected);
  const [instagramStatus, setInstagramStatus] = useState(disconnected);

  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const token = useMemo(() => localStorage.getItem("token"), [user]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPosts([]);
    setEditingPost(null);
    setLinkedInStatus(disconnected);
    setXStatus(disconnected);
    setFacebookStatus(disconnected);
    setInstagramStatus(disconnected);
    setStatusFilter("all");
  }, []);

  const loadIntegrationStatus = useCallback(async () => {
    if (!token) return;
    try {
      const [linkedin, x, facebook, instagram] = await Promise.all([
        getLinkedInStatus(),
        getXStatus(),
        getProviderStatus("facebook"),
        getProviderStatus("instagram")
      ]);
      setLinkedInStatus(linkedin);
      setXStatus(x);
      setFacebookStatus(facebook);
      setInstagramStatus(instagram);
    } catch {
      setLinkedInStatus(disconnected);
      setXStatus(disconnected);
      setFacebookStatus(disconnected);
      setInstagramStatus(disconnected);
    }
  }, [token]);

  const fetchPosts = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getPosts(statusFilter);
      setPosts(data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        setError(err.response?.data?.message || "Failed to fetch posts");
      }
    }
  }, [token, statusFilter, handleLogout]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts();
    loadIntegrationStatus();

    const interval = setInterval(fetchPosts, 30000);
    return () => clearInterval(interval);
  }, [token, fetchPosts, loadIntegrationStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const providerKeys = ["linkedin", "x", "facebook", "instagram", "meta"];
    const reason = params.get("reason");

    let message = "";
    for (const key of providerKeys) {
      const state = params.get(key);
      if (state === "connected") message = `${key.toUpperCase()} connected successfully.`;
      if (state === "error") message = reason ? `${key.toUpperCase()} error: ${reason}` : `${key.toUpperCase()} connection failed.`;
    }

    if (message) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (message.includes("error")) setError(message);
      else setInfo(message);
      loadIntegrationStatus();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [loadIntegrationStatus]);

  const handleSubmit = async (payload) => {
    try {
      setError("");
      setInfo("");

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
      setInfo("");
      await deletePost(id);
      await fetchPosts();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  const handleRetry = async (id) => {
    try {
      setError("");
      setInfo("");
      await retryPost(id);
      await fetchPosts();
    } catch (err) {
      setError(err.response?.data?.message || "Retry failed");
    }
  };

  const openAuth = async (authUrlFn) => {
    setError("");
    setInfo("");
    const data = await authUrlFn();
    window.location.href = data.url;
  };

  if (!token || !user) {
    return (
      <div className="container">
        <h1 className="page-title">Social Media Post Scheduler</h1>
        <AuthForm onAuthSuccess={setUser} />
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">Social Media Post Scheduler</h1>
      <p className="page-subtitle">Plan once. Publish everywhere.</p>

      <div className="topbar">
        <span className="user-label">
          Logged in as: {user.name} ({user.email})
        </span>
        <button className="secondary" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      <div className="provider-grid">
        <ProviderCard
          title="LinkedIn"
          status={linkedInStatus}
          onConnect={() => openAuth(getLinkedInAuthUrl)}
          onDisconnect={async () => {
            await disconnectLinkedIn();
            await loadIntegrationStatus();
          }}
        />

        <ProviderCard
          title="X"
          status={xStatus}
          onConnect={() => openAuth(getXAuthUrl)}
          onDisconnect={async () => {
            await disconnectX();
            await loadIntegrationStatus();
          }}
        />

        <ProviderCard
          title="Facebook"
          status={facebookStatus}
          onConnect={() => openAuth(() => getMetaAuthUrl("facebook"))}
          onDisconnect={async () => {
            await disconnectProvider("facebook");
            await loadIntegrationStatus();
          }}
          accountLabel="Page"
        />

        <ProviderCard
          title="Instagram"
          status={instagramStatus}
          onConnect={() => openAuth(() => getMetaAuthUrl("instagram"))}
          onDisconnect={async () => {
            await disconnectProvider("instagram");
            await loadIntegrationStatus();
          }}
        />
      </div>

      <div className="card">
        <h2>Filter Posts</h2>
        <div className="row">
          <button
            className={statusFilter === "all" ? "active-filter" : ""}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
          <button
            className={statusFilter === "pending" ? "active-filter" : ""}
            onClick={() => setStatusFilter("pending")}
          >
            Pending
          </button>
          <button
            className={statusFilter === "posted" ? "active-filter" : ""}
            onClick={() => setStatusFilter("posted")}
          >
            Posted
          </button>
          <button
            className={statusFilter === "failed" ? "active-filter" : ""}
            onClick={() => setStatusFilter("failed")}
          >
            Failed
          </button>
        </div>
      </div>

      <PostForm
        onSubmit={handleSubmit}
        editingPost={editingPost}
        cancelEdit={() => setEditingPost(null)}
      />

      <PostList
        posts={posts}
        onEdit={setEditingPost}
        onDelete={handleDelete}
        onRetry={handleRetry}
      />
    </div>
  );
}

export default App;
