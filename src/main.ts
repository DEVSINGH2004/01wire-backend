import * as dotenv from 'dotenv-flow';
import { join, resolve } from 'path';
dotenv.config({ silent: true, path: join(`${__dirname}/../`) });

if (process.env.SECRETS && process.env.SECRETS.length) {
  Object.assign(process.env, {
    ...process.env,
    ...JSON.parse(process.env.SECRETS)
  });
}

import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/allexception.filter';
import Logger from './common/logger';
import { ConsoleTransport } from './common/logger/transports';
import _config from './config';
import { JwtAuthGuard } from './core/auth/guard/auth.guard';
import { JwtService } from './core/services/jwt.service';
import { RolesGuard } from './core/auth/guard/role.guard';

async function bootstrap() {
  const cfg = _config(process.env);
  const logger = Logger.initWinston({
    transports: [ConsoleTransport(cfg.app.appName)]
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger
  });
  // Express defaults to 100kb, below a full-length press release (MAX_CONTENT
  // is 100k chars plus the other fields); 413s showed up on long PRs.
  app.useBodyParser('json', { limit: '2mb' });
  // Only our own frontends may call the API from a browser. Override with a
  // comma-separated CORS_ORIGINS env var (e.g. to add a Vercel preview URL).
  const corsOrigins = (
    process.env.CORS_ORIGINS ||
    [
      'https://01wire-frontend.vercel.app',
      'https://dashboard.01wire.com',
      'https://app.01wire.com',
      'http://localhost:3005'
    ].join(',')
  )
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins });
  // Serve uploaded files (POST /upload) at /public/<fileName>. The CSP sandbox
  // stops an uploaded SVG from running scripts when opened directly.
  app.useStaticAssets(resolve(cfg.file.uploadDir), {
    prefix: '/public/',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; style-src 'unsafe-inline'; sandbox"
      );
    }
  });
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(HttpAdapterHost).httpAdapter)
  );
  app.useGlobalGuards(
    new JwtAuthGuard(app.get(Reflector), app.get(JwtService))
  );
  app.useGlobalGuards(new RolesGuard(app.get(Reflector)));

  const port = Number(process.env.PORT) || cfg.app.port;

await app.listen(port, '0.0.0.0');

logger.log(
  `${cfg.app.appName} listening on port: ${await app.getUrl()}`
);
}
bootstrap();
