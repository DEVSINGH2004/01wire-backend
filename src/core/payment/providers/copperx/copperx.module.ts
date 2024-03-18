import { Module } from '@nestjs/common';
import { CopperxService } from './copperx.service';
import { COPPERX_HTTP_CLIENT } from './constants';
import { ConfigService } from '@nestjs/config';
import { ConfigVariablesType } from 'src/config';
import axios from 'axios';

@Module({
  providers: [
    CopperxService,
    {
      provide: COPPERX_HTTP_CLIENT,
      useFactory: (configService: ConfigService<ConfigVariablesType>) => {
        const { baseUrl, secretKey } = configService.get('copperx', {
          infer: true
        });
        return axios.create({
          baseURL: baseUrl,
          headers: {
            Authorization: `Bearer ${secretKey}`
          }
        });
      },
      inject: [ConfigService]
    }
  ],
  exports: [CopperxService]
})
export class CopperxModule {}
