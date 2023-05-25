import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Question } from 'src/data/entities/question.entity';
@Injectable()
export class LoadService {
    public constructor(
        @InjectRepository(Question) private readonly questionRepository: Repository<Question>
    ) {}

    public async loadData(): Promise<any> {
        return 'gg'
    }
}
