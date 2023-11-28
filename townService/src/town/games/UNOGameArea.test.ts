import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { createPlayerForTesting } from '../../TestUtils';
import InvalidParametersError, {
  GAME_FULL_MESSAGE,
  GAME_ID_MISSMATCH_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  INVALID_COMMAND_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  GameInstanceID,
  UNOGameState,
  UNOMove,
  TownEmitter,
  UNOPlayer,
  DrawCommand,
  ChangeColorCommand,
} from '../../types/CoveyTownSocket';
import UNOGameArea from './UNOGameArea';
import * as UNOGameModule from './UNOGame';
import Game from './Game';

// WHAT SHOULD THE TESTS BE NUMBERED AS??
// TEST FOR ENDING GAME

/**
 * this class is used to create a more simple version
 * of an UNOGame, so that testing is easier for the UNOGameArea
 */
class TestingUNOGame extends Game<UNOGameState, UNOMove> {
  public constructor() {
    super({
      moves: [],
      deck: [],
      players: [],
      topCard: undefined,
      status: 'WAITING_TO_START',
      currentPlayerIndex: 0,
      playDirection: 'clockwise',
      drawStack: 0,
    });
  }

  // below are the testing implementations of the necessary methods
  public applyMove(): void {}

  public drawCard(): void {}

  public startGame(): void {}

  public colorChange(): void {}

  public endGame(winner?: string) {
    this.state = {
      ...this.state,
      status: 'OVER',
      winner,
    };
  }

