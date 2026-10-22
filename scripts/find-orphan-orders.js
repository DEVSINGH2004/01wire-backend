/*
 * READ-ONLY. Lists PENDING orders left behind by the old non-atomic PR submit
 * (audit finding OLD-3). Nothing is modified or deleted.
 *
 * An order is reported as orphaned when it is PENDING and either:
 *   - its article is missing, soft-deleted, or still DRAFT, or
 *   - there is no "Debited for PR ID: <prId>" DEBIT transaction for its user.
 *
 * Usage (uses MONGO_URI / MONGO_DB_NAME from .env):
 *   node scripts/find-orphan-orders.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB_NAME
  });
  const db = mongoose.connection.db;

  const orders = await db
    .collection('orders')
    .find({ status: 'PENDING', deletedAt: null })
    .toArray();

  const orphans = [];
  for (const order of orders) {
    const article = await db
      .collection('articles')
      .findOne({ _id: order.articleId });
    const debit = await db.collection('transactions').findOne({
      userId: order.userId,
      type: 'DEBIT',
      notes: `Debited for PR ID: ${order.prId}`
    });

    const reasons = [];
    if (!article) reasons.push('article missing');
    else if (article.deletedAt) reasons.push('article deleted');
    else if (article.status === 'DRAFT') reasons.push('article still DRAFT');
    if (!debit) reasons.push('no debit transaction');

    if (reasons.length) {
      orphans.push({
        orderId: order._id,
        prId: order.prId,
        articleId: order.articleId,
        userId: order.userId,
        createdAt: order.createdAt,
        reasons: reasons.join(', ')
      });
    }
  }

  console.log(`Database: ${process.env.MONGO_DB_NAME}`);
  console.log(`PENDING orders checked: ${orders.length}`);
  console.log(`Orphaned: ${orphans.length}`);
  if (orphans.length) console.table(orphans);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
