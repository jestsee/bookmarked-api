import { IsNotEmpty, IsString } from 'class-validator';

export class PuppeteerDto {
  @IsString()
  @IsNotEmpty()
  url: string;
}
