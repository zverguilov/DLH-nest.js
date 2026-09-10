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
import { UserGetDTO } from 'src/models/user/user-get.dto';
import { Request } from 'express';
import { ConfigService } from 'src/config/config.service';


@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService
  ) { }

  public async getCurrentUser(request: Request): Promise<User> {

    const authHeader = (request.headers as { authorization?: string }).authorization?.toString();
    if (!authHeader) {
      throw new CustomException('No authorization header', 401);
    }

    try {
      const token = authHeader.split(' ')[1];

      const jwtServ = new JwtService({ secret: this.configService.jwtSecret });
      const decoded = await jwtServ.verifyAsync(token);
      return this.usersService.retrieveUser(decoded.id);
    } catch (ex) {
      throw new CustomException('Invalid token', 401);
    }
  }

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

      if (foundUser) throw new CustomException(`user already exists`, 500);


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

