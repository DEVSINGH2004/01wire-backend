import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { IGraphqlContext } from 'src/common/graphql/interface/context.interface';
import { AllowedRoles } from 'src/core/auth/decorator/allowedroles.decorator';
import { UserTypeEnum } from 'src/core/user/enum/user.type.enum';
import { NotificationService } from './notification.service';

@Resolver()
export class NotificationResolver {
  constructor(private notificationService: NotificationService) {}

  // The Marketplace keeps its cart in the browser; this copy lets us send a reminder
  @Mutation(() => Boolean)
  @AllowedRoles([UserTypeEnum.USER])
  async saveCart(
    @Args('publicationIds', { type: () => [String], defaultValue: [] }) publicationIds: string[],
    @Args('bundleIds', { type: () => [String], defaultValue: [] }) bundleIds: string[],
    @Context() { me }: IGraphqlContext
  ) {
    return this.notificationService.saveCart(me.userId, publicationIds, bundleIds);
  }
}
