import { MigrationInterface, QueryRunner } from "typeorm";

export class FixQuestionInstanceAssessmentCascade1789045874603 implements MigrationInterface {
    name = 'FixQuestionInstanceAssessmentCascade1789045874603'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`question_instance\` DROP FOREIGN KEY \`FK_3c07cec8961aa7a1640ae8103fe\``);
        await queryRunner.query(`ALTER TABLE \`question_instance\` ADD CONSTRAINT \`FK_3c07cec8961aa7a1640ae8103fe\` FOREIGN KEY (\`assessmentId\`) REFERENCES \`assessment\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`question_instance\` DROP FOREIGN KEY \`FK_3c07cec8961aa7a1640ae8103fe\``);
        await queryRunner.query(`ALTER TABLE \`question_instance\` ADD CONSTRAINT \`FK_3c07cec8961aa7a1640ae8103fe\` FOREIGN KEY (\`assessmentId\`) REFERENCES \`assessment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
