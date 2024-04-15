import { Body, Controller, Param, Post, Put, UseGuards } from '@nestjs/common';
import { QuestionInstancesService } from './question-instances.service';
import { MarkPayloadDTO } from 'src/models/others/mark-payload.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/v1')
export class QuestionInstancesController {
    public constructor(
        private readonly questionInstanceService: QuestionInstancesService
    ) {}
    
    @Put('mark/:instanceID')
    @UseGuards(AuthGuard())
    public async mark(@Param('instanceID') instanceID: string, @Body() payload: MarkPayloadDTO): Promise<string> {
        return await this.questionInstanceService.mark(instanceID, payload);
    }
}
