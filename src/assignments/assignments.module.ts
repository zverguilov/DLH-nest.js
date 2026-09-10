import { Module } from '@nestjs/common';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';
import { Assignment } from 'src/data/entities/assignment.entity';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/data/entities/user.entity';
import { Assessment } from 'src/data/entities/assessment.entity';

@Module({
  imports: [
      PassportModule.register({ defaultStrategy: 'jwt' }),
      TypeOrmModule.forFeature([Assignment, User, Assessment])
    ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService, JwtService, UsersService]
})
export class AssignmentsModule {}
