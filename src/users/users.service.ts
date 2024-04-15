import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/data/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
    public constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>
    ) { }

    public async getUserByID(id: string): Promise<User> {
        try {
            return await this.userRepository.findOne({ where: { id }})
        } catch (ex) {
            throw `User Service retrieval error: ${ex.message}`
        }
    }
}
