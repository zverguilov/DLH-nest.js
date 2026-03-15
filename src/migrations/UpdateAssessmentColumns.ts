import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAssessmentColumns implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE assessment 
      MODIFY COLUMN exam_type nvarchar(64) NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE assessment 
      ADD COLUMN deadline datetime NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE assessment 
      MODIFY COLUMN exam_type nvarchar(16) NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE assessment 
      DROP COLUMN deadline;
    `);
  }
}
