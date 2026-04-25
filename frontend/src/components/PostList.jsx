function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}

function PostList({ posts, onEdit, onDelete, onRetry }) {
  return (
    <div className="card">
      <h2>Scheduled Posts</h2>

      {posts.length === 0 ? (
        <p>No posts scheduled yet.</p>
      ) : (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post._id} className="post-item">
              <p><strong>Content:</strong> {post.content}</p>
              <p><strong>Platform:</strong> {post.platform}</p>
              <p><strong>Scheduled:</strong> {formatDate(post.scheduledTime)}</p>
              <p><strong>Status:</strong> {post.status}</p>
              <p><strong>Attempts:</strong> {post.publishAttempts || 0}</p>
              {post.providerMeta?.mode && <p><strong>Mode:</strong> {post.providerMeta.mode}</p>}
              {post.providerMeta?.externalPostId && (
                <p><strong>External ID:</strong> {post.providerMeta.externalPostId}</p>
              )}
              {post.failureReason && (
                <p className="error"><strong>Last Error:</strong> {post.failureReason}</p>
              )}

              <div className="row">
                <button disabled={post.status === "posted"} onClick={() => onEdit(post)}>Edit</button>
                {post.status === "failed" && (
                  <button className="warning" onClick={() => onRetry(post._id)}>Retry</button>
                )}
                <button className="danger" onClick={() => onDelete(post._id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PostList;
