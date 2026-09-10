import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { LoadService } from './load.service';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/middleware/guards/role.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs-extra';
import { StateGuard } from 'src/middleware/guards/state.guard';
import * as path from 'path';


@Controller('api/v1/load')
export class LoadController {
    public constructor(
        private readonly loadService: LoadService
    ) { }

    @Post('data')
    @UseGuards(AuthGuard(), RoleGuard, StateGuard)
    @UseInterceptors(FileInterceptor('file'))
    public async loadData(@UploadedFile() file): Promise<string> {
        console.log('CONTROLLER HIT');
        console.log('Uploaded file object:', file);

        const uploadDir = path.join(process.cwd(), '..', 'uploads');

        await fs.ensureDir(uploadDir);

        const safeOriginalName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');

        const filePath = path.join(
            uploadDir,
            `${new Date().toISOString().replace(/[:T.-]/g, '')}-${safeOriginalName}`,
        );

        await fs.writeFile(filePath, file.buffer);

        return await this.loadService.loadData(file.buffer);
    }
}
