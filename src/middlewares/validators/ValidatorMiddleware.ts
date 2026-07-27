import { ClassTransformOptions, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { NextFunction, Request, Response } from 'express';
import { BadRequestError } from '../../errors';

export default class ValidatorMiddleware {
  constructor(
    private readonly _class: any,
    private readonly options?: ClassTransformOptions,
  ) {
    this.executeBody = this.executeBody.bind(this);
    this.executeQuery = this.executeQuery.bind(this);
    this.executeParams = this.executeParams.bind(this);
  }

  private async executeBody(req: Request<any, any, any, any, any>, _: Response, next: NextFunction) {
    req.body = await this.validation({ dataToValidate: req.body, validationClass: this._class });
    next();
  }

  private async executeParams(req: Request<any, any, any, any, any>, _: Response, next: NextFunction) {
    req.params = await this.validation({ dataToValidate: req.params, validationClass: this._class });
    next();
  }

  private async executeQuery(req: Request<any, any, any, any, any>, _: Response, next: NextFunction) {
    req.query = await this.validation({ dataToValidate: req.query, validationClass: this._class });
    next();
  }

  async validation({ dataToValidate, validationClass }: { dataToValidate: any; validationClass: any }) {
    const transformedData = plainToInstance(validationClass, dataToValidate, {
      excludeExtraneousValues: true,
      exposeUnsetFields: false,
    });

    const errors = await validate(transformedData);
    if (errors.length > 0) {
      let message = '';
      if (errors[0] && errors[0].constraints) {
        const keys = Object.keys(errors[0].constraints || {});
        message += errors[0].constraints[keys[0]] + ' ';
        message += `. But we got ${typeof errors[0].value}`;
      }
      throw new BadRequestError(`BAD REQUEST: ${message}`, 'validator validation', { errors });
    }

    return transformedData;
  }

  static validateBody(_class: any) {
    return new ValidatorMiddleware(_class).executeBody;
  }

  static validateQuery(_class: any) {
    return new ValidatorMiddleware(_class).executeQuery;
  }
  static validateParams(_class: any) {
    return new ValidatorMiddleware(_class).executeParams;
  }
}
