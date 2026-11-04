// Emitted after a PR moves from DRAFT to SUBMITTED (paid: credits are debited and orders exist).
// Payload: { articleId: string, prId: number, userId: string }
export const ARTICLE_SUBMITTED_EVENT = 'article.submitted';
