import { Inject, Injectable } from '@nestjs/common';
import { ARCJET, type ArcjetNest } from '@arcjet/nest';

/**
 * Thin wrapper around the Arcjet client for manual `protect()` calls
 * (e.g. per-request options like `requested` tokens or `email`).
 * Route-level protection is done by the global ArcjetGuard.
 */
@Injectable()
export class ArcjetService {
  constructor(@Inject(ARCJET) private readonly arcjet: ArcjetNest) {}

  get client(): ArcjetNest {
    return this.arcjet;
  }
}
