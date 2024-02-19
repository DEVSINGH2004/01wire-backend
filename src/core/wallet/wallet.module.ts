import { Module } from '@nestjs/common';
import { WalletService } from './services/wallet.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './wallet.schema';
import { WalletLoaderService } from './services/wallet.loader.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }])
  ],
  providers: [WalletService, WalletLoaderService],
  exports: [WalletService]
})
export class WalletModule {}
