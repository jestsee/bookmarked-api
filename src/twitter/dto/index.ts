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

// TODO move to notion folder and rename it as notion.dto.ts
export class GetTweetDataDto {
  @IsString()
  @IsNotEmpty()
  databaseId: string;

  @IsString()
  @IsUrl(
    {
      host_whitelist: ['twitter.com', 'x.com', 'www.twitter.com', 'www.x.com'],
    },
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
