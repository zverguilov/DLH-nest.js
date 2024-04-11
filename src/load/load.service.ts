import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Question } from 'src/data/entities/question.entity';
import { Answer } from 'src/data/entities/answer.entity';

@Injectable()
export class LoadService {
    public constructor(
        @InjectRepository(Question) private readonly questionRepository: Repository<Question>,
        @InjectRepository(Answer) private readonly answerRepository: Repository<Answer>
    ) { }

    public async loadData(): Promise<void> {

        const data = await this.readCell('src/load/data-source/ExamDumps.xlsx');

        for (let e of data) {
            let newQuestion = await this.questionRepository.create();
            newQuestion.body = e[2];
            newQuestion.category = e[5];
            let createdQuestion = await this.questionRepository.save(newQuestion);

            let answers = e[3].split(' / ');
            let answerMap = e[4].split(',');

            for (let a of answers) {
                let newAnswer = this.answerRepository.create();
                newAnswer.body = a;
                newAnswer.is_correct = answerMap[answers.indexOf(a)] == 1;
                newAnswer.question = createdQuestion;
                let createdAnswer = await this.answerRepository.save(newAnswer)
            }
        }
    }

    private async readCell(filename) {
        const Excel = require('exceljs');

        let workBook = new Excel.Workbook();
        await workBook.xlsx.readFile(filename);

        let sheet = workBook.getWorksheet('CSA');
        const data = [];

        sheet.eachRow((row, rowNumber) => {
            if (rowNumber == 1) return;
            const rowData = row.values;
            data.push(rowData);
        });

        return data;
    }
}
