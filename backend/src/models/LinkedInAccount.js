const mongoose = require("mongoose");

const linkedInAccountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    linkedinMemberId: {
      type: String,
      required: true
    },
    authorUrn: {
      type: String,
      required: true
    },
    // Legacy plain token field kept optional for backward compatibility.
    accessToken: {
      type: String,
      default: null
    },
    accessTokenEncrypted: {
      type: String,
      default: null
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
      required: true
    },
    refreshTokenExpiresAt: {
      type: Date,
      default: null
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

module.exports = mongoose.model("LinkedInAccount", linkedInAccountSchema);
