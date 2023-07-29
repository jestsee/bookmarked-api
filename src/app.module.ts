import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { NotionModule } from './notion/notion.module';
import { NotionSdkModule } from './notion-sdk/notion-sdk.module';
import { PuppeteerModule } from './puppeteer/puppeteer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env.local',
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    NotionModule,
    NotionSdkModule,
    PuppeteerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
