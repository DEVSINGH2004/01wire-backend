import { createZodDto } from 'nestjs-zod';
import {  clinetDto } from './client.dto';

const clientUpdateDto = clinetDto.omit({
});

export class ClientUpdateDto extends createZodDto(clientUpdateDto) {}
