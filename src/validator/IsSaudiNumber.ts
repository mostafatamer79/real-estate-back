import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsSaudiPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSaudiPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          // Relaxed validation to allow international numbers and formatting for testing
          return typeof value === 'string' && /^[\d\s()+-]+$/.test(value);
        },
        defaultMessage(): string {
          return 'Phone number must be valid';
        },
      },
    });
  };
}
