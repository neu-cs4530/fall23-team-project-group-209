import admin from 'firebase-admin';
import { cert } from 'firebase-admin/app';
import InvalidParametersError, {
  GAME_ID_MISSMATCH_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  INVALID_COMMAND_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  CardColor,
  GameInstance,
  InteractableCommand,
  InteractableCommandReturnType,
  InteractableType,
  PlayerData,
  UNOGameState,
  UNOMove,
} from '../../types/CoveyTownSocket';
// eslint-disable-next-line import/no-cycle
import GameArea from './GameArea';
import UNOGame from './UNOGame';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import serviceAccount from './leaderboard-Service-Keys.json' assert { type: 'json' };

admin.initializeApp({
  credential: cert(serviceAccount as admin.ServiceAccount),
  databaseURL: 'https://leaderboard-4cc7e-default-rtdb.firebaseio.com',
});

const db = admin.firestore();

const playerRef = db.collection('Players');

/**
 * A game Area that hosts an UNO game. The user sends commands to the model from the view,
 * and this class helps to process those commands and apply them to the model.
 */
export default class UNOGameArea extends GameArea<UNOGame> {
  protected getType(): InteractableType {
    return 'UNOArea';
  }

  /**
   * Informs all listeners that the state of the game has been changed by emitting,
   * also it checks to see if the new state of the game is over, and updates the database
   * if there is a winner
   * @param updatedState the updated state
   */
  private async _stateUpdated(updatedState: GameInstance<UNOGameState>) {
    if (updatedState.state.status === 'OVER') {
      if (updatedState.state.winner) {
        // there is a winner, updated winners wins, update losers losses
        const winnerID = updatedState.state.winner;
        const userName = this._getUser(winnerID);
        if (userName) {
          const winnerRef = playerRef.doc(userName);
          const doc = await winnerRef.get();
          const data = doc.data();
          const doesExist = doc.exists;
          if (doesExist && data && userName) {
            const currWins = data.wins;
            await winnerRef.update({
              wins: currWins + 1,
            });
          } else if (userName) {
            // winner player doesnt exist in firebase, we need to add it
            const winnerData = {
              id: winnerID,
              user: userName,
              wins: 1,
              loss: 0,
            };
            await playerRef.doc(userName).set(winnerData);
          }
          // now we need to incremenent losses for all other players
          const losers = this._determineLosersIDS(updatedState);
          losers.forEach(async loser => {
            const lossUser = this._getUser(loser);
            if (lossUser) {
              const loserRef = playerRef.doc(lossUser);
              const loserDoc = await loserRef.get();
              const loserData = loserDoc.data();
              const loserDocExists = loserDoc.exists;
              if (loserDocExists && loserData && lossUser) {
                const currLoss = loserData.loss;
                await loserRef.update({
                  loss: currLoss + 1,
                });
              } else if (lossUser) {
                const loserInfo = {
                  id: loser,
                  user: lossUser,
                  wins: 0,
                  loss: 1,
                };
                await playerRef.doc(lossUser).set(loserInfo);
              }
            }
          });
        }
      } else {
        // if there is no winner, statistics do not change for anyone
      }
    }
    this._emitAreaChanged();
  }

  /**
   * gets the username for the given id
   * @param id  id
   * @returns  username for id
   */
  private _getUser(id: string): string | undefined {
    const player = this.occupants.find(p => p.id === id);
    return player?.userName;
  }

  /**
   * returns the list of ID's for all of the losers of the game
   * @param updatedState the updated state with gameover
   * @returns  list of Ids'
   */
  private _determineLosersIDS(updatedState: GameInstance<UNOGameState>): string[] {
    const winnerID = updatedState.state.winner;
    const loserList: string[] = [];
    const { players } = updatedState.state;
    players.forEach(player => {
      if (player.id !== winnerID) {
        loserList.push(player.id);
      }
    });
    return loserList;
  }

