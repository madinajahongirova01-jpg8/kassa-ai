import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AccountService } from './account.service';
import { AuthService } from './auth.service';
import type { AuthResult, ChangePasswordResult, PublicUser } from './auth.types';
import { CurrentUser } from './current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly account: AccountService,
  ) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto): Promise<AuthResult> {
    return this.auth.register(dto);
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.auth.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: PublicUser): { user: PublicUser } {
    return { user };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@CurrentUser() user: PublicUser, @Body() dto: UpdateProfileDto): Promise<{ user: PublicUser }> {
    return this.account.updateProfile(user.id, dto);
  }

  @Post('change-password')
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  changePassword(@CurrentUser() user: PublicUser, @Body() dto: ChangePasswordDto): Promise<ChangePasswordResult> {
    return this.account.changePassword(user.id, dto);
  }
}
