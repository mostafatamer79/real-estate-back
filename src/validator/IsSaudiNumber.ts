import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsSaudiPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSaudiPhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return typeof value === 'string' && /^05\d{8}$/.test(value);
        },
        defaultMessage(): string {
          return 'Phone number must start with 05 and be 10 digits long';
        },
      },
    });
  };
}
