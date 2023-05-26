import { Controller, Post } from '@nestjs/common';
import { LoadService } from './load.service';

@Controller('api/v1/load')
export class LoadController {
    public constructor(
        private readonly loadService: LoadService
    ) { }

    @Post('data')
    public async loadData(): Promise<void> {
        return await this.loadService.loadData();
    }
}
