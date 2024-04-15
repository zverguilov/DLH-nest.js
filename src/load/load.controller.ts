import { Controller, Post, UseGuards } from '@nestjs/common';
import { LoadService } from './load.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/v1/load')
export class LoadController {
    public constructor(
        private readonly loadService: LoadService
    ) { }

    @Post('data')
    @UseGuards(AuthGuard())
    public async loadData(): Promise<void> {
        return await this.loadService.loadData();
    }
}
