const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  getLinkedInAuthUrl,
  linkedInCallback,
  getLinkedInStatus,
  disconnectLinkedIn,
  getXAuthUrl,
  xCallback,
  getXStatus,
  disconnectX,
  getMetaAuthUrl,
  metaCallback,
  getProviderStatus,
  disconnectProvider
} = require("../controllers/integrationController");

const router = express.Router();

router.get("/linkedin/callback", linkedInCallback);
router.get("/x/callback", xCallback);
router.get("/meta/callback", metaCallback);

router.use(protect);
router.get("/linkedin/auth-url", getLinkedInAuthUrl);
router.get("/linkedin/status", getLinkedInStatus);
router.delete("/linkedin/disconnect", disconnectLinkedIn);
router.get("/x/auth-url", getXAuthUrl);
router.get("/x/status", getXStatus);
router.delete("/x/disconnect", disconnectX);
router.get("/:provider/auth-url", getMetaAuthUrl);
router.get("/:provider/status", getProviderStatus);
router.delete("/:provider/disconnect", disconnectProvider);

module.exports = router;
