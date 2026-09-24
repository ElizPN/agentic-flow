import { SetMetadata } from '@nestjs/common';
import type { Primitive, Product } from '@arcjet/nest';

export const ARCJET_RULES = 'arcjet:rules';

/**
 * Adds Arcjet rules on top of the global defaults for a controller or handler.
 * Replaces the SDK's `@WithArcjetRules`, whose metadata key is private and
 * therefore invisible to our custom ArcjetGuard.
 */
export const ArcjetRules = (rules: Array<Primitive | Product>) =>
  SetMetadata(ARCJET_RULES, rules);
