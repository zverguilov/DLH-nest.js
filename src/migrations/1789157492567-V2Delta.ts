import { MigrationInterface, QueryRunner } from "typeorm";

export class V2Delta1789157492567 implements MigrationInterface {
    name = 'V2Delta1789157492567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // --- премахване на съществуващи външни ключове ---
        await queryRunner.query(`ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_a4013f10cd6924793fbd5f0d637\``);
        await queryRunner.query(`ALTER TABLE \`question_instance\` DROP FOREIGN KEY \`FK_3c07cec8961aa7a1640ae8103fe\``);
        await queryRunner.query(`ALTER TABLE \`question_instance\` DROP FOREIGN KEY \`FK_fba40a6fbcc40f414ef175775d3\``);
        await queryRunner.query(`ALTER TABLE \`comment\` DROP FOREIGN KEY \`FK_38c7b71e5d494309af3cb8a7d70\``);

        // --- нови таблици ---
        await queryRunner.query(`CREATE TABLE \`assignment\` (\`id\` varchar(36) NOT NULL, \`created_on\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, \`deadline\` datetime NULL, \`exam_type\` varchar(64) NOT NULL, \`assignedById\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`question_stat\` (\`question_id\` varchar(255) NOT NULL, \`wrong_count\` int NULL, \`total_count\` int NULL, \`bayesian\` float NULL, INDEX \`IDX_f24426855254d3670af96fef3a\` (\`bayesian\`), PRIMARY KEY (\`question_id\`)) ENGINE=InnoDB`);

        // --- нови колони ---
        await queryRunner.query(`ALTER TABLE \`assessment\` ADD \`is_assigned\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`assessment\` ADD \`attempts\` int NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`assessment\` ADD \`deadline\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`assessment\` ADD \`assignmentId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`category\` ADD \`passing_grade\` int NOT NULL DEFAULT '75'`);

        // --- ПРОМЯНА, НЕ ПРЕСЪЗДАВАНЕ: данните се запазват ---
        // (генераторът беше сложил DROP COLUMN + ADD COLUMN, което трие стойностите)
        await queryRunner.query(`ALTER TABLE \`assessment\` MODIFY COLUMN \`exam_type\` varchar(64) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`question\` MODIFY COLUMN \`category\` varchar(64) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`assessment\` MODIFY COLUMN \`time_started\` datetime NULL`);

        // --- индекси ---
        await queryRunner.query(`ALTER TABLE \`category\` ADD UNIQUE INDEX \`IDX_23c05c292c439d77b0de816b50\` (\`name\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_4a97d612b47df5a2015d7cdb46\` ON \`question_instance\` (\`questionId\`, \`is_correct\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_3c07cec8961aa7a1640ae8103f\` ON \`question_instance\` (\`assessmentId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_fba40a6fbcc40f414ef175775d\` ON \`question_instance\` (\`questionId\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_02718800445a4fcc5a09865582\` ON \`question\` (\`body\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_9dceeae589e85556f990671518\` ON \`question\` (\`category\`)`);
        await queryRunner.query(`CREATE INDEX \`IDX_65e29b09a064487efd3e96c468\` ON \`user\` (\`full_name\`)`);

