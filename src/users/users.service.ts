import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/data/entities/user.entity';
import { CustomException } from 'src/middleware/exception/custom-exception';
import { UserActiveDTO } from 'src/models/user/user-active.dto';
import { UserGetDTO } from 'src/models/user/user-get.dto';
import { UserPassResetDTO } from 'src/models/user/user-pass-reset.dto';
import { UserRoleDTO } from 'src/models/user/user-role.dto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { TopAchieverDTO } from 'src/models/user/top-achiever.dto';
import { Assessment } from 'src/data/entities/assessment.entity';

@Injectable()
export class UsersService {
  public constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Assessment) private readonly assessmentRepository: Repository<Assessment>
  ) { }

  public async getTopAchievers(assigned: boolean): Promise<TopAchieverDTO[]> {

    const m = 25; // Bayesian weight

    const { avg } = await this.assessmentRepository
      .createQueryBuilder('a')
      .select('AVG(a.grade)', 'avg')
      .where('a.status = :status', { status: 'Finished' })
      .andWhere('a.grade IS NOT NULL')
      .andWhere('a.is_assigned = :assigned', { assigned })
      .getRawOne();

    const globalAvg = Number(avg) || 0;

    console.log(`global avg: ${globalAvg}`)

    const rawResults = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.assessments', 'assessment')
      .select([
        'user.id AS id',
        'user.full_name AS name'
      ])
      .addSelect('COUNT(assessment.id)', 'totalExams')
      .addSelect('SUM(assessment.grade)', 'sumGrades')
      .addSelect(`
      (
        (
          COALESCE(SUM(assessment.grade),0)
          +
          :m * :globalAvg
        )
        /
        (COUNT(assessment.id) + :m)
      )
    `, 'bayesianScore')
      .where('assessment.status = :status', { status: 'Finished' })
      .andWhere('assessment.grade IS NOT NULL')
      .andWhere('assessment.is_assigned = :assigned', { assigned })
      .setParameters({
        m,
        globalAvg
      })
      .groupBy('user.id')
      .addGroupBy('user.full_name')
      .orderBy('bayesianScore', 'DESC')
      .limit(3)
      .getRawMany();

      console.log(`raw many: ${rawResults}`)

    return rawResults.map(r => ({
      id: r.id,
      name: r.name,
      adjusted_score: Math.round(Number(r.bayesianScore))
    }));
  }

  public async getNumberOfUsers(): Promise<number> {
    return await this.userRepository.count();
  }

  public async getAllUsers(
    limit?: number,
    cursorName?: string,
    cursorId?: string,
    search?: string
  ): Promise<UserGetDTO[]> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.is_deleted = false')
      .select([
        'user.id',
        'user.full_name',
        'user.email',
        'user.role',
        'user.state',
      ])
      .orderBy('user.full_name', 'ASC')
      .addOrderBy('user.id', 'ASC');

    // Composite cursor
    if (cursorName && cursorId) {
      qb.andWhere(
        '(user.full_name > :cursorName OR (user.full_name = :cursorName AND user.id > :cursorId))',
        { cursorName, cursorId }
      );
    }

    if (search) {
      qb.andWhere(
        '(LOWER(user.full_name) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: `%${search.toLowerCase()}%` }
      );
    }

    if (limit) {
      qb.take(limit);
    }

    return await qb.getMany();
  }



  public async retrieveUser(id: string): Promise<User> {
    try {
      return await this.userRepository.findOne({ where: { id } });
    } catch (ex) {
      throw new CustomException(
        `User Service error while retrieving record: ${ex.message}`,
        ex.statusCode,
      );
    }
  }

  public async getUserByID(id: string): Promise<UserGetDTO> {
    try {
      const user = await this.retrieveUser(id);

      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        state: user.state,
      };
    } catch (ex) {
      throw new CustomException(
        `User Service retrieval error: ${ex.message}`,
        ex.statusCode,
      );
    }
  }

  public async setAdminRights(userInfo: UserRoleDTO): Promise<string> {
    try {
      const user = await this.retrieveUser(userInfo.id);
      user.role = userInfo.admin ? 'Admin' : 'User';
      await this.userRepository.save(user);

      return userInfo.admin ? 'Admin role provided.' : 'Admin role revoked.';
    } catch (ex) {
      throw new CustomException(
        `User Service error while setting admin rights: ${ex.message}`,
        ex.statusCode,
      );
    }
  }

  public async setActive(userInfo: UserActiveDTO): Promise<string> {
    try {
      const user = await this.retrieveUser(userInfo.id);
      user.state = userInfo.state ? 'Active' : 'Locked';
      await this.userRepository.save(user);

      return userInfo.state ? 'User activated.' : 'User deactivated.';
    } catch (ex) {
      throw new CustomException(
        `User Service error while activating user: ${ex.message}`,
        ex.statusCode,
      );
    }
  }

  public async resetPassword(userInfo: UserPassResetDTO): Promise<string> {
    try {
      const user = await this.retrieveUser(userInfo.id);
      user.password = await bcrypt.hash(userInfo.password, 10);
      await this.userRepository.save(user);

      return 'Password reset successfully.';
    } catch (ex) {
      throw new CustomException(
        `User Service error while resetting password: ${ex.message}`,
        ex.statusCode,
      );
    }
  }

  public async deleteUser(id: string): Promise<string> {
    try {
      const user = await this.retrieveUser(id);
      if (!user) {
        throw new CustomException(`User with id ${id} not found`, 404);
      }

      await this.userRepository.delete(id);

      return 'User deleted successfully.';
    } catch (ex) {
      throw new CustomException(
        `User Service error while deleting user: ${ex.message}`,
        ex.statusCode,
      );
    }
  }

}
