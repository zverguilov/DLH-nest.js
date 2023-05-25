import { Module } from '@nestjs/common';
import { LoadController } from './load.controller';
import { LoadService } from './load.service';

@Module({
  controllers: [LoadController],
  providers: [LoadService]
})
export class LoadModule {}
