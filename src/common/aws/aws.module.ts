import { SES } from '@aws-sdk/client-ses';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigVariablesType } from 'src/config';
import { SesService } from './aws.ses.service';

@Module({
  controllers: [],
  providers: [
    SesService,
    {
      provide: SES,
      useFactory(configService: ConfigService<ConfigVariablesType>) {
        return new SES({
          region: configService.get('aws.region', { infer: true })
        });
      },
      inject: [ConfigService]
    }
  ],
  exports: [SesService]
})
export class AwsModule {}
