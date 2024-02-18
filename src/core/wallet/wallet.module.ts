import { Module } from '@nestjs/common';
import { WalletService } from './services/wallet.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './wallet.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }])
  ],
  providers: [WalletService]
})
export class WalletModule {}
