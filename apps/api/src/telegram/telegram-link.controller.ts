import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { PublicUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LinkTelegramDto } from './dto/link-telegram.dto';
import { TelegramLinkService, TelegramLinkStatus } from './telegram-link.service';

@Controller('telegram/link')
export class TelegramLinkController {
  constructor(private readonly links: TelegramLinkService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  status(@CurrentUser() user: PublicUser): Promise<TelegramLinkStatus> {
    return this.links.status(user.id);
  }

  /** Same per-IP limit as login, plus a per-user limit on wrong codes kept in the database. */
  @Post()
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  link(@CurrentUser() user: PublicUser, @Body() dto: LinkTelegramDto): Promise<TelegramLinkStatus> {
    return this.links.link(user.id, dto.code);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  unlink(@CurrentUser() user: PublicUser): Promise<void> {
    return this.links.unlink(user.id);
  }
}
