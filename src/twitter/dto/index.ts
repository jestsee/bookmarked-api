import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum TwitterDataType {
  TWEET = 'tweet',
  THREAD = 'thread',
}

export class GetTweetDataDto {
  @IsString()
  @IsNotEmpty()
  databaseId: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsEnum(TwitterDataType)
  @IsNotEmpty()
  type: TwitterDataType;

  @IsOptional()
  tags: string[];
}