  /**
   *  This private method helps to convert the collection to something the frontnend
   *  can use
   * @returns  a promise to a list of playerdata objects that are created from hhe datbase.
   */
  private async _createLeaderboardArray(): Promise<void> {
    const board: PlayerData[] = [];
    const querySnap = await playerRef.get();
    const listOfPlayers = querySnap.docs;
    listOfPlayers.forEach(player => {
      const pData = player.data();
      const playerData: PlayerData = { id: pData.id, wins: pData.wins, loss: pData.loss };
      board.push(playerData);
    });
    this._database = board;
  }

  /**
   * Handle a command from a player in this game area.
   * Supported commands:
   * - JoinGame (joins the game `this._game`, or creates a new one if none is in progress)
   * - GameMove(applyCard) (applies a move to the game, by placing a card down on top of top card)
   * - DrawCard (causes the player to draw a card from the draw deck)
   * - StartGame (starts the game with the amount of players in it if more than 1).
   * - LeaveGame (leaves the game)
   * - JoinAI (attempts to have an AI player join the game)
   * - ChangeColor (causes the players wildcard color to change, situation when wildcard or plus 4 is used)
   *
   * If the command ended the game, updates the database with information
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
   *  - Any command besides LeaveGame, 2 game moves, start game and JoinGame and changeColor and JoinAI: INVALID_COMMAND_MESSAGE
   */
  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    // Below we check for command types, validate the game is correct and intialized,
    // and apply the functions on the model, and call emitAreaChanged
    if (command.type === 'GameMove') {
      const game = this._game;
      this._validateGameInfo(game, command.gameID);
      game?.applyMove({
        gameID: command.gameID,
        playerID: player.id,
        move: command.move as UNOMove,
      });
      if (game) {
        this._stateUpdated(game.toModel());
      }
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'DrawCard') {
      const game = this._game;
      this._validateGameInfo(game, command.gameID);
      game?.drawCard(command.id);
      if (game) {
        this._stateUpdated(game.toModel());
      }
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'JoinGame') {
      let game = this._game;
      if (!game || game.state.status === 'OVER') {
        // no game in progress, make one
        game = new UNOGame();
        this._game = game;
      }
      game.join(player);
      this._stateUpdated(game.toModel());
      return { gameID: game.id } as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'LeaveGame') {
      const game = this._game;
      this._validateGameInfo(game, command.gameID);
      game?.leave(player);
      if (game) {
        this._stateUpdated(game.toModel());
      }
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'StartGame') {
      const game = this._game;
      this._validateGameInfo(game, command.gameID);
      game?.startGame();
      if (game) {
        this._stateUpdated(game.toModel());
        return { gameID: game.id } as InteractableCommandReturnType<CommandType>;
      }
    }
    if (command.type === 'JoinAI') {
      const game = this._game;
      this._validateGameInfo(game, command.gameID);
      game?.joinAI(command.difficulty);
      if (game) {
        this._stateUpdated(game.toModel());
        return { gameID: game.id } as InteractableCommandReturnType<CommandType>;
      }
    }
    if (command.type === 'ColorChange') {
      const game = this._game;
      this._validateGameInfo(game, command.gameID);
      game?.colorChange(command.color as CardColor);
      if (game) {
        this._stateUpdated(game.toModel());
      }
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    if (command.type === 'Leaderboard') {
      const game = this._game;
      this._validateGameInfo(game, command.gameID);
      if (game) {
        this._createLeaderboardArray();
      }
      return undefined as InteractableCommandReturnType<CommandType>;
    }
    throw new InvalidParametersError(INVALID_COMMAND_MESSAGE);
  }

  /**
   * abstracted helper to validate that the game is initialized and the
   * id given is for this game
   * @param game this game that may be undefined
   * @param id the id of the game trying to have the command sent
   */
  private _validateGameInfo(game: UNOGame | undefined, id: string): void {
    if (!game) {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
    if (this._game?.id !== id) {
      throw new InvalidParametersError(GAME_ID_MISSMATCH_MESSAGE);
    }
  }
}
