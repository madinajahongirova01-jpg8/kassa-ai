import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { trimString } from '../../auth/dto/normalize';

export class LinkTelegramDto {
  // Format is checked by LinkService (8 characters, an optional dash and spaces are ignored).
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code!: string;
}
