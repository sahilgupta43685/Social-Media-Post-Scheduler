const Post = require("../models/Post");
const { addPostPublishJob, removePostPublishJob } = require("../queues/postQueue");

const getPlannedProviderMode = (platform) => {
  const publishMode = (process.env.PUBLISH_MODE || "simulation").toLowerCase();

  if (publishMode === "real") {
    if (platform === "LinkedIn") return "real-linkedin";
    if (platform === "X") return "real-x";
    if (platform === "Facebook") return "real-facebook";
    if (platform === "Instagram") return "real-instagram";
  }

  if (publishMode === "webhook") {
    return "webhook";
  }

  return "simulation";
};

const createPost = async (req, res) => {
  try {
    const { content, platform, scheduledTime } = req.body;

    if (!content || !platform || !scheduledTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const post = await Post.create({
      user: req.user.id,
      content,
      platform,
      scheduledTime: new Date(scheduledTime),
      providerMeta: {
        mode: getPlannedProviderMode(platform),
        externalPostId: null,
        rawResponse: null
      }
    });

    const job = await addPostPublishJob({
      postId: post._id.toString(),
      scheduledTime: post.scheduledTime
    });

    post.queueJobId = job.id.toString();
    await post.save();

    return res.status(201).json(post);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const allowedStatuses = ["pending", "posted", "failed"];
    const { status } = req.query;

    const filter = { user: req.user.id };
    if (status && allowedStatuses.includes(status)) {
      filter.status = status;
    }

    const posts = await Post.find(filter).sort({ scheduledTime: 1 });

    const normalizedPosts = posts.map((post) => {
      const normalized = post.toObject();

      if (normalized.status === "pending") {
        normalized.providerMeta = normalized.providerMeta || {};

        if (!normalized.providerMeta.externalPostId) {
          normalized.providerMeta.mode = getPlannedProviderMode(normalized.platform);
        }
      }

      return normalized;
    });

    return res.status(200).json(normalizedPosts);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, platform, scheduledTime } = req.body;

    const post = await Post.findOne({ _id: id, user: req.user.id });
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.status === "posted") {
      return res.status(400).json({ message: "Posted items cannot be edited" });
    }

    if (post.queueJobId) {
      await removePostPublishJob(post.queueJobId);
    }

    post.content = content ?? post.content;
    post.platform = platform ?? post.platform;
    post.scheduledTime = scheduledTime ? new Date(scheduledTime) : post.scheduledTime;
    post.status = "pending";
    post.failureReason = null;
    post.publishedAt = null;
    post.providerMeta = {
      mode: getPlannedProviderMode(post.platform),
      externalPostId: null,
      rawResponse: null
    };

    const job = await addPostPublishJob({
      postId: post._id.toString(),
      scheduledTime: post.scheduledTime
    });

    post.queueJobId = job.id.toString();
    const updated = await post.save();

    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findOne({ _id: id, user: req.user.id });
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.queueJobId) {
      await removePostPublishJob(post.queueJobId);
    }

    await post.deleteOne();
    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const retryPost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findOne({ _id: id, user: req.user.id });
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.status === "posted") {
      return res.status(400).json({ message: "Posted items cannot be retried" });
    }

    if (post.queueJobId) {
      await removePostPublishJob(post.queueJobId);
    }

    post.status = "pending";
    post.failureReason = null;
    post.publishedAt = null;
    post.scheduledTime = new Date();
    post.providerMeta = {
      mode: getPlannedProviderMode(post.platform),
      externalPostId: null,
      rawResponse: null
    };

    const job = await addPostPublishJob({
      postId: post._id.toString(),
      scheduledTime: post.scheduledTime
    });

    post.queueJobId = job.id.toString();
    await post.save();

    return res.status(200).json(post);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  updatePost,
  deletePost,
  retryPost
};
