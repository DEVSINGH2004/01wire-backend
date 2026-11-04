import { z } from 'nestjs-zod/z';

export const ConfigValidationSchema = z.object({
  NODE_ENV: z.enum(['local', 'dev', 'staging', 'testnet', 'production']),
  PORT: z.coerce.number(),

  //  AUTH JWT
  AUTH_JWT_SECRET: z.string(),
  MASTER_PSWD: z.string().nullish(),

  // mongo
  MONGO_URI: z.string(),
  MONGO_DB_NAME: z.string(),

  UPLOAD_DIR: z.string(),

  //redis
  REDIS_URI: z.string(),
  REDIS_DB: z.coerce.number(),

  // aws
  AWS_REGION: z.string(),
  AWS_SES_SENDER_EMAIL: z.string(),

  //Slack
  SLACK_WEBHOOK_URL: z.string().url(),

  COPPERX_SECRET_KEY: z.string(),
  COPPERX_WEBHOOK_SECRET_KEY: z.string(),
  // Optional: force the CopperX API (e.g. https://api.copperx.dev/api/v1 for test keys
  // on a production server). Default: .dev outside production, .io in production.
  COPPERX_API_URL: z.string().url().nullish(),
  // Who may pay with Razorpay / Shopify / CopperX: comma-separated emails, or "*" for
  // everyone. Not set = nobody. Test keys / test stores only ever for listed emails.
  PAYMENT_ALLOWED_USERS: z.string().nullish(),
  // Optional: where CopperX sends the buyer back (defaults to the old app.01wire.com)
  FRONTEND_URL: z.string().url().nullish(),

  // Razorpay (optional: the Razorpay option stays hidden until these are set)
  RAZORPAY_KEY_ID: z.string().nullish(),
  RAZORPAY_KEY_SECRET: z.string().nullish(),
  RAZORPAY_WEBHOOK_SECRET: z.string().nullish(),
  // Only for local tests against a fake Razorpay; live uses the real API
  RAZORPAY_API_URL: z.string().url().nullish(),

  // Shopify checkout (optional: the Shopify option stays hidden until these are set)
  SHOPIFY_STORE_DOMAIN: z.string().nullish(),
  SHOPIFY_CLIENT_ID: z.string().nullish(),
  SHOPIFY_CLIENT_SECRET: z.string().nullish(),
  SHOPIFY_API_VERSION: z.string().nullish(),
  // Public URL Shopify posts "order paid" to; when set, the backend registers it on start
  SHOPIFY_WEBHOOK_URL: z.string().url().nullish()
});