  protected _join(player: Player): void {
    // Check if the player is already in the game
    if (this.state.players.some(p => p.id === player.id)) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }
    // Check if there's room for the player to join
    if (this.state.players.length >= 4) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }

    // Convert Player to UNOPlayer
    const unoPlayer: UNOPlayer = {
      cards: [],
      id: player.id,
    };

    this.state.players = [...this.state.players, unoPlayer];
  }

  protected _leave(): void {}

  public joinAI(): void {}
}
describe('UNOGameArea', () => {
  // declare the important info for testing
  let gameArea: UNOGameArea;
  let player1: Player;
  let player2: Player;
  let player3: Player;
  let player4: Player;
  let interactableUpdateSpy: jest.SpyInstance;
  let game: TestingUNOGame;
  beforeEach(() => {
    const gameConstructorSpy = jest.spyOn(UNOGameModule, 'default');
    game = new TestingUNOGame();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Testing without using the real game class)
    gameConstructorSpy.mockReturnValue(game);

    player1 = createPlayerForTesting();
    player2 = createPlayerForTesting();
    player3 = createPlayerForTesting();
    player4 = createPlayerForTesting();
    gameArea = new UNOGameArea(
      nanoid(),
      { x: 0, y: 0, width: 100, height: 100 },
      mock<TownEmitter>(),
    );
    gameArea.add(player1);
    gameArea.add(player2);
    gameArea.add(player3);
    gameArea.add(player4);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore (Test requires access to protected method)
    interactableUpdateSpy = jest.spyOn(gameArea, '_emitAreaChanged');
  });
  describe('handleCommand', () => {
    describe('[] when given a JoinGame command', () => {
      describe('when there is no game in progress', () => {
        it('should create a new game and call _emitAreaChanged', () => {
          const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, player1);
          expect(gameID).toBeDefined();
          if (!game) {
            throw new Error('Game was not created by call to join game');
          }
          expect(gameID).toEqual(game.id);
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
        });
      });
      describe('when there is a game in progress', () => {
        it('should dispatch the join command to the game and _emitAreaChanged', () => {
          const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, player1);
          if (!game) {
            throw new Error('game was not created by call to joinGame');
          }
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);

          // now lets test for second join to game
          const joinSpy = jest.spyOn(game, 'join');
          const gameID2 = gameArea.handleCommand({ type: 'JoinGame' }, player2).gameID;
          expect(joinSpy).toHaveBeenCalledWith(player2);
          expect(gameID).toEqual(gameID2);
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(2);
        });
        it('shoudl not emit area change if the join game call throws error', () => {
          gameArea.handleCommand({ type: 'JoinGame' }, player1);
          if (!game) {
            throw new Error('game was not created by call to join game');
          }
          interactableUpdateSpy.mockClear();

          const joinSpy = jest.spyOn(game, 'join').mockImplementationOnce(() => {
            throw new Error('Test Error');
          });
          expect(() => gameArea.handleCommand({ type: 'JoinGame' }, player2)).toThrowError(
            'Test Error',
          );
          expect(joinSpy).toHaveBeenCalledWith(player2);
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
        });
      });
    });
    describe('[] when given a GameMove command', () => {
      it('should throw an error when there is no game in progress', () => {
        expect(() =>
          gameArea.handleCommand(
            {
              type: 'GameMove',
              gameID: nanoid(),
              move: { player: player1.id, card: { color: 'Blue', rank: 1 } },
            },
            player1,
          ),
        ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
      });
      describe('when there is a game in progress', () => {
        let gameID: GameInstanceID;
        beforeEach(() => {
          // start a full game of players
          gameID = gameArea.handleCommand({ type: 'JoinGame' }, player1).gameID;
          gameArea.handleCommand({ type: 'JoinGame' }, player2);
          gameArea.handleCommand({ type: 'JoinGame' }, player3);
          gameArea.handleCommand({ type: 'JoinGame' }, player4);
          interactableUpdateSpy.mockClear();
        });
        it('should throw error if gameID doesnt match', () => {
          expect(() =>
            gameArea.handleCommand(
              {
                type: 'GameMove',
                gameID: nanoid(),
                move: { player: player1.id, card: { color: 'Blue', rank: 1 } },
              },
              player1,
            ),
          ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
        });
        it('should dispatch move to game and call _emitAreaChanged', () => {
          const move: UNOMove = { player: player1.id, card: { color: 'Blue', rank: 1 } };
          const applyMoveSpy = jest.spyOn(game, 'applyMove');
          gameArea.handleCommand({ type: 'GameMove', move, gameID }, player1);
          expect(applyMoveSpy).toHaveBeenCalledWith({
            gameID: game.id,
            playerID: player1.id,
            move,
          });
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
        });
        it('should not call _emitAreaChanged if the game throws error', () => {
          const move: UNOMove = { player: player1.id, card: { color: 'Blue', rank: 1 } };
          const applyMoveSpy = jest.spyOn(game, 'applyMove').mockImplementationOnce(() => {
            throw new Error('Test Error');
          });
          expect(() =>
            gameArea.handleCommand({ type: 'GameMove', move, gameID }, player1),
          ).toThrowError('Test Error');
          expect(applyMoveSpy).toHaveBeenCalledWith({
            gameID: game.id,
            playerID: player1.id,
            move,
          });
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
        });
        describe('when the game is over, ....', () => {
          test('when there is a winner', () => {
            // nothing for now
          });
          test('when there is no winner', () => {
            // nothing for now
          });
        });
      });
    });
    describe('[] when given a drawCard command', () => {
      it('should throw an error when there is no game in progress', () => {
        expect(() =>
          gameArea.handleCommand({ type: 'DrawCard', gameID: nanoid(), id: player1.id }, player1),
        ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
      });
      describe('when there is a game in progress', () => {
        let gameID: GameInstanceID;
        beforeEach(() => {
          // start a full game of players
          gameID = gameArea.handleCommand({ type: 'JoinGame' }, player1).gameID;
          gameArea.handleCommand({ type: 'JoinGame' }, player2);
          gameArea.handleCommand({ type: 'JoinGame' }, player3);
          gameArea.handleCommand({ type: 'JoinGame' }, player4);
          interactableUpdateSpy.mockClear();
        });
        it('should throw an error when the game ID doesnt match', () => {
          expect(() =>
            gameArea.handleCommand({ type: 'DrawCard', gameID: nanoid(), id: player1.id }, player1),
          ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
        });
        it('should dispatch the draw card call to the game and call emitter', () => {
          const draw: DrawCommand = { type: 'DrawCard', gameID, id: player1.id };
          const drawCardSpy = jest.spyOn(game, 'drawCard');
          gameArea.handleCommand(draw, player1);
          expect(drawCardSpy).toHaveBeenCalledWith(player1.id);
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
        });
        it('should not call _emitAreaChanged if the game throws error', () => {
          const draw: DrawCommand = { type: 'DrawCard', gameID, id: player1.id };
          const drawCardSpy = jest.spyOn(game, 'drawCard').mockImplementationOnce(() => {
            throw new Error('Test Error');
          });
          expect(() => gameArea.handleCommand(draw, player1)).toThrowError('Test Error');
          expect(drawCardSpy).toHaveBeenCalledWith(player1.id);
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
        });
      });
    });
    describe('[] when given a ChangeColor command', () => {
      describe('when there is no game in progress', () => {
        it('should throw an error', () => {
          expect(() =>
            gameArea.handleCommand(
              { type: 'ColorChange', gameID: nanoid(), color: 'Red' },
              player1,
            ),
          ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
        });
      });
      describe('when there is a game in progress', () => {
        let gameID: GameInstanceID;
        beforeEach(() => {
          // start a full game of players
          gameID = gameArea.handleCommand({ type: 'JoinGame' }, player1).gameID;
          gameArea.handleCommand({ type: 'JoinGame' }, player2);
          gameArea.handleCommand({ type: 'JoinGame' }, player3);
          gameArea.handleCommand({ type: 'JoinGame' }, player4);
          interactableUpdateSpy.mockClear();
        });
        it('should throw an error when the gameID does not match', () => {
          expect(() =>
            gameArea.handleCommand(
              { type: 'ColorChange', gameID: nanoid(), color: 'Red' },
              player1,
            ),
          ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
        });
        it('should dispatch the change color call and call emitter', () => {
          const colorChangeCommand: ChangeColorCommand = {
            type: 'ColorChange',
            gameID,
            color: 'Red',
          };
          const ccSpy = jest.spyOn(game, 'colorChange');
          gameArea.handleCommand(colorChangeCommand, player1);
          expect(ccSpy).toBeCalledWith('Red');
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
        });
        it('should not call _emitAreaChanged if the game throws error', () => {
          const colorChangeCommand: ChangeColorCommand = {
            type: 'ColorChange',
            gameID,
            color: 'Red',
          };
          const ccSpy = jest.spyOn(game, 'colorChange').mockImplementationOnce(() => {
            throw new Error('Test Error');
          });
          expect(() => gameArea.handleCommand(colorChangeCommand, player1)).toThrowError(
            'Test Error',
          );
          expect(ccSpy).toHaveBeenCalledWith('Red');
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
        });
      });
    });
    describe('[] when given a LeaveGame command', () => {
      describe('when there is no game in progress', () => {
        it('should throw an error', () => {
          expect(() =>
            gameArea.handleCommand({ type: 'LeaveGame', gameID: nanoid() }, player1),
          ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
        });
      });
      describe('when there is a game in progress', () => {
        it('should throw an error when the game ID does not match', () => {
          gameArea.handleCommand({ type: 'JoinGame' }, player1);
          interactableUpdateSpy.mockClear();
          expect(() =>
            gameArea.handleCommand({ type: 'LeaveGame', gameID: nanoid() }, player1),
          ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
        });
        it('should dispatch the leave command to the game, call emiter', () => {
          const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, player1);
          if (!game) {
            throw new Error('game not created by first join');
          }
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
          const leaveSpy = jest.spyOn(game, 'leave');
          gameArea.handleCommand({ type: 'LeaveGame', gameID }, player1);
          expect(leaveSpy).toHaveBeenCalledWith(player1);
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(2);
        });
        it('should not call _emitAreaChanged if the game throws an error', () => {
          gameArea.handleCommand({ type: 'JoinGame' }, player1);
          if (!game) {
            throw new Error('Game was not created by the first join');
          }
          interactableUpdateSpy.mockClear();
          const leaveSpy = jest.spyOn(game, 'leave').mockImplementationOnce(() => {
            throw new Error('Test Error');
          });
          expect(() =>
            gameArea.handleCommand({ type: 'LeaveGame', gameID: game.id }, player1),
          ).toThrowError('Test Error');
          expect(leaveSpy).toHaveBeenCalledWith(player1);
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
        });
        it('should do something if the game is over', () => {
          // TEST LATER
        });
      });
    });
    describe('[] when given a Start Game Command', () => {
      describe('when there is no game in progress', () => {
        it('should throw an error', () => {
          expect(() =>
            gameArea.handleCommand({ type: 'StartGame', gameID: nanoid() }, player1),
          ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
        });
      });
      describe('when there is a game in progess', () => {
        it('should throw an error when gameID doesnt match', () => {
          gameArea.handleCommand({ type: 'JoinGame' }, player1);
          interactableUpdateSpy.mockClear();
          expect(() =>
            gameArea.handleCommand({ type: 'StartGame', gameID: nanoid() }, player1),
          ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
        });
        it('should dispatch the start game command to game and call emitter', () => {
          const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, player1);
          if (!game) {
            throw new Error('Game was not created by the first call to join');
          }
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
          const startSpy = jest.spyOn(game, 'startGame');
          gameArea.handleCommand({ type: 'StartGame', gameID }, player1);
          expect(startSpy).toHaveBeenCalled();
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(2);
        });
        it('should not emit Area changed if the game throws an error', () => {
          gameArea.handleCommand({ type: 'JoinGame' }, player1);
          if (!game) {
            throw new Error('game not created by first join call');
          }
          interactableUpdateSpy.mockClear();
          const startSpy = jest.spyOn(game, 'startGame').mockImplementationOnce(() => {
            throw new Error('Test Error');
          });
          expect(() =>
            gameArea.handleCommand({ type: 'StartGame', gameID: game.id }, player1),
          ).toThrowError('Test Error');
          expect(startSpy).toHaveBeenCalled();
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
        });
      });
    });
    describe('[] when given a JoinAI Command', () => {
      describe('when there is no game in progress', () => {
        it('should throw an error', () => {
          expect(() =>
            gameArea.handleCommand(
              { type: 'JoinAI', gameID: nanoid(), difficulty: 'Easy' },
              player1,
            ),
          ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
        });
      });
      describe('when there is a game in progress', () => {
        it('should throw an error when gameID doenst match', () => {
          gameArea.handleCommand({ type: 'JoinGame' }, player1);
          interactableUpdateSpy.mockClear();
          expect(() =>
            gameArea.handleCommand(
              { type: 'JoinAI', gameID: nanoid(), difficulty: 'Easy' },
              player1,
            ),
          ).toThrowError(GAME_ID_MISSMATCH_MESSAGE);
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
        });
        it('should dispatch joinAI command and call emitter', () => {
          const { gameID } = gameArea.handleCommand({ type: 'JoinGame' }, player1);
          if (!game) {
            throw new Error('Game was not created by the first call to join');
          }
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(1);
          const joinAISpy = jest.spyOn(game, 'joinAI');
          gameArea.handleCommand({ type: 'JoinAI', gameID, difficulty: 'Easy' }, player1);
          expect(joinAISpy).toHaveBeenCalledWith('Easy');
          expect(interactableUpdateSpy).toHaveBeenCalledTimes(2);
        });
        it('should not emit area changed if there game throws error', () => {
          gameArea.handleCommand({ type: 'JoinGame' }, player1);
          if (!game) {
            throw new Error('game not created by first join call');
          }
          interactableUpdateSpy.mockClear();
          const joinAISpy = jest.spyOn(game, 'joinAI').mockImplementationOnce(() => {
            throw new Error('Test Error');
          });
          expect(() =>
            gameArea.handleCommand(
              { type: 'JoinAI', gameID: game.id, difficulty: 'Easy' },
              player1,
            ),
          ).toThrowError('Test Error');
          expect(joinAISpy).toHaveBeenCalledWith('Easy');
          expect(interactableUpdateSpy).not.toHaveBeenCalled();
        });
      });
    });
    describe('[] when given an invalid command', () => {
      it('should throw an error', () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore (Testing an invalid command, only possible at the boundary of the type system)
        expect(() => gameArea.handleCommand({ type: 'InvalidCommand' }, player1)).toThrowError(
          INVALID_COMMAND_MESSAGE,
        );
        expect(interactableUpdateSpy).not.toHaveBeenCalled();
      });
    });
  });
});
