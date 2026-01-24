import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { UserLoginDTO } from 'src/models/user/user-login.dto';
import { AuthService } from './auth.service';
import { UserRegDTO } from 'src/models/user/user-reg.dto';
import { UserCreatedDTO } from 'src/models/user/user-created.dto';

@Controller('api/v1/session')
export class AuthController {
  constructor(
    private readonly authenticationService: AuthService,
  ) { }

  @Post('login')
  async login(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) user: UserLoginDTO,
  ): Promise<{ authToken: string }> {
    return await this.authenticationService.login(user);
  }

  @Post('reg')
  async reg(
      @Body() user: UserRegDTO,
  ): Promise<UserCreatedDTO> {
      return await this.authenticationService.reg(user);
  }
}
