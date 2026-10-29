import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { ValidateBy, ValidationArguments, ValidationOptions } from 'class-validator';
import { isCalendarDate } from './dates';
import { formatDirams, MAX_AMOUNT_DIRAMS, parseSomoni } from './money';

export function IsCalendarDate(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isCalendarDate',
      validator: {
        validate: (value: unknown) => isCalendarDate(value),
        defaultMessage: () => '$property must be a valid date in YYYY-MM-DD format',
      },
    },
    options,
  );
}

/**
 * Accepts a somoni amount ("150.50" or 150.5) and converts it to integer dirams.
 * After validation the decorated property holds dirams, not somoni.
 */
export function IsSomoniAmount(): PropertyDecorator {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) => (value === undefined ? undefined : (parseSomoni(value) ?? Number.NaN))),
    ValidateBy({
      name: 'isSomoniAmount',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_AMOUNT_DIRAMS,
        defaultMessage: ({ value }: ValidationArguments) => {
          if (typeof value !== 'number' || !Number.isInteger(value)) {
            return '$property must be an amount in somoni with at most 2 decimal places, for example "150.50"';
          }
          return value < 1
            ? '$property must be greater than 0'
            : `$property must not exceed ${formatDirams(MAX_AMOUNT_DIRAMS)}`;
        },
      },
    }),
  );
}
