import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailService } from '../services/email.service';
import { JwtService } from '../services/jwt.service';
import { UserModule } from '../user/user.module';
import { OtpResolver } from './graphql/otp.resolver';
import { Otp, OtpSchema } from './otp.schema';
import { OtpService } from './services/otp.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }]),
    UserModule
  ],
  providers: [OtpService, EmailService, JwtService, OtpResolver],
  exports: [OtpService]
})
export class OtpModule {}
