import { IsNotEmpty, IsString } from 'class-validator';

export class NotionIntegrationDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}
