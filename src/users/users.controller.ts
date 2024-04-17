import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserGetDTO } from 'src/models/user/user-get.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/v1')
export class UsersController {
    public constructor(
        private readonly usersService: UsersService
    ) { }

    @Get('users/:userID')
    @UseGuards(AuthGuard())
    public async getUserByID(@Param('userID') userID: string): Promise<UserGetDTO> {
        return this.usersService.getUserByID(userID);
    }
}
