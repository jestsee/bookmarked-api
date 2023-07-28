import { Test, TestingModule } from '@nestjs/testing';
import { NotionSdkService } from './notion-sdk.service';

describe('NotionSdkService', () => {
  let service: NotionSdkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotionSdkService],
    }).compile();

    service = module.get<NotionSdkService>(NotionSdkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
