import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/data/entities/user.entity';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { UserActiveDTO } from 'src/models/user/user-active.dto';
import { UserGetDTO } from 'src/models/user/user-get.dto';
import { UserRoleDTO } from 'src/models/user/user-role.dto';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
    public constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>
    ) { }

    public async getAllUsers(): Promise<UserGetDTO[]> {
        return await this.userRepository.createQueryBuilder('user')
        .where('is_deleted = false')
        .select([
            'user.id',
            'user.full_name',
            'user.email',
            'user.role'
        ])
        .getMany()
    }

    public async retrieveUser(id: string): Promise<User> {
        try {
            return await this.userRepository.findOne({ where: { id } });

        } catch (ex) {
            throw new CustomException(`User Service error while retrieving record: ${ex.message}`, ex.statusCode);
        }
    }

    public async getUserByID(id: string): Promise<UserGetDTO> {
        try {
            let user = await this.retrieveUser(id);

            return {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                state: user.state
            };

        } catch (ex) {
            throw new CustomException(`User Service retrieval error: ${ex.message}`, ex.statusCode);
        }
    }

    public async setAdminRights(userInfo: UserRoleDTO): Promise<string> {
        try {
            let user = await this.retrieveUser(userInfo.id);
            user.role = userInfo.admin ? 'Admin' : 'User';
            await this.userRepository.save(user);

            return userInfo.admin ? 'Admin role provided.' : 'Admin role revoked.';

        } catch (ex) {
            throw new CustomException(`User Service error while setting admin rights: ${ex.message}`, ex.statusCode);
        }
    }

    public async setActive(userInfo: UserActiveDTO): Promise<string> {
        try {
            let user = await this.retrieveUser(userInfo.id);
            user.state = userInfo.state ? 'Active' : 'Locked';
            await this.userRepository.save(user);

            return userInfo.state ? 'User activated.' : 'User deactivated.';

        } catch (ex) {
            throw new CustomException(`User Service error while activating user: ${ex.message}`, ex.statusCode);
        }
    }
}
