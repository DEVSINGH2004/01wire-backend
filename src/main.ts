import * as dotenv from 'dotenv-flow';
import { join } from 'path';
dotenv.config({ silent: true, path: join(`${__dirname}/../`) });

if (process.env.SECRETS && process.env.SECRETS.length) {
  Object.assign(process.env, {
    ...process.env,
    ...JSON.parse(process.env.SECRETS)
  });
}

import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/allexception.filter';
import Logger from './common/logger';
import { ConsoleTransport } from './common/logger/transports';
import _config from './config';
import { JwtAuthGuard } from './core/auth/guard/auth.guard';
import { JwtService } from './core/services/jwt.service';

async function bootstrap() {
  const cfg = _config(process.env);
  const logger = Logger.initWinston({
    transports: [ConsoleTransport(cfg.app.appName)]
  });

  const app = await NestFactory.create(AppModule, {
    logger
  });
  app.enableCors();
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(HttpAdapterHost).httpAdapter)
  );
  app.useGlobalGuards(
    new JwtAuthGuard(app.get(Reflector), app.get(JwtService))
  );
  
  await app.listen(cfg.app.port);
  logger.log(`${cfg.app.appName} listening on port : ${await app.getUrl()}`);
}
bootstrap();
