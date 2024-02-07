import { Module } from '@nestjs/common';
import { OtpModule } from '../otp/otp.module';
import { JwtService } from '../services/jwt.service';
import { UserModule } from '../user/user.module';
import { AuthResolver } from './graphql/auth.resolver';
import { AuthService } from './services/auth.service';

@Module({
  imports: [UserModule, OtpModule],
  providers: [AuthService, JwtService, AuthResolver],
  exports: [AuthService]
})
export class AuthModule {}
