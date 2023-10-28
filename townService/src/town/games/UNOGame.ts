import Player from '../../lib/Player';
import { GameMove, UNOGameState, UNOMove } from '../../types/CoveyTownSocket';
import Game from './Game';

export default class UNOGame extends Game<UNOGameState, UNOMove> {
  public applyMove(move: GameMove<UNOMove>): void {}

  public _join(player: Player): void {}

  protected _leave(player: Player): void {}
}
