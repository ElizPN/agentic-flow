import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  ArcjetGuard,
  ArcjetModule as ArcjetSdkModule,
  detectBot,
  shield,
  slidingWindow,
} from '@arcjet/nest';
import { ArcjetService } from './arcjet.service';

@Global()
@Module({
  imports: [
    ArcjetSdkModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        key: config.getOrThrow<string>('ARCJET_KEY'),
        // Default rules for every route. Add per-route rules with @WithArcjetRules().
        rules: [
          shield({ mode: 'LIVE' }),
          // DRY_RUN: this is an API, so non-browser clients are legitimate.
          // Review decisions in the Arcjet console before switching to LIVE.
          detectBot({ mode: 'DRY_RUN', allow: ['CATEGORY:SEARCH_ENGINE'] }),
          // Sliding window, not tokenBucket: the global guard passes no
          // `requested` count, which tokenBucket requires on every call.
          slidingWindow({
            mode: 'LIVE',
            interval: 10, // seconds
            max: 10, // requests per interval per client
          }),
        ],
      }),
    }),
  ],
  providers: [
    ArcjetService,
    // Runs Arcjet protection on every request.
    { provide: APP_GUARD, useClass: ArcjetGuard },
  ],
  exports: [ArcjetService],
})
export class ArcjetModule {}
