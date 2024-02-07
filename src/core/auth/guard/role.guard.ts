import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY } from '../decorator/allowedroles.decorator';
import { RoleEnum } from 'src/core/user/enum/role.enum';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const execContext = GqlExecutionContext.create(context);
    const requiredRoles = this.reflector.getAllAndOverride<
      [UserTypeEnum, ...RoleEnum[]]
    >(ROLES_KEY, [execContext.getHandler(), execContext.getClass()]);
    if (!requiredRoles) {
      return true;
    }
    // TODO FIX ME:
    const me = execContext.getContext<IGraphqlContext>().me;
    const [userType, ...roles] = requiredRoles;

    if (userType === me.user.type) {
      return true;
    }

    if (!roles || !roles.length) return false;
    // eslint-disable-next-line
    // @ts-ignore
    return requiredRoles.some((role) => roles.includes(role));
  }
}
