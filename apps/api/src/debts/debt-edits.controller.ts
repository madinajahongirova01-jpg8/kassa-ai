import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import type { PublicUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CancelPaymentResultResponse, DebtResponse } from './debt.presenter';
import { DebtEditsService } from './debt-edits.service';
import { UpdateDebtDto } from './dto/update-debt.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class DebtEditsController {
  constructor(private readonly edits: DebtEditsService) {}

  @Patch('debts/:id')
  updateDebt(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDebtDto,
  ): Promise<DebtResponse> {
    return this.edits.updateDebt(user.id, id, dto);
  }

  @Post('payments/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelPayment(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CancelPaymentResultResponse> {
    return this.edits.cancelPayment(user.id, id);
  }
}
