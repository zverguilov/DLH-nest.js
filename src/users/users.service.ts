import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/data/entities/user.entity';
import { UserGetDTO } from 'src/models/user/user-get.dto';
import { UserRoleDTO } from 'src/models/user/user-role.dto';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
    public constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>
    ) { }

    public async retrieveUser(id: string): Promise<User> {
        return await this.userRepository.findOne({where: { id }})
    }

    public async getUserByID(id: string): Promise<UserGetDTO> {
        try {
            let user = await this.retrieveUser(id);

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

    public async setAdminRights(userInfo: UserRoleDTO): Promise<string> {
        let user = await this.retrieveUser(userInfo.id);
        user.role = userInfo.admin ? 'Admin' : 'User';
        await this.userRepository.save(user);
        
        return userInfo.admin ? 'Admin role provided.' : 'Admin role revoked.'
    }
}
