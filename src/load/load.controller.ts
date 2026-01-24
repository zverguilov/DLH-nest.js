import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { LoadService } from './load.service';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/middleware/guards/role.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs-extra';
import { StateGuard } from 'src/middleware/guards/state.guard';


@Controller('api/v1/load')
export class LoadController {
    public constructor(
        private readonly loadService: LoadService
    ) { }

    @Post('data')
    @UseGuards(AuthGuard(), RoleGuard, StateGuard)
    @UseInterceptors(FileInterceptor('file'))
    public async loadData(@UploadedFile() file): Promise<string> {
        const filePath = `src/load/data-source/${new Date().toISOString().replace(/[:T.-]/g, '')}-${file.originalname}`;
        await fs.writeFile(filePath, file.buffer);

        return await this.loadService.loadData(file.buffer);
    }
}
