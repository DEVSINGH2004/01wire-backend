import { ConfigValidationSchema } from './config.validation';

const config = (config: Record<string, unknown>) => {
  const ENVS = ConfigValidationSchema.parse(config);
  const APP_NAME = '01wire';
  const NODE_ENV = ENVS.NODE_ENV;
  const PORT = ENVS.PORT;

  return {
    app: {
      appName: APP_NAME,
      env: NODE_ENV,
      port: PORT
    },
    events: {
      'slack.msg': NODE_ENV === 'local' ? false : true
    },
    slack: {
      webhookUrl: ENVS.SLACK_WEBHOOK_URL
    },
    auth: {
      jwtSecret: ENVS.AUTH_JWT_SECRET,
      masterPassword: ENVS.MASTER_PSWD
    },
    otp: {
      expireInMs: 600000, //10 min
      maxAttempts: 3
    },
    db: {
      mongo: {
        uri: ENVS.MONGO_URI,
        dbName: ENVS.MONGO_DB_NAME
      },
      redis: {
        url: ENVS.REDIS_URI,
        database: ENVS.REDIS_DB
      }
    },
    aws: {
      region: ENVS.AWS_REGION,
      ses: {
        senderEmail: process.env.AWS_SES_SENDER_EMAIL
      }
    },
    cache: {
      user: {
        key: `user_${NODE_ENV}`,
        ttl: 300
      },
      article: {
        key: `article_${NODE_ENV}`,
        ttl: 300
      }
    },
    // TODO: Fill this
    allowedOperations: [
      '__schema',
      'login',
      'loginViaOtp',
      'signup',
      'getAuthStatus',
      'verifyOtp'
    ] as string[]
  } as const;
};

export type ConfigVariablesType = ReturnType<typeof config>;

export default config;
