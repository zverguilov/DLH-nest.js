import { Controller, Post, UseGuards } from '@nestjs/common';
import { LoadService } from './load.service';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/guards/role.guard';

@Controller('api/v1/load')
export class LoadController {
    public constructor(
        private readonly loadService: LoadService
    ) { }

    @Post('data')
    @UseGuards(AuthGuard(), RoleGuard)
    public async loadData(): Promise<string> {
        return await this.loadService.loadData();
    }
}
