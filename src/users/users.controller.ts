import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserGetDTO } from 'src/models/user/user-get.dto';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/middleware/guards/role.guard';
import { UserRoleDTO } from 'src/models/user/user-role.dto';
import { StateGuard } from 'src/middleware/guards/state.guard';

@Controller('api/v1')
export class UsersController {
    public constructor(
        private readonly usersService: UsersService
    ) { }

    @Get('users')
    @UseGuards(AuthGuard(), RoleGuard, StateGuard)
    public async getAllUsers(): Promise<UserGetDTO[]> {
        return this.usersService.getAllUsers();
    }

    @Get('users/:userID')
    @UseGuards(AuthGuard(), StateGuard)
    public async getUserByID(@Param('userID') userID: string): Promise<UserGetDTO> {
        return this.usersService.getUserByID(userID);
    }

    @Put('users/admin')
    @UseGuards(AuthGuard(), RoleGuard, StateGuard)
    public async setAdminRights(@Body() user: UserRoleDTO): Promise<string> {
        return this.usersService.setAdminRights(user);
    }
}
