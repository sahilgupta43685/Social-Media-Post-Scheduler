const { Queue } = require("bullmq");
const redisConnection = require("../config/redis");

const postQueue = new Queue("post-publish-queue", {
  connection: redisConnection
});

const addPostPublishJob = async ({ postId, scheduledTime }) => {
  const delay = Math.max(new Date(scheduledTime).getTime() - Date.now(), 0);

  const job = await postQueue.add(
    "publish-post",
    { postId },
    {
      jobId: postId,
      delay,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000
      },
      removeOnComplete: true,
      removeOnFail: false
    }
  );

  return job;
};

const removePostPublishJob = async (jobId) => {
  const job = await postQueue.getJob(jobId);
  if (job) {
    await job.remove();
  }
};

module.exports = {
  addPostPublishJob,
  removePostPublishJob
};
