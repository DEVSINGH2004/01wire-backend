import { Module } from '@nestjs/common';
import { WalletService } from './services/wallet.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './wallet.schema';
import { WalletLoaderService } from './services/wallet.loader.service';
import { WalletResolver } from './graphql/wallet.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }])
  ],
  providers: [WalletService, WalletLoaderService, WalletResolver],
  exports: [WalletService]
})
export class WalletModule {}
