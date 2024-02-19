import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UserLoaderService } from './services/user.loader.service';
import { UserResolver } from './graphql/user.resolver';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema
      }
    ]),
    WalletModule
  ],
  providers: [UserService, UserLoaderService, UserResolver],
  exports: [UserService]
})
export class UserModule {}
