import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, ValidateIf } from 'class-validator';
import { trimString } from './normalize';

export class UpdateProfileDto {
  @ValidateIf((_dto: UpdateProfileDto, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @Length(1, 100)
  businessName?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @Length(1, 100)
  name?: string | null;
}
