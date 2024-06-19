import { SetMetadata } from '@nestjs/common';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';

export const Auth = (userType: UserTypeEnum) =>
  SetMetadata('userType', userType);
