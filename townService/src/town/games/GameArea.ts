import Player from '../../lib/Player';
import {
  GameArea as GameAreaModel,
  GameResult,
  GameState,
  InteractableType,
  PlayerData,
} from '../../types/CoveyTownSocket';
import InteractableArea from '../InteractableArea';
import Game from './Game';

/**
 * A GameArea is an InteractableArea on the map that can host a game.
 * At any given point in time, there is at most one game in progress in a GameArea.
 */
export default abstract class GameArea<
  GameType extends Game<GameState, unknown>,
> extends InteractableArea {
  // this is added to the gameArea for UNOGameArea
  protected _database?: PlayerData[];

  protected _game?: GameType;

  protected _history: GameResult[] = [];

  public get game(): GameType | undefined {
    return this._game;
  }

  public get history(): GameResult[] {
    return this._history;
  }

  /**
   * Returns promise for list of all data from players in database
   */
  public get database(): PlayerData[] | undefined {
    return this._database;
  }

  public set database(db: PlayerData[] | undefined) {
    this._database = db;
  }

  public toModel(): GameAreaModel<GameType['state']> {
    return {
      id: this.id,
      game: this._game?.toModel(),
      history: this._history,
      occupants: this.occupantsByID,
      type: this.getType(),
      database: this._database,
    };
  }

  public get isActive(): boolean {
    return true;
  }

  protected abstract getType(): InteractableType;

  public remove(player: Player): void {
    if (this._game) {
      this._game.leave(player);
    }
    super.remove(player);
  }
}
