import InvalidParametersError, {
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  BOARD_POSITION_NOT_EMPTY_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import { GameMove, UNOGameState, UNOMove } from '../../types/CoveyTownSocket';
import Game from './Game';

/**
 * @see README.md (and scroll to the section added at the bottom talking about rule changes.)
 * Everything is outlined further here as needed.
 */
export default class UNOGame extends Game<UNOGameState, UNOMove> {
  public constructor() {
    super({
      moves: [],
      status: 'WAITING_TO_START',
      deck: [],
      players: [],
      topCard: undefined,
      cardsToBePickedUp: undefined,
      isPractice: false,
    });
  }

  public applyMove(move: GameMove<UNOMove>): void {
    // testing commit integrity
  }

  public _join(player: Player): void {
    // player can join the game. This is what happens when player joins game.
  }

  protected _leave(player: Player): void {
    // if player choses to leave game, this is what will happen.
  }
}
