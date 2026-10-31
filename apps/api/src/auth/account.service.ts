import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser } from './auth.service';
import { PublicUser } from './auth.types';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { hashPassword, verifyPassword } from './password';

export const WRONG_CURRENT_PASSWORD = 'currentPassword is incorrect';
export const SAME_NEW_PASSWORD = 'newPassword must differ from currentPassword';

function invalid(...details: string[]): BadRequestException {
  return new BadRequestException({ message: 'Validation failed', details });
}

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<{ user: PublicUser }> {
    if (dto.businessName === undefined && dto.name === undefined) {
      throw invalid('at least one of businessName, name is required');
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { businessName: dto.businessName, name: dto.name },
    });
    return { user: toPublicUser(user) };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ changed: true }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    if (user === null) {
      throw new NotFoundException('User not found');
    }
    if (!(await verifyPassword(user.passwordHash, dto.currentPassword))) {
      throw invalid(WRONG_CURRENT_PASSWORD);
    }
    if (dto.newPassword === dto.currentPassword) {
      throw invalid(SAME_NEW_PASSWORD);
    }
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(dto.newPassword) } });
    return { changed: true };
  }
}
