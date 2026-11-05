// Emitted after a PR moves from DRAFT to SUBMITTED (paid: credits are debited and orders exist).
// Payload: { articleId: string, prId: number, userId: string }
export const ARTICLE_SUBMITTED_EVENT = 'article.submitted';

// Emitted when a paid PR changes status (admin action, or the customer resubmitting after changes).
// Payload: { articleId, status, from, notes?, refund? }
//   status REVIEW | AWAITING_APPROVAL | SCHEDULED | PUBLISHED | REJECTED, or RESUBMITTED (customer sent it again)
export const PR_STATUS_CHANGED_EVENT = 'article.status.changed';

// Emitted when the admin rejects one site/package of a PR. Payload: { orderId, articleId, refund, notes }
export const SITE_REJECTED_EVENT = 'order.rejected';
