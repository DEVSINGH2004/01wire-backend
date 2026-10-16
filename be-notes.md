# Backend Terminal Investigation Notes

## Project
- **Name:** o1wire (`01wire-be`)
- **Type:** NestJS backend (TypeScript)
- **Node:** v22.22.2
- **npm:** 10.9.7
- **Working dir:** `C:\shreyians\side quests\01-wire\01wire-be`

## Investigation
Attempted to start the backend with `npm run start:dev` (`nest start --watch`) and captured the terminal output.

## Result
- **TypeScript compilation:** PASSED — `Found 0 errors. Watching for file changes.`
- **App startup:** FAILED — crashes immediately at runtime before listening on any port.
- **Status:** SOLVED — resolved by setting `SLACK_WEBHOOK_URL` to a valid URL.

## Error Captured (terminal output)
```
C:\shreyians\side quests\01-wire\01wire-be\node_modules\zod\lib\types.js:55
                const error = new ZodError_1.ZodError(ctx.common.issues);
                              ^
ZodError: [
  {
    "expected": "'local' | 'dev' | 'staging' | 'testnet' | 'production'",
    "received": "undefined",
    "path": ["NODE_ENV"],
    "message": "Required"
  },
  {
    "code": "invalid_type",
    "expected": "string",
    "received": "undefined",
    "path": ["AUTH_JWT_SECRET"],
    "message": "Required"
  },
  { "code": "invalid_type", "expected": "string", "received": "undefined", "path": ["MONGO_URI"], "message": "Required" },
  { "code": "invalid_type", "expected": "string", "received": "undefined", "path": ["MONGO_DB_NAME"], "message": "Required" },
  { "code": "invalid_type", "expected": "string", "received": "undefined", "path": ["UPLOAD_DIR"], "message": "Required" },
  { "code": "invalid_type", "expected": "string", "received": "undefined", "path": ["REDIS_URI"], "message": "Required" },
  { "code": "invalid_type", "expected": "string", "received": "undefined", "path": ["AWS_REGION"], "message": "Required" },
  { "code": "invalid_type", "expected": "string", "received": "undefined", "path": ["AWS_SES_SENDER_EMAIL"], "message": "Required" },
  { "code": "invalid_type", "expected": "string", "received": "undefined", "path": ["SLACK_WEBHOOK_URL"], "message": "Required" },
  { "code": "invalid_type", "expected": "string", "received": "undefined", "path": ["COPPERX_SECRET_KEY"], "message": "Required" },
  { "code": "invalid_type", "expected": "string", "received": "undefined", "path": ["COPPERX_WEBHOOK_SECRET_KEY"], "message": "Required" }
]
```

## Root Cause
The backend validates all environment variables at startup using a Zod schema (`ConfigValidationSchema.parse(config)`), triggered through `ConfigModule.forRoot({ validate: config })` in `src/common/config/config.module.ts:7`, during `bootstrap()` in `src/main.ts`.

The schema marks these variables as **required**, but they are `undefined` because they are not set in the environment. The current `.env` only contains:

```
PORT=7788
REDIS_DB=1
```

The app fails validation with **11 missing/invalid environment variables** and exits before starting the server.

## Missing Required Environment Variables
| Variable | Expected | Current Value |
|----------|----------|---------------|
| NODE_ENV | `'local' \| 'dev' \| 'staging' \| 'testnet' \| 'production'` | undefined |
| AUTH_JWT_SECRET | string | undefined |
| MONGO_URI | string | undefined |
| MONGO_DB_NAME | string | undefined |
| UPLOAD_DIR | string | undefined |
| REDIS_URI | string | undefined |
| AWS_REGION | string | undefined |
| AWS_SES_SENDER_EMAIL | string | undefined |
| SLACK_WEBHOOK_URL | string | undefined |
| COPPERX_SECRET_KEY | string | undefined |
| COPPERX_WEBHOOK_SECRET_KEY | string | undefined |

## Key Files Involved
- `src/main.ts` — bootstrap entry point; loads env via `dotenv-flow` and calls `config(process.env)`
- `src/config/index.ts` — `config()` function calls `ConfigValidationSchema.parse(config)` at line 4
- `src/config/config.validation.ts` — defines the Zod validation schema (source of required fields)
- `src/common/config/config.module.ts` — registers `ConfigModule.forRoot({ validate: config })`
- `.env` — currently only has `PORT` and `REDIS_DB`

## Conclusion
The terminal crash is an environment/configuration issue, not a code bug. The compiled app is healthy, but startup fails because required env vars are missing or invalid. Values must be supplied for the required variables above before the backend will run.

## Resolution (SLACK_WEBHOOK_URL)
The specific `SLACK_WEBHOOK_URL` error was:

```
ZodError: [
  {
    "validation": "url",
    "code": "invalid_string",
    "message": "Invalid url",
    "path": ["SLACK_WEBHOOK_URL"]
  }
]
```

**Cause:** `SLACK_WEBHOOK_URL` was set to a value that did not pass Zod's `.url()` string validation (not a properly formatted URL).

**Resolution:** Set `SLACK_WEBHOOK_URL` to a valid URL format:

```
SLACK_WEBHOOK_URL=https://example.com/slack-webhook
```

The Zod schema in `src/config/config.validation.ts` validates `SLACK_WEBHOOK_URL` as a required URL string, so the value must be a well-formed URL (e.g., starting with `https://`) for the app to pass startup validation and boot successfully.