        // --- външни ключове ---
        await queryRunner.query(`ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_a4013f10cd6924793fbd5f0d637\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`assignment\` ADD CONSTRAINT \`FK_89872b43ab55aa4e9058fadb9de\` FOREIGN KEY (\`assignedById\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`assessment\` ADD CONSTRAINT \`FK_8f10a9d487df91fe0142b1eb2af\` FOREIGN KEY (\`assignmentId\`) REFERENCES \`assignment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`question_instance\` ADD CONSTRAINT \`FK_fba40a6fbcc40f414ef175775d3\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`question_instance\` ADD CONSTRAINT \`FK_3c07cec8961aa7a1640ae8103fe\` FOREIGN KEY (\`assessmentId\`) REFERENCES \`assessment\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        // CASCADE вместо NO ACTION — иначе изтриването на въпрос се блокира от статистиката му
        await queryRunner.query(`ALTER TABLE \`question_stat\` ADD CONSTRAINT \`FK_9fdd5db0c7d02a5a73b7b577a33\` FOREIGN KEY (\`question_id\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`comment\` ADD CONSTRAINT \`FK_38c7b71e5d494309af3cb8a7d70\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`comment\` DROP FOREIGN KEY \`FK_38c7b71e5d494309af3cb8a7d70\``);
        await queryRunner.query(`ALTER TABLE \`question_stat\` DROP FOREIGN KEY \`FK_9fdd5db0c7d02a5a73b7b577a33\``);
        await queryRunner.query(`ALTER TABLE \`question_instance\` DROP FOREIGN KEY \`FK_3c07cec8961aa7a1640ae8103fe\``);
        await queryRunner.query(`ALTER TABLE \`question_instance\` DROP FOREIGN KEY \`FK_fba40a6fbcc40f414ef175775d3\``);
        await queryRunner.query(`ALTER TABLE \`assessment\` DROP FOREIGN KEY \`FK_8f10a9d487df91fe0142b1eb2af\``);
        await queryRunner.query(`ALTER TABLE \`assignment\` DROP FOREIGN KEY \`FK_89872b43ab55aa4e9058fadb9de\``);
        await queryRunner.query(`ALTER TABLE \`answer\` DROP FOREIGN KEY \`FK_a4013f10cd6924793fbd5f0d637\``);

        await queryRunner.query(`DROP INDEX \`IDX_65e29b09a064487efd3e96c468\` ON \`user\``);
        await queryRunner.query(`DROP INDEX \`IDX_9dceeae589e85556f990671518\` ON \`question\``);
        await queryRunner.query(`DROP INDEX \`IDX_02718800445a4fcc5a09865582\` ON \`question\``);
        await queryRunner.query(`DROP INDEX \`IDX_fba40a6fbcc40f414ef175775d\` ON \`question_instance\``);
        await queryRunner.query(`DROP INDEX \`IDX_3c07cec8961aa7a1640ae8103f\` ON \`question_instance\``);
        await queryRunner.query(`DROP INDEX \`IDX_4a97d612b47df5a2015d7cdb46\` ON \`question_instance\``);
        await queryRunner.query(`ALTER TABLE \`category\` DROP INDEX \`IDX_23c05c292c439d77b0de816b50\``);

        // обратната промяна също е MODIFY — стойности, по-дълги от 16 знака, ще бъдат отрязани
        await queryRunner.query(`ALTER TABLE \`question\` MODIFY COLUMN \`category\` varchar(16) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`assessment\` MODIFY COLUMN \`exam_type\` varchar(16) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`assessment\` MODIFY COLUMN \`time_started\` datetime NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`category\` DROP COLUMN \`passing_grade\``);
        await queryRunner.query(`ALTER TABLE \`assessment\` DROP COLUMN \`assignmentId\``);
        await queryRunner.query(`ALTER TABLE \`assessment\` DROP COLUMN \`deadline\``);
        await queryRunner.query(`ALTER TABLE \`assessment\` DROP COLUMN \`attempts\``);
        await queryRunner.query(`ALTER TABLE \`assessment\` DROP COLUMN \`is_assigned\``);

        await queryRunner.query(`DROP INDEX \`IDX_f24426855254d3670af96fef3a\` ON \`question_stat\``);
        await queryRunner.query(`DROP TABLE \`question_stat\``);
        await queryRunner.query(`DROP TABLE \`assignment\``);

        await queryRunner.query(`ALTER TABLE \`comment\` ADD CONSTRAINT \`FK_38c7b71e5d494309af3cb8a7d70\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`question_instance\` ADD CONSTRAINT \`FK_fba40a6fbcc40f414ef175775d3\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`question_instance\` ADD CONSTRAINT \`FK_3c07cec8961aa7a1640ae8103fe\` FOREIGN KEY (\`assessmentId\`) REFERENCES \`assessment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`answer\` ADD CONSTRAINT \`FK_a4013f10cd6924793fbd5f0d637\` FOREIGN KEY (\`questionId\`) REFERENCES \`question\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}