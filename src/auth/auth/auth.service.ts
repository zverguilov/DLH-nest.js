import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/data/entities/user.entity';
import { UserLoginDTO } from 'src/models/user/user-login.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt-payload';
import { UserRegDTO } from 'src/models/user/user-reg.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private readonly usersRepository: Repository<User>,
        private readonly jwtService: JwtService,
      ) { }

      public async login(user: UserLoginDTO): Promise<{ authToken: string }> {
        // if (!user.username && !user.email) {
        //   throw new InvalidUserCredentialsError();
        // }
    
        const loginMethod = { email: user.email };
    
        const foundUser: User = await this.usersRepository
          .findOne({ where: { ...loginMethod, isDeleted: false } });
    
        // if (!foundUser || !(await bcrypt.compare(user.password, foundUser.password))) {
        //   throw new InvalidUserCredentialsError();
        // }
    
        const payload: JwtPayload = {
          id: foundUser.id,
          email: foundUser.email,
        };
        try {
          const authToken: string = await this.jwtService.signAsync(payload);
          
          console.log(authToken)
          
          return { authToken };
        } catch (ex) {
          console.log(ex.message)
        }
      }

      public async reg(user: UserRegDTO): Promise<string> {

        // if (!user.username && !user.email) {
        //     throw new InvalidUserCredentialsError();
        //   }
      
          const loginMethod = { email: user.email };
      
          const foundUser: User = await this.usersRepository
            .findOne({ where: { ...loginMethod, isDeleted: false } });

          if(foundUser) {
              throw new Error('User already exists');
          };

          const newUser = this.usersRepository.create();

          newUser.password = await bcrypt.hash(user.password, 10);
          newUser.email = user.email;
          newUser.full_name = user.full_name

          await this.usersRepository.save(newUser);

          return 'gg'
      }
}

