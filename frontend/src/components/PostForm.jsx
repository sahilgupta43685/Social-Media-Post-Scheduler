import { useEffect, useState } from "react";

const initialForm = {
  content: "",
  platform: "X",
  scheduledTime: ""
};

const toDateTimeLocal = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

function PostForm({ onSubmit, editingPost, cancelEdit }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (editingPost) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        content: editingPost.content,
        platform: editingPost.platform,
        scheduledTime: toDateTimeLocal(editingPost.scheduledTime)
      });
    } else {
      setForm(initialForm);
    }
  }, [editingPost]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert local datetime input to ISO for backend storage
    const payload = {
      ...form,
      scheduledTime: new Date(form.scheduledTime).toISOString()
    };

    onSubmit(payload);

    if (!editingPost) {
      setForm(initialForm);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>{editingPost ? "Edit Scheduled Post" : "Schedule New Post"}</h2>

      <label>Content</label>
      <textarea
        name="content"
        value={form.content}
        onChange={handleChange}
        rows="4"
        placeholder="Write your post..."
        required
      />

      <label>Platform</label>
      <select name="platform" value={form.platform} onChange={handleChange} required>
        <option value="Instagram">Instagram</option>
        <option value="LinkedIn">LinkedIn</option>
        <option value="Facebook">Facebook</option>
        <option value="X">X</option>
      </select>

      <label>Scheduled Time</label>
      <input
        type="datetime-local"
        name="scheduledTime"
        value={form.scheduledTime}
        onChange={handleChange}
        required
      />

      <div className="row">
        <button type="submit">{editingPost ? "Update Post" : "Create Post"}</button>
        {editingPost && (
          <button type="button" className="secondary" onClick={cancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default PostForm;
