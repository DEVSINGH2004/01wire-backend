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
  SLACK_WEBHOOK_URL: z.string().url()
});
