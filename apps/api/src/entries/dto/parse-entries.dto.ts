import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { trimString } from '../../auth/dto/normalize';

export const MAX_PARSE_TEXT_LENGTH = 1000;

export class ParseEntriesDto {
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @Length(1, MAX_PARSE_TEXT_LENGTH)
  text!: string;
}
