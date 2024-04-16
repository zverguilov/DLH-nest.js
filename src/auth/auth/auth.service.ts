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

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }

  public async login(user: UserLoginDTO): Promise<{ authToken: string }> {
    if (!user.email) throw `Auth Service login error: email is missing.`;
    if (!user.password) throw `Auth Service login error: password is missing.`;

    try {
      const loginMethod = { email: user.email };
      const foundUser: User = await this.usersRepository
        .findOne({ where: { ...loginMethod, is_deleted: false } });

      if (!foundUser || !(await bcrypt.compare(user.password, foundUser.password))) throw `Auth Service login error: invalid credentials.`;

      const payload: JwtPayload = {
        id: foundUser.id,
        email: foundUser.email,
      };
      const authToken: string = await this.jwtService.signAsync(payload);

      return { authToken };

    } catch (ex) {
      throw `Auth Service login error: ${ex.message}`
    }
  }

  public async reg(user: UserRegDTO): Promise<UserCreatedDTO> {
    if (!user.email) throw `Auth Service error in registration: email is missing.`;
    if (!user.full_name) throw `Auth Service error in registration: name is missing.`;
    if (!user.password) throw `Auth Service error in registration: password is missing.`;

    try {
      const loginMethod = { email: user.email };

      const foundUser: User = await this.usersRepository
        .findOne({ where: { ...loginMethod, is_deleted: false } });

      if (foundUser) throw `Auth Service error in registration: user already exists`;

      const newUser = this.usersRepository.create();
      newUser.password = await bcrypt.hash(user.password, 10);
      newUser.email = user.email;
      newUser.full_name = user.full_name
      await this.usersRepository.save(newUser);

      return {
        id: newUser.id,
        full_name: newUser.full_name
      }

    } catch (ex) {
      throw `Auth Service error in registration: ${ex.message}`
    }
  }
}

