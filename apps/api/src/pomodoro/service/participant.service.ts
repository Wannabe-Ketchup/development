import { Injectable } from '@nestjs/common';
import { Participant } from '../domain/participant.entity';

@Injectable()
export class ParticipantService {
  createParticipant(nickname: string): Participant {
    throw new Error(
      `Not implemented: ParticipantService.createParticipant(${nickname})`,
    );
  }
}
