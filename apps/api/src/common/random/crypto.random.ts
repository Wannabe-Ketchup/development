import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { Random } from './random';

@Injectable()
export class CryptoRandom extends Random {
  nextInt(bound: number): number {
    return crypto.randomInt(bound);
  }
}
