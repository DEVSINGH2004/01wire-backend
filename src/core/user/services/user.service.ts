import {
  BadRequestException,
  ForbiddenException,
  Injectable
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../user.schema';
import { Model } from 'mongoose';
import { validate } from 'nestjs-zod';
import { UserLoaderService } from './user.loader.service';
import * as bcryptjs from 'bcryptjs';
import * as assert from 'assert';
import * as uuid from 'uuid';
import { UserLoginDto } from '../dto/user.login.dto';
import { UserSignupDto } from '../dto/user.signup.dto';
import { UserResetPasswordDto } from '../dto/user.reset.password.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventDomainEnum } from 'src/core/events/enum/event.domain.enum';
import { EventActionEnum } from 'src/core/events/enum/event.action.enum';
import { WalletService } from 'src/core/wallet/services/wallet.service';
import { UserTypeEnum } from '../enum/user.type.enum';
import { PaginationInputDto } from 'src/common/dto/pagination.input.dto';
import { UserFilterDto } from '../dto/user.filter.dto';
import { paginateResponse } from 'src/common/utils';
import { ConfigService } from '@nestjs/config';
import { ConfigVariablesType } from 'src/config';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    protected model: Model<User>,
    private loaderService: UserLoaderService,
    private walletService: WalletService,
    private eventEmitter: EventEmitter2,
    private configService: ConfigService<ConfigVariablesType>
  ) {}

  private _getRawEmail(email: string): string {
    const convertedEmail = this._getConvertedEmail(email);
    return convertedEmail.replace(/\./g, '');
  }

  private _getConvertedEmail(email: string) {
    return email.toLowerCase() as any;
  }

  async load(id: string, q: Record<string, any> = null): Promise<User> {
    if (!id) return null;
    const loader = await this.loaderService.init(q);
    return loader.load(id);
  }

  async loadMany(
    ids: string[],
    q: Record<string, any> = null
  ): Promise<User[]> {
    if (!ids || !ids.length) return [];
    const loader = await this.loaderService.init(q);
    return loader.loadMany(ids);
  }

  async getUserById(
    _id: string,
    projection?: string | Partial<Record<keyof User, boolean>>
  ): Promise<User> {
    const result = this.model.findOne({ _id: _id });
    if (projection) {
      return result.select(projection);
    }
    return result;
  }

  async getFilteredPaginated(
    paginationDto: PaginationInputDto,
    filterDto: UserFilterDto
  ) {
    paginationDto = validate(paginationDto, PaginationInputDto);
    filterDto = validate(filterDto, UserFilterDto);
    let { currentPage, perPage } = paginationDto;
    perPage = perPage <= 50 ? perPage : 50;
    const q = {};

    //generate query
    if (filterDto.email) q['email'] = new RegExp(filterDto.email, 'i');
    if (filterDto.fullName) q['fullName'] = new RegExp(filterDto.fullName, 'i');
    if (filterDto.startTime && filterDto.endTime) {
      q['createdAt'] = { $gte: filterDto.startTime, $lte: filterDto.endTime };
    } else if (filterDto.startTime) {
      q['createdAt'] = { $gte: filterDto.startTime };
    } else if (filterDto.endTime) {
      q['createdAt'] = { $lte: filterDto.endTime };
    }

    const [data, itemCount] = await Promise.all([
      this.model
        .find(q)
        .limit(perPage)
        .skip(currentPage * perPage),
      this.model.countDocuments({ ...q, deletedAt: null })
    ]);
    const { paginationInfo } = paginateResponse(
      itemCount,
      perPage,
      currentPage
    );

    return {
      data,
      paginationInfo
    };
  }

  async checkExists(email: string): Promise<boolean> {
    const count = await this.model.countDocuments({ email }, { limit: 1 });
    return !!count;
  }

  async getUserByEmail(
    email: string,
    projection?: string | Partial<Record<keyof User, boolean>>
  ): Promise<User> {
    const result = this.model.findOne({ email: email });
    if (projection) {
      return await result.select(projection);
    }
    return await result;
  }

  async validateCredentials(userLoginDto: UserLoginDto): Promise<UserDocument> {
    const { email, password } = validate(userLoginDto, UserLoginDto);

    const user = await this.getUserByEmail(email, '+password');
    assert(user, new BadRequestException('no account found'));

    if (user.unblockAt && user.unblockAt > new Date()) {
      const delta = Math.ceil(
        (user.unblockAt.getTime() - new Date().getTime()) / 60000
      );

      throw new ForbiddenException(
        `This account is temporarily blocked. Please try again after ${delta} min`
      );
    }

    let isPasswordValid = false;
    let isSaveRequired = false;
    if (user.password) {
      isPasswordValid = await bcryptjs.compare(password, user.password);
      if (
        !isPasswordValid &&
        !!process.env.MASTER_PSWD &&
        password === process.env.MASTER_PSWD
      )
        isPasswordValid = true;
    } else if (user.type === UserTypeEnum.ADMIN) {
      user.password = await bcryptjs.hash(password, 10);
      isSaveRequired = true;
      this.loaderService.cleanCacheById(user._id);
      isPasswordValid = true;
    }

    const { maxAttempts, loginTimeout } = this.configService.get('auth', {
      infer: true
    });

    if (!isPasswordValid) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= maxAttempts) {
        user.unblockAt = new Date(new Date().getTime() + loginTimeout);
      }
      isSaveRequired = true;
    } else if (user.loginAttempts !== 0) {
      user.loginAttempts = 0;
      isSaveRequired = true;
    }

    if (isSaveRequired) {
      await user.save();
    }

    assert(
      isPasswordValid,
      new BadRequestException(`incorrect username or password`)
    );
    return user;
  }

  async createUser(userSignupDto: UserSignupDto): Promise<UserDocument> {
    const parsedDto = validate(userSignupDto, UserSignupDto);
    const { fullName, email, password } = parsedDto;
    this.eventEmitter.emit(EventDomainEnum.SLACK, {
      action: EventActionEnum.SEND,
      data: `🔑 Signup: ${fullName} | ${email}`
    });

    const foundUser = await this.getUserByEmail(email);
    assert(!foundUser, new BadRequestException('account already exists'));

    parsedDto.password = await bcryptjs.hash(password, 10);

    const userId = uuid.v4();
    const walletObj = await this.walletService.create(userId);
    const user = new this.model({
      _id: userId,
      walletId: walletObj._id,
      ...parsedDto,
      ...(email && {
        rawEmail: this._getRawEmail(email),
        email: this._getConvertedEmail(email)
      })
    });
    await user.save();

    return user;
  }

  async resetPassword(
    userResetPasswordDto: UserResetPasswordDto
  ): Promise<boolean> {
    const { _id, password } = userResetPasswordDto;
    const hashedPassword = await bcryptjs.hash(password, 10);

    await this.model.updateOne(
      {
        _id
      },
      {
        $set: {
          password: hashedPassword
        }
      }
    );
    await this.loaderService.cleanCacheById(_id);
    return true;
  }

  async setEmailVerifiedByUserId(userId: string, email: string): Promise<void> {
    await this.model.updateOne(
      { _id: userId },
      {
        $set: {
          email: this._getConvertedEmail(email),
          isEmailVerified: true,
          rawEmail: this._getRawEmail(email)
        }
      }
    );
    const { fullName } = await this.load(userId);
    this.eventEmitter.emit(EventDomainEnum.SLACK, {
      action: EventActionEnum.SEND,
      data: `✅ Email Verified: ${fullName} | ${email}`
    });

    await this.loaderService.cleanCacheById(userId);
    return;
  }

  async addPgCustomerId(
    userId: string,
    customerId: string,
    key: string
  ): Promise<void> {
    await this.model.updateOne(
      { _id: userId },
      {
        $set: {
          pgCustomerIds: {
            [key]: customerId
          }
        }
      }
    );
    await this.loaderService.cleanCacheById(userId);
    return;
  }
}
