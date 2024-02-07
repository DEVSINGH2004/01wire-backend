import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UserLoaderService } from './services/user.loader.service';
import { UserResolver } from './graphql/user.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema
      }
    ])
  ],
  providers: [UserService, UserLoaderService, UserResolver],
  exports: [UserService]
})
export class UserModule {}
