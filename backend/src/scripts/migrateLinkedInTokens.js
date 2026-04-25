require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const LinkedInAccount = require("../models/LinkedInAccount");
const { encryptToken, decryptToken, getActiveKeyId } = require("../services/tokenCryptoService");

const migrate = async () => {
  await connectDB();

  const activeKeyId = getActiveKeyId();
  const accounts = await LinkedInAccount.find({});

  let migratedPlainAccess = 0;
  let rotatedAccess = 0;
  let rotatedRefresh = 0;
  let skipped = 0;
  let failed = 0;

  for (const account of accounts) {
    try {
      let changed = false;

      if (account.accessToken && !account.accessTokenEncrypted) {
        const encrypted = encryptToken(account.accessToken);
        account.accessTokenEncrypted = encrypted.encryptedValue;
        account.accessTokenKeyId = encrypted.keyId;
        account.accessToken = null;
        migratedPlainAccess += 1;
        changed = true;
      }

      if (account.accessTokenEncrypted && account.accessTokenKeyId !== activeKeyId) {
        const plain = decryptToken(account.accessTokenEncrypted);
        const encrypted = encryptToken(plain);
        account.accessTokenEncrypted = encrypted.encryptedValue;
        account.accessTokenKeyId = encrypted.keyId;
        rotatedAccess += 1;
        changed = true;
      }

      if (account.refreshTokenEncrypted && account.refreshTokenKeyId !== activeKeyId) {
        const plain = decryptToken(account.refreshTokenEncrypted);
        const encrypted = encryptToken(plain);
        account.refreshTokenEncrypted = encrypted.encryptedValue;
        account.refreshTokenKeyId = encrypted.keyId;
        rotatedRefresh += 1;
        changed = true;
      }

      if (changed) {
        await account.save();
      } else {
        skipped += 1;
      }
    } catch (error) {
      failed += 1;
      console.error(`Failed to migrate account ${account._id}: ${error.message}`);
    }
  }

  console.log("LinkedIn token migration complete");
  console.log(`Accounts scanned: ${accounts.length}`);
  console.log(`Plain access tokens migrated: ${migratedPlainAccess}`);
  console.log(`Access tokens rotated: ${rotatedAccess}`);
  console.log(`Refresh tokens rotated: ${rotatedRefresh}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);

  await mongoose.connection.close();
};

migrate().catch(async (error) => {
  console.error("Migration failed:", error.message);
  await mongoose.connection.close();
  process.exit(1);
});
