import InvalidParametersError, {
  GAME_ID_MISSMATCH_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  INVALID_COMMAND_MESSAGE,
  GAME_IN_PROGRESS_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  GameInstance,
  InteractableCommand,
  InteractableCommandReturnType,
  InteractableType,
  UNOGameState,
  UNOMove,
} from '../../types/CoveyTownSocket';
import GameArea from './GameArea';
import UNOGame from './UNOGame';
// CHECK LINE 52 TO ASK ABOUT HOW TO HANDLE 2 TYPES OF MOVE??????
// CHECK LINE 23 FOR HANDLING HISTORY
// CHECK JOIN GAME PORTION OF HANDLE COMMAND
export default class TicTacToeGameArea extends GameArea<UNOGame> {
  protected getType(): InteractableType {
    return 'UNOArea';
  }

  /**
   * Informs all listeners that the state of the game has been changed by emitting,
   * also it checks to see if the new state of the game is over, and updates the history
   * @param updatedState the updated state
   */
  private _stateUpdated(updatedState: GameInstance<UNOGameState>) {
    console.log(`updating state`);
    if (updatedState.state.status === 'OVER') {
      // determine how we want to handle the history situation
    }
    this._emitAreaChanged();
    console.log('emitted area change');
  }

  /**
   * Handle a command from a player in this game area.
   * Supported commands:
   * - JoinGame (joins the game `this._game`, or creates a new one if none is in progress)
   * - GameMove(applyCard) (applies a move to the game, by placing a card down on top of top card)
   * - GameMove(drawCard) (applied a move to the game, by drawing a card from the drawable deck)
   * - StartGame (starts the game with the amount of players in it if more than 1).
   * - LeaveGame (leaves the game)
   *
   * If the command ended the game, records the outcome in this._history
   * If the command is successful (does not throw an error), calls this._emitAreaChanged (necessary
   *  to notify any listeners of a state update, including any change to history)
   * If the command is unsuccessful (throws an error), the error is propagated to the caller
   *
   * @see InteractableCommand
   *
   * @param command command to handle
   * @param player player making the request
   * @returns response to the command, @see InteractableCommandResponse
   * @throws InvalidParametersError if the command is not supported or is invalid. Invalid commands:
   *  - LeaveGame, GameMove, StartGame: No game in progress (GAME_NOT_IN_PROGRESS_MESSAGE),
   *        or gameID does not match the game in progress (GAME_ID_MISSMATCH_MESSAGE)
   *  - Any command besides LeaveGame, 2 game moves, start game and JoinGame: INVALID_COMMAND_MESSAGE
   */
  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    if (command.type === 'GameMove') {
      const game = this._game;
      if (!game) {
        throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
      }
      if (this._game?.id !== command.gameID) {
        throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
      }
      game.applyMove({
        gameID: command.gameID,
        playerID: player.id,
        move: command.move as UNOMove, // gonna need to sort this out
      });
      this._stateUpdated(game.toModel());
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'JoinGame') {
      let game = this._game;
      if (!game || game.state.status === 'OVER') {
        // no game in progress, make one
        game = new UNOGame(); // initial state????
        this._game = game; // what if the game is in progress, will button not be displayed???
      }
      game.join(player);
      this._stateUpdated(game.toModel());
      console.log('finished and returning');
      return { gameID: game.id } as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'LeaveGame') {
      const game = this._game;
      if (!game) {
        throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
      }
      if (this._game?.id !== command.gameID) {
        throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
      }
      game.leave(player);
      this._stateUpdated(game.toModel());
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'StartGame') {
      const game = this._game;
      if (!game) {
        throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
      }
      if (this._game?.id !== command.gameID) {
        throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
      }
      if (game && game.state.status !== 'WAITING_TO_START') {
        throw new InvalidParametersError(GAME_IN_PROGRESS_MESSAGE);
      }
      // should validity of start game be checked in method call??? probably
      game.startGame();
      this._stateUpdated(game.toModel());
      return { gameID: game.id } as InteractableCommandReturnType<CommandType>;
    }
    throw new InvalidParametersError(INVALID_COMMAND_MESSAGE);
  }
}
