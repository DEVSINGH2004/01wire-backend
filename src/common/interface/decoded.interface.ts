import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';

export interface IUser {
  userId: string;
  userType: UserTypeEnum;
  iat: number;
  exp: number;
}
