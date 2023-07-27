import { Global, Module } from '@nestjs/common';
import { NotionService } from './notion.service';
import { NotionController } from './notion.controller';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [HttpModule],
  providers: [NotionService],
  exports: [NotionService],
  controllers: [NotionController],
})
export class NotionModule {}
