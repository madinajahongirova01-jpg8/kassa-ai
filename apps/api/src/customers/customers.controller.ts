import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import type { PublicUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomerResponse, CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: PublicUser, @Body() dto: CreateCustomerDto): Promise<CustomerResponse> {
    return this.customers.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: PublicUser): Promise<CustomerResponse[]> {
    return this.customers.list(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: PublicUser, @Param('id', ParseUUIDPipe) id: string): Promise<CustomerResponse> {
    return this.customers.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: PublicUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerResponse> {
    return this.customers.update(user.id, id, dto);
  }
}
