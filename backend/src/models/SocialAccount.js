const mongoose = require("mongoose");

const socialAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    provider: {
      type: String,
      enum: ["X", "Facebook", "Instagram"],
      required: true
    },
    providerAccountId: {
      type: String,
      required: true
    },
    displayName: {
      type: String,
      default: null
    },
    accessTokenEncrypted: {
      type: String,
      required: true
    },
    accessTokenKeyId: {
      type: String,
      default: null
    },
    refreshTokenEncrypted: {
      type: String,
      default: null
    },
    refreshTokenKeyId: {
      type: String,
      default: null
    },
    scope: {
      type: String,
      default: ""
    },
    expiresAt: {
      type: Date,
      default: null
    },
    refreshTokenExpiresAt: {
      type: Date,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    needsReconnect: {
      type: Boolean,
      default: false
    },
    lastRefreshAt: {
      type: Date,
      default: null
    },
    lastPublishAt: {
      type: Date,
      default: null
    },
    lastPublishError: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

socialAccountSchema.index({ user: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model("SocialAccount", socialAccountSchema);
