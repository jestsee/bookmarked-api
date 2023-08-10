import { Global, Module } from '@nestjs/common';
import { NotionService } from './notion.service';
import { NotionController } from './notion.controller';
import { TwitterModule } from 'src/twitter/twitter.module';

@Global()
@Module({
  imports: [TwitterModule],
  providers: [NotionService],
  exports: [NotionService],
  controllers: [NotionController],
})
export class NotionModule {}
