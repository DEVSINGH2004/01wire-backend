import { Module, UnsupportedMediaTypeException } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as multer from 'multer';
import * as path from 'path';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: multer.diskStorage({
          destination: configService.get<string>('file.uploadDir'),
          filename: (req, file, cb) => {
            const now = Date.now();
            const extension: string = path.extname(file.originalname);
            cb(null, `${now}${extension}`);
          }
        }),
        limits: {
          fileSize: 2 * 1024 * 1024 // 2MB
        },
        fileFilter: (req, file, cb) => {
          if (file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
            cb(null, true);
          } else {
            cb(
              new UnsupportedMediaTypeException(
                'Only .png, .jpg, and .jpeg formats allowed!'
              ),
              false
            );
          }
        }
      }),
      inject: [ConfigService]
    })
  ],
  controllers: [UploadController]
})
export class UploadModule {}
