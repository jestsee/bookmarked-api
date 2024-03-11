import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export enum TwitterDataType {
  TWEET = 'tweet',
  THREAD = 'thread',
}

export class GetTweetDataDto {
  @IsString()
  @IsNotEmpty()
  databaseId: string;

  @IsString()
  @IsUrl(
    { host_whitelist: ['twitter.com', 'x.com'] },
    { message: 'URL must be a valid tweet URL' },
  )
  @IsNotEmpty()
  url: string;

  @IsEnum(TwitterDataType)
  @IsNotEmpty()
  type: TwitterDataType;

  @IsOptional()
  tags: string[];
}
