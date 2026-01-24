import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserGetDTO } from 'src/models/user/user-get.dto';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/middleware/guards/role.guard';
import { UserRoleDTO } from 'src/models/user/user-role.dto';
import { StateGuard } from 'src/middleware/guards/state.guard';
import { UserActiveDTO } from 'src/models/user/user-active.dto';
import { UserPassResetDTO } from 'src/models/user/user-pass-reset.dto';

@Controller('api/v1')
export class UsersController {
  public constructor(private readonly usersService: UsersService) {}

  @Get('users')
  @UseGuards(AuthGuard(), RoleGuard, StateGuard)
  public async getAllUsers(): Promise<UserGetDTO[]> {
    return await this.usersService.getAllUsers();
  }

  @Get('users/:userID')
  @UseGuards(AuthGuard())
  public async getUserByID(
    @Param('userID') userID: string,
  ): Promise<UserGetDTO> {
    return await this.usersService.getUserByID(userID);
  }

  @Put('users/admin')
  @UseGuards(AuthGuard(), RoleGuard, StateGuard)
  public async setAdminRights(@Body() user: UserRoleDTO): Promise<string> {
    return await this.usersService.setAdminRights(user);
  }

  @Put('users/active')
  @UseGuards(AuthGuard(), RoleGuard, StateGuard)
  public async setActive(@Body() user: UserActiveDTO): Promise<string> {
    return await this.usersService.setActive(user);
  }

  @Put('users/reset-password')
  @UseGuards(AuthGuard(), RoleGuard, StateGuard)
  public async resetPassword(@Body() user: UserPassResetDTO): Promise<string> {
    return await this.usersService.resetPassword(user);
  }

  @Delete('users/:userID')
  @UseGuards(AuthGuard(), RoleGuard, StateGuard)
  public async deleteUser(@Param('userID') userID: string): Promise<string> {
    return await this.usersService.deleteUser(userID);
  }
}
