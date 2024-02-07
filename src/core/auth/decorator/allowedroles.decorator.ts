import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from 'src/core/user/enum/role.enum';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';

export const ROLES_KEY = 'roles';
export const AllowedRoles = (r: [UserTypeEnum, ...RoleEnum[]]) =>
  SetMetadata(ROLES_KEY, r);
