import { Test, TestingModule } from '@nestjs/testing';
import { NotionController } from './notion.controller';

describe('NotionController', () => {
  let controller: NotionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotionController],
    }).compile();

    controller = module.get<NotionController>(NotionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
