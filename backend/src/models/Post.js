const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    platform: {
      type: String,
      required: true,
      enum: ["Instagram", "LinkedIn", "Facebook", "X"]
    },
    scheduledTime: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "posted", "failed"],
      default: "pending"
    },
    publishAttempts: {
      type: Number,
      default: 0
    },
    failureReason: {
      type: String,
      default: null
    },
    queueJobId: {
      type: String,
      default: null
    },
    publishedAt: {
      type: Date,
      default: null
    },
    providerMeta: {
      mode: { type: String, default: "simulation" },
      externalPostId: { type: String, default: null },
      rawResponse: { type: String, default: null }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
