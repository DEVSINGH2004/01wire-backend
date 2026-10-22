/*
 * One-time migration for audit finding OLD-17: renames the misspelled article
 * categories COMAPNY_NAME_CHANGE / COMAPNY_NAME_UPDATE to COMPANY_NAME_*.
 * Run it right after deploying the backend that contains the renamed enum.
 * Safe to run more than once.
 *
 * Usage (uses MONGO_URI / MONGO_DB_NAME from .env):
 *   node scripts/migrate-article-category-typo.js           # dry run
 *   node scripts/migrate-article-category-typo.js --apply   # write changes
 */
require('dotenv').config();
const mongoose = require('mongoose');

const RENAMES = {
  COMAPNY_NAME_CHANGE: 'COMPANY_NAME_CHANGE',
  COMAPNY_NAME_UPDATE: 'COMPANY_NAME_UPDATE'
};

(async () => {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME
  });
  const articles = mongoose.connection.db.collection('articles');

  console.log(`Database: ${process.env.MONGO_DB_NAME}`);
  console.log(apply ? 'Mode: APPLY' : 'Mode: dry run (pass --apply to write)');
  for (const [from, to] of Object.entries(RENAMES)) {
    const count = await articles.countDocuments({ category: from });
    if (apply && count) {
      const res = await articles.updateMany(
        { category: from },
        { $set: { category: to } }
      );
      console.log(`${from} -> ${to}: ${res.modifiedCount} updated`);
    } else {
      console.log(`${from} -> ${to}: ${count} to update`);
    }
  }
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
