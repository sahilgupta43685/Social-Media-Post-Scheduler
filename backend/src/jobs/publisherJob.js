const cron = require("node-cron");
const Post = require("../models/Post");
const { simulatePublish } = require("../services/publisherService");

const startPublisherJob = () => {
  // Runs every minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // Find all pending posts that are due now or overdue
      const duePosts = await Post.find({
        status: "pending",
        scheduledTime: { $lte: now }
      });

      for (const post of duePosts) {
        await simulatePublish(post);

        post.status = "posted";
        post.publishedAt = new Date();
        await post.save();
      }

      if (duePosts.length > 0) {
        console.log(`Publisher job processed ${duePosts.length} post(s).`);
      }
    } catch (error) {
      console.error("Error in publisher cron job:", error.message);
    }
  });

  console.log("Publisher cron job started (runs every minute).");
};

module.exports = startPublisherJob;
