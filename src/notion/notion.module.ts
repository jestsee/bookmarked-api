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
import { BullModule } from '@nestjs/bull';
import { NotionConsumer } from './notion.consumer';

@Global()
@Module({
  imports: [BullModule.registerQueueAsync({ name: 'notion' }), TwitterModule],
  providers: [NotionService, NotionConsumer],
  exports: [NotionService],
  controllers: [NotionController],
})
export class NotionModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(NotionAccessTokenMiddleware)
      .exclude(
        {
          path: 'notion/generate-access-token',
          method: RequestMethod.POST,
        },
        {
          path: 'notion/bookmark-tweet/:taskId/status',
          method: RequestMethod.GET,
        },
        {
          path: 'notion/bookmark-tweet/:taskId/retry',
          method: RequestMethod.PATCH,
        },
      )
      .forRoutes('notion/*');
  }
}
