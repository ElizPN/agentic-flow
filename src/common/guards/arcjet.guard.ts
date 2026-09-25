import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import type { Primitive, Product } from '@arcjet/nest';
import { ARCJET_RULES } from '../decorators/arcjet-rules.decorator';
import { ArcjetService } from '../../lib/arcjet/arcjet.service';

@Injectable()
export class ArcjetGuard implements CanActivate {
  private readonly logger = new Logger(ArcjetGuard.name);

  constructor(
    private readonly arcjet: ArcjetService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const extraRules =
      this.reflector.getAllAndMerge<Array<Primitive | Product>>(ARCJET_RULES, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    const aj = extraRules.reduce(
      (client, rule) => client.withRule(rule),
      this.arcjet.client,
    );

    const req = context.switchToHttp().getRequest<Request>();
    const decision = await aj.protect(req);

    if (decision.isErrored()) {
      // Fail open: an Arcjet outage must not take the API down.
      this.logger.error(`Arcjet error: ${decision.reason.message}`);
      return true;
    }

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const res = context.switchToHttp().getResponse<Response>();
        res.setHeader('Retry-After', Math.max(1, decision.reason.reset));
        throw new HttpException(
          'Too many requests',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (decision.reason.isBot()) {
        throw new ForbiddenException('Automated clients are not allowed');
      }
      throw new ForbiddenException();
    }

    return true;
  }
}
