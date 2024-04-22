import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Question } from 'src/data/entities/question.entity';
import { Answer } from 'src/data/entities/answer.entity';
import { CustomException } from 'src/middleware/exception/custom-exception';

@Injectable()
export class LoadService {
    public constructor(
        @InjectRepository(Question) private readonly questionRepository: Repository<Question>,
        @InjectRepository(Answer) private readonly answerRepository: Repository<Answer>
    ) { }

    public async loadData(): Promise<string> {
        try {
            const sheetData = await this.readCell('src/load/data-source/ExamDumps.xlsx');
            const sheets = Object.keys(sheetData);

            for (let sheet of sheets) {
                for (let e of sheetData[sheet]) {
                    console.log(`${e[1]}: ${e[2]}`)
                    let newQuestion = await this.questionRepository.create();
                    newQuestion.body = e[2];
                    newQuestion.category = e[5];
                    let createdQuestion = await this.questionRepository.save(newQuestion);

                    let answers = e[3].split(' / ');
                    let answerMap = e[4].split(',');

                    for (let a of answers) {
                        await this.answerRepository.createQueryBuilder()
                        .insert()
                        .into('answer')
                        .values({
                            body: a,
                            is_correct: answerMap[answers.indexOf(a)] == 1,
                            question: createdQuestion
                        })
                        .execute();
                    }
                }
            }

            return 'Data successfully loaded.'

        } catch (ex) {
            throw new CustomException(`Load Service import error: ${ex.message}`, ex.statusCode)
        }
    }

    private async readCell(filename) {
        try {
            const Excel = require('exceljs');

            let workBook = new Excel.Workbook();
            await workBook.xlsx.readFile(filename);

            const sheetNames = workBook.worksheets.map(sheet => sheet.name);

            let sheetData = sheetNames.reduce((acc, curr) => {
                let sheet = workBook.getWorksheet(curr);
                const data = [];

                sheet.eachRow((row, rowNumber) => {
                    if (rowNumber == 1) return;
                    const rowData = row.values;
                    data.push(rowData);
                });

                acc[curr] = data;
                return acc;
            }, {})

            return sheetData;

        } catch (ex) {
            throw new CustomException(`Load Service reading error: ${ex.message}`, ex.statusCode)
        }
    }
}
