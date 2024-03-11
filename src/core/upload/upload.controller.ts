import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

interface MulterRequest extends Request {
  files: { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[];
}

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file')) // 'file' is the name of the field in the form-data
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() request: MulterRequest
  ) {
    if (!file) {
      throw new BadRequestException('no file was uploaded in request');
    }

    // Check if the request contains more than one file under different field names
    const files = request.files ? Object.values(request.files).flat() : [];
    if (files.length > 1) {
      throw new BadRequestException(
        'multiple file upload is not supported. please upload one file at a time.'
      );
    }

    // Assuming the file upload is successful, return relevant file information
    return {
      message: 'File uploaded successfully!',
      originalName: file.originalname, // The name of the uploaded file on the user's device
      fileName: file.filename, // The name of the file on the server, including the epoch timestamp
      size: file.size, // Size of the file in bytes
      mimeType: file.mimetype // MIME type of the file
    };
  }
}
