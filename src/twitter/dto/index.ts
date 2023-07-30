import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum TwitterDataType {
  TWEET = 'tweet',
  THREAD = 'thread',
}

export class GetTweetDataDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsEnum(TwitterDataType)
  @IsNotEmpty()
  type: TwitterDataType;
}
