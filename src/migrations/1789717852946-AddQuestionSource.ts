import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuestionSource1789717852946 implements MigrationInterface {
    name = 'AddQuestionSource1789717852946'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`question\` ADD \`source\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`question\` DROP COLUMN \`source\``);
    }

}
