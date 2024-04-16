import { JwtPayload } from './jwt-payload';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from 'src/config/config.service';
import { User } from 'src/data/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const isFoundUser: boolean = (await this.usersRepository
      .count({ where: { id: payload.id, is_deleted: false } })) > 0;

    if (!isFoundUser) {
      throw new BadRequestException(401);
    }

    return payload;
  }
}
