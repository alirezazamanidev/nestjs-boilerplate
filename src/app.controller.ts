import { Controller, Get, OnModuleInit, UseGuards } from '@nestjs/common';
import { MessageEnvelope, MessagingManager } from './core/messaging';
import { Trace } from './common/decorators/trace.decorator';
import { AppService } from './app.service';
@Controller()
export class AppController {
  private messaging = MessagingManager.resolveService();

  constructor(private readonly appService:AppService){}
 
  @Get('/check')
  async check() {
    // simulate async operation
    await new Promise((resolve) =>
      setTimeout(() => {
        resolve(true);
      }, 5000),
    );

    return 'ok';
  }
}
