import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/data/entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { Assessment } from 'src/data/entities/assessment.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([User, Assessment])
  ],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
