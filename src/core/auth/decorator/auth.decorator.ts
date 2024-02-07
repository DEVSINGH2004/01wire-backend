import { SetMetadata } from '@nestjs/common';
import { AuthTypeEnum } from 'src/common/enum/auth.enum';

export const Auth = (authType: AuthTypeEnum) =>
  SetMetadata('authType', authType);
