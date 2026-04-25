const { Worker } = require("bullmq");
const redisConnection = require("../config/redis");
const Post = require("../models/Post");
const { publishPost } = require("../services/publisherService");

const postWorker = new Worker(
  "post-publish-queue",
  async (job) => {
    const { postId } = job.data;
    const post = await Post.findById(postId);

    if (!post) return;
    if (post.status === "posted") return;

    post.publishAttempts += 1;
    post.failureReason = null;
    await post.save();

    const result = await publishPost(post);

    post.status = "posted";
    post.publishedAt = new Date();
    post.queueJobId = null;
    post.failureReason = null;
    post.providerMeta = {
      mode: result.mode || "unknown",
      externalPostId: result.externalPostId || null,
      rawResponse: result.rawResponse || null
    };

    await post.save();
  },
  {
    connection: redisConnection,
    concurrency: 5
  }
);

postWorker.on("completed", (job) => {
  console.log(`Job completed: ${job.id}`);
});

postWorker.on("failed", (job, err) => {
  console.error(`Job failed: ${job?.id} - ${err.message}`);

  if (job && job.attemptsMade >= job.opts.attempts) {
    Post.findByIdAndUpdate(job.data.postId, {
      status: "failed",
      queueJobId: null,
      failureReason: err.message
    }).catch((dbError) => {
      console.error("Failed to mark post as failed:", dbError.message);
    });
  }
});

module.exports = postWorker;
