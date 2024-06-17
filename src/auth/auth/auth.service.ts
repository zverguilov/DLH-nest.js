import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/data/entities/user.entity';
import { UserLoginDTO } from 'src/models/user/user-login.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload';
import { UserRegDTO } from 'src/models/user/user-reg.dto';
import { UserCreatedDTO } from 'src/models/user/user-created.dto';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService
  ) { }

  public async login(user: UserLoginDTO): Promise<any> {
    if (!user.email) throw new CustomException(`Auth Service login error: email is missing.`, 400);
    if (!user.password) throw new CustomException(`Auth Service login error: password is missing.`, 400);

    try {
      const loginMethod = { email: user.email };
      const foundUser: User = await this.usersRepository
        .findOne({ where: { ...loginMethod, is_deleted: false } });

      if (!foundUser || !(await bcrypt.compare(user.password, foundUser.password))) throw new CustomException(`Auth Service login error: invalid credentials.`, 400);

      const payload: JwtPayload = {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role,
        state: foundUser.state
      };
      const authToken: string = await this.jwtService.signAsync(payload);

      return {
        id: foundUser.id,
        authToken
      };

    } catch (ex) {
      throw new CustomException(`Auth Service login error: ${ex.message}`, ex.statusCode)
    }
  }

  public async reg(user: UserRegDTO): Promise<UserCreatedDTO> {
    if (!user.email) throw new CustomException(`Auth Service error in registration: email is missing.`, 400);
    if (!user.full_name) throw new CustomException(`Auth Service error in registration: name is missing.`, 400);
    if (!user.password) throw new CustomException(`Auth Service error in registration: password is missing.`, 400);

    try {
      const loginMethod = { email: user.email };

      const foundUser: User = await this.usersRepository
        .findOne({ where: { ...loginMethod, is_deleted: false } });

      if (foundUser) throw `Auth Service error in registration: user already exists`;

      const newUser = this.usersRepository.create();
      newUser.password = await bcrypt.hash(user.password, 10);
      newUser.email = user.email;
      newUser.full_name = user.full_name

      let existingUsers = await this.usersService.getAllUsers();

      if (!existingUsers.length) {
        newUser.role = 'Admin';
        newUser.state = 'Active';
      }

      await this.usersRepository.save(newUser);

      return {
        id: newUser.id,
        full_name: newUser.full_name
      }

    } catch (ex) {
      throw new CustomException(`Auth Service error in registration: ${ex.message}`, ex.statusCode)
    }
  }
}

