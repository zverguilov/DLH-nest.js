import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/data/entities/user.entity';
import { UserGetDTO } from 'src/models/user/user-get.dto';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
    public constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>
    ) { }

    public async getUserByID(id: string): Promise<UserGetDTO> {
        try {
            let user =  await this.userRepository.createQueryBuilder('user')
            .where('user.id = :id', {id})
            .select([
                'user.id',
                'user.full_name',
                'user.email',
                'user.role'
            ])
            .getOne();

            return {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        } catch (ex) {
            throw `User Service retrieval error: ${ex.message}`
        }
    }
}
