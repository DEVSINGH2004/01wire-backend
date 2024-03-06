import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { LoggerMiddleware } from './common/logger/middleware';
import { UserModule } from './core/user/user.module';
import { OtpModule } from './core/otp/otp.module';
import { AuthModule } from './core/auth/auth.module';
import { EmailService } from './core/services/email.service';
import { JwtService } from './core/services/jwt.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SseModule } from './core/sse/sse.module';
import { SlackService } from './core/services/slack.service';
import { EventModule } from './core/events/event.module';
import { ArticleModule } from './core/article/article.module';
import { OrderModule } from './core/order/order.module';
import { BundleModule } from './core/bundle/bundle.module';
import { WalletModule } from './core/wallet/wallet.module';
import { ClientModule } from './core/client/client.module';
import { TransactionModule } from './core/transaction/transaction.module';
import { PublicationModule } from './core/publication/publication.module';
import { CouponModule } from './core/coupon/coupon.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false
    }),
    CommonModule,
    HealthModule,
    AuthModule,
    UserModule,
    OtpModule,
    SseModule,
    EventModule,
    ArticleModule,
    OrderModule,
    PublicationModule,
    BundleModule,
    WalletModule,
    ClientModule,
    TransactionModule,
    CouponModule,
  ],
  controllers: [AppController],
  providers: [AppService, EmailService, JwtService, SlackService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
