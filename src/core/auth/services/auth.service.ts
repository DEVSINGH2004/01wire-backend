import { BadRequestException, Injectable } from '@nestjs/common';
import * as assert from 'assert';
import * as NodeCache from 'node-cache';
import { UserLoginDto } from 'src/core/user/dto/user.login.dto';
import { UserSignupDto } from 'src/core/user/dto/user.signup.dto';
import { OtpTypeEnum } from '../../otp/enum/otp.type.enum';
import { OtpService } from '../../otp/services/otp.service';
import { JwtService } from '../../services/jwt.service';
import { UserService } from '../../user/services/user.service';
import { AuthStatusEnum } from '../enum/auth.status.enum';

@Injectable()
export class AuthService {
  private _oauthClientCache: NodeCache;
  constructor(
    private otpService: OtpService,
    private jwtService: JwtService,
    private userService: UserService
  ) {
    this._oauthClientCache = new NodeCache({
      stdTTL: 2 * 24 * 60 * 60,
      checkperiod: 2 * 24 * 60 * 60,
      useClones: false
    });
  }

  async getAuthStatus(email: string) {
    let status: AuthStatusEnum = AuthStatusEnum.NOT_FOUND;
    let token: string = null;
    let expireAt: Date = null;
    const user = await this.userService.getUserByEmail(email);
    if (!user) return { status, token };
    if (user.isEmailVerified === false) {
      const otpObj = await this.otpService.sendOtp(
        user._id,
        user.email,
        OtpTypeEnum.EMAIL
      );
      status = AuthStatusEnum.EMAIL_NOT_VERIFIED;
      token = otpObj._id;
      expireAt = otpObj.expireAt;
    } else {
      status = AuthStatusEnum.EMAIL_VERIFIED;
    }
    return { status, token, expireAt };
  }

  async login(
    userLoginDto: UserLoginDto
  ): Promise<{ status: AuthStatusEnum; token: string; expireAt: Date }> {
    const user = await this.userService.validateCredentials(userLoginDto);
    let token: string = null;
    let expireAt: Date = null;
    let status: AuthStatusEnum = null;
    if (user.isEmailVerified === false) {
      const otpObj = await this.otpService.sendVerificationOtp(user._id);
      token = otpObj._id;
      expireAt = otpObj.expireAt;
      status = AuthStatusEnum.EMAIL_NOT_VERIFIED;
    } else {
      token = this.jwtService.signToken({
        userType: user.type,
        userId: user._id
      });
      status = AuthStatusEnum.LOGGED_IN;
    }
    return { status, token, expireAt };
  }

  async loginViaOtp(email: string): Promise<{ token: string; expireAt: Date }> {
    const user = await this.userService.getUserByEmail(email);
    assert(user, new BadRequestException('User not found'));
    const otpObj = await this.otpService.sendVerificationOtp(user._id);
    const token = otpObj._id;
    return { token, expireAt: otpObj.expireAt };
  }

  async signup(userSignupDto: UserSignupDto) {
    const user = await this.userService.createUser(userSignupDto);
    const otpObj = await this.otpService.sendVerificationOtp(user._id);
    const token = otpObj._id;
    const status = AuthStatusEnum.EMAIL_NOT_VERIFIED;
    return { status, token };
  }
}
