import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class NotionAccessTokenMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const customHeader = req.headers['access-token'];

    if (!customHeader || customHeader === '') {
      return res.status(400).json({ error: 'Invalid access token' });
    }

    next();
  }
}
