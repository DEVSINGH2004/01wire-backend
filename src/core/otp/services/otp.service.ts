import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Otp, OtpTypeWithoutDocument } from '../otp.schema';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as assert from 'assert';
import { UserService } from '../../user/services/user.service';
import { generate as GenerateOtp } from 'otp-generator';
import { EmailService } from '../../services/email.service';
import { JwtService } from '../../services/jwt.service';
import { OtpTypeEnum } from '../enum/otp.type.enum';
import { OtpStatusEnum } from '../enum/otp.status.enum';
import { OtpVerifyDto } from '../dto/otp.verify.dto';
import { validate } from 'nestjs-zod';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { AuthStatusEnum } from 'src/core/auth/enum/auth.status.enum';

@Injectable()
export class OtpService {
  private _expireInMs: number;
  private _maxAttempts: number;

  constructor(
    @InjectModel(Otp.name)
    protected model: Model<Otp>,
    configService: ConfigService,
    private userService: UserService,
    private emailService: EmailService,
    private jwtService: JwtService
  ) {
    this._expireInMs = configService.get('otp.expireInMs');
    this._maxAttempts = configService.get('otp.maxAttempts');
  }

  async sendVerificationOtp(userId: string, expireInMs?: number) {
    const userObj = await this.userService.load(userId);
    assert(userObj, new BadRequestException('user not found'));
    return this.sendOtp(userId, userObj.email, OtpTypeEnum.EMAIL, expireInMs);
  }

  async sendOtp(
    userId: string,
    receiver: string,
    type: OtpTypeEnum,
    expireInMs?: number
  ): Promise<OtpTypeWithoutDocument> {
    const now = new Date();
    let otpObj = await this.model
      .findOne({
        userId,
        type,
        receiver,
        status: OtpStatusEnum.PENDING,
        expireAt: { $gte: now }
      })
      .lean();

    if (otpObj) return otpObj;
    const otp = GenerateOtp(4, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false
    });

    otpObj = await this.model.create({
      userId,
      otp,
      receiver,
      type,
      expireAt: new Date(now.getTime() + (expireInMs || this._expireInMs))
    });

    await this.emailService.sendVerificationOtp({
      receiver,
      otp,
      validity: otpObj.expireAt
    });

    return otpObj.toObject();
  }

  async verifyOtp(dto: OtpVerifyDto): Promise<{
    type: UserTypeEnum;
    token: string;
  }> {
    const { token: _id, otp } = validate(dto, OtpVerifyDto);
    const now = new Date();
    let otpObj = await this.model.findOne({
      _id,
      status: OtpStatusEnum.PENDING
    });
    if (!otpObj) throw new BadRequestException('otp invalid');
    if (now > new Date(otpObj.expireAt)) {
      otpObj.status = OtpStatusEnum.EXPIRED;
      await otpObj.save();
      throw new BadRequestException('otp expired : max time limit reached');
    }
    if (otpObj.otp !== otp.trim()) {
      otpObj.attempts += 1;
      if (otpObj.attempts >= this._maxAttempts) {
        otpObj.status = OtpStatusEnum.BLOCKED;
        await otpObj.save();
        throw new BadRequestException('otp blocked : max retry limit reached');
      } else {
        await otpObj.save();
        throw new BadRequestException('otp invalid');
      }
    }
    otpObj.status = OtpStatusEnum.VERIFIED;
    otpObj.verifiedAt = new Date();
    otpObj = await otpObj.save();
    const userObj = await this.userService.load(otpObj.userId);
    let token: string = null;
    if (otpObj.type === OtpTypeEnum.EMAIL) {
      if (userObj.isEmailVerified === false) {
        await this.userService.setEmailVerifiedByUserId(
          otpObj.userId,
          otpObj.receiver
        );
      }
      token = this.jwtService.signToken({
        userType: userObj.type,
        userId: userObj._id
      });
    }
    return { type: userObj.type, token };
  }
}
