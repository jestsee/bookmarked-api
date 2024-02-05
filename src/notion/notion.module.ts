import {
  Global,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { NotionService } from './notion.service';
import { NotionController } from './notion.controller';
import { TwitterModule } from 'src/twitter/twitter.module';
import { NotionAccessTokenMiddleware } from 'src/middleware/notion-access-token.middleware';

@Global()
@Module({
  imports: [TwitterModule],
  providers: [NotionService],
  exports: [NotionService],
  controllers: [NotionController],
})
export class NotionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(NotionAccessTokenMiddleware)
      .exclude({
        path: 'notion/generate-access-token',
        method: RequestMethod.POST,
      })
      .forRoutes('notion/*');
  }
}
