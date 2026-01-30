import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly cls: ClsService) {}

  use(req: Request & { id?: string }, _res: Response, next: NextFunction) {
    const rid = req.id || randomUUID();
    this.cls.set('requestId', rid);
    next();
  }
}
