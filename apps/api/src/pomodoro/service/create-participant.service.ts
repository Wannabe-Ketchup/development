import { Injectable } from '@nestjs/common';
import { Participant } from '../domain/participant.entity';
import * as crypto from 'crypto';

@Injectable()
export class CreateParticipantService {
  public create(nickname: string, joinedAt: string): Participant {
    const id = crypto.randomUUID();
    return Participant.create(id, nickname, joinedAt);
  }
}
