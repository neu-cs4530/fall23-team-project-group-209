import { nanoid } from 'nanoid';
import {
  Card,
  GameArea,
  GameResult,
  GameStatus,
  PlayerData,
  UNOGameState,
  UNOMove,
  UNOPlayer,
} from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import TownController from '../TownController';
import GameAreaController from './GameAreaController';
import UNOAreaController, { GAME_ALREADY_IN_PROGRESS } from './UNOAreaController';
import { mock } from 'jest-mock-extended';
import assert from 'assert';
import { NO_GAME_IN_PROGRESS_ERROR, PLAYER_NOT_IN_GAME_ERROR } from './TicTacToeAreaController';
//DETERMINE TESTING LABELS

describe('[] UNOAreaController', () => {
  // below is the set up for controller testing
  const ourPlayer = new PlayerController(nanoid(), 'player', {
    x: 0,
    y: 0,
    moving: false,
    rotation: 'front',
  });
  const otherPlayers = [
    new PlayerController(nanoid(), nanoid(), { x: 0, y: 0, moving: false, rotation: 'front' }),
    new PlayerController(nanoid(), nanoid(), { x: 0, y: 0, moving: false, rotation: 'front' }),
    new PlayerController(nanoid(), nanoid(), { x: 0, y: 0, moving: false, rotation: 'front' }),
    new PlayerController(nanoid(), nanoid(), { x: 0, y: 0, moving: false, rotation: 'front' }),
  ];

  const mockTownController = mock<TownController>();
  Object.defineProperty(mockTownController, 'ourPlayer', {
    get: () => ourPlayer,
  });
  Object.defineProperty(mockTownController, 'players', {
    get: () => [ourPlayer, ...otherPlayers],
  });
  mockTownController.getPlayer.mockImplementation(playerID => {
    const p = mockTownController.players.find(player => player.id === playerID);
    assert(p);
    return p;
  });

  const mockDatabase = mock<PlayerData[]>();

  function UNOAreaControllerWithProp({
    _id,
    history,
    moves,
    deck,
    players,
    topCard,
    currentPlayerIndex,
    playDirection,
    drawStack,
    winner,
    status,
    undefinedGame,
  }: {
    _id?: string;
    history?: GameResult[];
    moves?: ReadonlyArray<UNOMove>;
    deck?: Card[];
    players?: ReadonlyArray<UNOPlayer>;
    topCard?: Card;
    currentPlayerIndex?: number;
    playDirection?: 'clockwise' | 'counterclockwise';
    drawStack?: number;
    winner?: string;
    status?: GameStatus;
    undefinedGame?: boolean;
  }) {
    const id = _id || nanoid();
    const occs: string[] = [];
    if (players) {
      players.forEach(player => {
        occs.push(player.id);
      });
    }
    const ret = new UNOAreaController(
      id,
      {
        id,
        occupants: occs,
        history: history || [],
        type: 'UNOArea',
        database: mockDatabase,
        game: undefinedGame
          ? undefined
          : {
              id,
              players: occs,
              state: {
                status: status || 'IN_PROGRESS',
                players: players || [],
                moves: moves || [],
                winner: winner,
                drawStack: drawStack || 0,
                deck: deck || [],
                topCard: topCard,
                currentPlayerIndex: currentPlayerIndex || 0,
                playDirection: playDirection || 'clockwise',
              },
            },
      },
      mockTownController,
    );
    if (occs) {
      ret.occupants = occs
        .map(eachID => mockTownController.players.find(eachPlayer => eachPlayer.id === eachID))
        .filter(eachPlayer => eachPlayer) as PlayerController[];
    }
    return ret;
  }
  describe('[]', () => {
    describe('isActive', () => {
      it('should return true if the game is in progress', () => {
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
        });
        expect(controller.isActive()).toBe(true);
      });
      it('should return false if the game is over', () => {
        const controller = UNOAreaControllerWithProp({
          status: 'OVER',
        });
        expect(controller.isActive()).toBe(false);
      });
      it('should return false if the game is waiting', () => {
        const controller = UNOAreaControllerWithProp({
          status: 'WAITING_TO_START',
        });
        expect(controller.isActive()).toBe(false);
      });
    });
    describe('isPlayer', () => {
      it('should return true if the current player is a player in this game', () => {
        const ourUNOPlayer: UNOPlayer = { cards: [], id: ourPlayer.id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer],
        });
        expect(controller.isPlayer).toBe(true);
      });
      it('should return false if the current player is not in the game', () => {
        const otherUNOPlayer: UNOPlayer = { cards: [], id: otherPlayers[0].id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [otherUNOPlayer],
        });
        expect(controller.isPlayer).toBe(false);
      });
    });
    describe('status', () => {
      it('should return the status of the game', () => {
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
        });
        expect(controller.status).toBe('IN_PROGRESS');
      });
      it('shouild return WAITING_TO_START if undefined game', () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
        expect(controller.status).toBe('WAITING_TO_START');
      });
    });
    describe('whoseTurn', () => {
      it('should return the player whos turn it is ', () => {
        const ourUNOPlayer: UNOPlayer = { cards: [], id: ourPlayer.id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer],
        });
        expect(controller.whoseTurn).toBe(ourPlayer);
      });
      it('should return undefined if the game is not in progress', () => {
        const ourUNOPlayer: UNOPlayer = { cards: [], id: ourPlayer.id };
        const controller = UNOAreaControllerWithProp({
          status: 'OVER',
          players: [ourUNOPlayer],
        });
        expect(controller.whoseTurn).toBe(undefined);
      });
      it('should return undefined if game is undefined', () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
        expect(controller.whoseTurn).toBe(undefined);
      });
    });
    describe('isOurTurn', () => {
      it('should return true if it is our turn', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer],
          currentPlayerIndex: 0,
        });
        expect(controller.isOurTurn).toBe(true);
      });
      it('should return false if another players turn', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const otherUNOPlayer = { cards: [], id: otherPlayers[0].id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [otherUNOPlayer, ourUNOPlayer],
          currentPlayerIndex: 0,
        });
        expect(controller.isOurTurn).toBe(false);
      });
      it('should return false if the game isnt initialized', () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
        expect(controller.isOurTurn).toBe(false);
      });
    });
    describe('player1', () => {
      it('should return player1 if there is one', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const otherUNOPlayer = { cards: [], id: otherPlayers[0].id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer, otherUNOPlayer],
        });
        expect(controller.player1).toBe(ourPlayer);
      });
      it('should return undefined if there is no player1, and game waiting to start', () => {
        const controller = UNOAreaControllerWithProp({
          status: 'WAITING_TO_START',
        });
        expect(controller.player1).toBe(undefined);
      });
      it('should return undefined if the game is not initialized', () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
        expect(controller.player1).toBe(undefined);
      });
      it('should return undefined if there is no player1', () => {
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
        });
        expect(controller.player1).toBe(undefined);
      });
    });
    describe('player2', () => {
      it('should return player2 if there is one', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const otherUNOPlayer = { cards: [], id: otherPlayers[0].id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer, otherUNOPlayer],
        });
        expect(controller.player2).toBe(otherPlayers[0]);
      });
      it('should return undefined if there is no player2, and game waiting to start', () => {
        const controller = UNOAreaControllerWithProp({
          status: 'WAITING_TO_START',
        });
        expect(controller.player2).toBe(undefined);
      });
      it('should return undefined if the game is not initialized', () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
        expect(controller.player2).toBe(undefined);
      });
      it('should return undefined if there is no player2', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer],
        });
        expect(controller.player2).toBe(undefined);
      });
    });
    describe('player3', () => {
      it('should return player3 if there is one', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const otherUNOPlayer = { cards: [], id: otherPlayers[0].id };
        const anotherUNOPlayer = { cards: [], id: otherPlayers[1].id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer, otherUNOPlayer, anotherUNOPlayer],
        });
        expect(controller.player3).toBe(otherPlayers[1]);
      });
      it('should return undefined if there is no player3, and game waiting to start', () => {
        const controller = UNOAreaControllerWithProp({
          status: 'WAITING_TO_START',
        });
        expect(controller.player3).toBe(undefined);
      });
      it('should return undefined if the game is not initialized', () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
        expect(controller.player3).toBe(undefined);
      });
      it('should return undefined if there is no player3', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const otherUNOPlayer = { cards: [], id: otherPlayers[0].id };
        const anotherUNOPlayer = { cards: [], id: otherPlayers[1].id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer, otherUNOPlayer],
        });
        expect(controller.player3).toBe(undefined);
      });
    });
    describe('player4', () => {
      it('should return player4 if there is one', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const otherUNOPlayer = { cards: [], id: otherPlayers[0].id };
        const anotherUNOPlayer = { cards: [], id: otherPlayers[1].id };
        const finalUNOPlayer = { cards: [], id: otherPlayers[2].id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer, otherUNOPlayer, anotherUNOPlayer, finalUNOPlayer],
        });
        expect(controller.player4).toBe(otherPlayers[2]);
      });
      it('should return undefined if there is no player4, and game waiting to start', () => {
        const controller = UNOAreaControllerWithProp({
          status: 'WAITING_TO_START',
        });
        expect(controller.player4).toBe(undefined);
      });
      it('should return undefined if the game is not initialized', () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
        expect(controller.player4).toBe(undefined);
      });
      it('should return undefined if there is no player4', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const otherUNOPlayer = { cards: [], id: otherPlayers[0].id };
        const anotherUNOPlayer = { cards: [], id: otherPlayers[1].id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer, otherUNOPlayer, anotherUNOPlayer],
        });
        expect(controller.player4).toBe(undefined);
      });
    });
    describe('winner', () => {
      it('should return the winner if there is one', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const controller = UNOAreaControllerWithProp({
          status: 'OVER',
          players: [ourUNOPlayer],
          winner: ourPlayer.id,
        });
        expect(controller.winner).toBe(ourPlayer);
      });
      it('should return undefined if there is no winner', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const controller = UNOAreaControllerWithProp({
          status: 'OVER',
          players: [ourUNOPlayer],
        });
        expect(controller.winner).toBe(undefined);
      });
      it('should return undefined if game hasnt been initialized', () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
        expect(controller.winner).toBe(undefined);
      });
    });
    describe('isPlayer', () => {
      it('should retunr true if current player is in game', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer],
        });
        expect(controller.isPlayer).toBe(true);
      });
      it('should return false if current player is not in game', () => {
        const otherUNOPlayer = { cards: [], id: otherPlayers[0].id };
        const anotherUNOPlayer = { cards: [], id: otherPlayers[1].id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [otherUNOPlayer, anotherUNOPlayer],
        });
        expect(controller.isPlayer).toBe(false);
      });
      it('should return false if undefined game', () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
        expect(controller.isPlayer).toBe(false);
      });
    });
    describe('playerDirection', () => {
      it('should return the direction', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer],
        });
        expect(controller.playerDirection).toEqual('clockwise');
      });
      it('should return undefined if game is not active', () => {
        const controller = UNOAreaControllerWithProp({
          status: 'OVER',
        });
        expect(controller.playerDirection).toBe(undefined);
      });
      it('should return undefined if game inst initialized', () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
      });
    });
    describe('topCard', () => {
      it('should return the top card', () => {
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          topCard: { color: 'Blue', rank: 1 },
        });
        expect(controller.topCard).toEqual({ color: 'Blue', rank: 1 });
      });
      it('should return undefined if the game is undefined', () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
        expect(controller.topCard).toBe(undefined);
      });
      it('should return undefined if the game is waiting', () => {
        const controller = UNOAreaControllerWithProp({
          status: 'WAITING_TO_START',
        });
        expect(controller.topCard).toBe(undefined);
      });
    });
    describe('drawDeck', () => {
      it('should return the draw deck', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const otherUNOPlayer = { cards: [], id: otherPlayers[0].id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer, otherUNOPlayer],
          deck: [
            { color: 'Blue', rank: 1 },
            { color: 'Red', rank: 2 },
          ],
        });
        expect(controller.drawDeck).toEqual([
          { color: 'Blue', rank: 1 },
          { color: 'Red', rank: 2 },
        ]);
      });
      it('should return empty deck if the game isnt in progress', () => {
        const controller = UNOAreaControllerWithProp({
          status: 'WAITING_TO_START',
        });
        expect(controller.drawDeck).toEqual([]);
      });
      it('should return undefined if the game isnt defined', () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
        expect(controller.drawDeck).toBe(undefined);
      });
    });
    describe('ourDeck', () => {
      it('should return deck of our player', () => {
        const ourUNOPlayer: UNOPlayer = {
          cards: [
            { color: 'Blue', rank: 1 },
            { color: 'Red', rank: 2 },
          ],
          id: ourPlayer.id,
        };
        const otherUNOPlayer = { cards: [], id: otherPlayers[0].id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer, otherUNOPlayer],
        });
        expect(controller.ourDeck).toEqual([
          { color: 'Blue', rank: 1 },
          { color: 'Red', rank: 2 },
        ]);
      });
      it('should return undefined if game isnt active', () => {
        const controller = UNOAreaControllerWithProp({
          status: 'WAITING_TO_START',
        });
        expect(controller.ourDeck).toBe(undefined);
      });
      it('should return undefined if game is undefined', () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
        expect(controller.ourDeck).toBe(undefined);
      });
      it('should throw an error if our player isnt in the game', () => {
        const otherUNOPlayer: UNOPlayer = {
          cards: [
            { color: 'Blue', rank: 1 },
            { color: 'Red', rank: 2 },
          ],
          id: otherPlayers[0].id,
        };
        const anotherUNOPlayer = { cards: [], id: otherPlayers[1].id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [otherUNOPlayer, anotherUNOPlayer],
        });
        expect(() => controller.ourDeck).toThrow();
      });
    });
    describe('othersCards', () => {
      it('should return a map of other players ids and amount of cards', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const otherUNOPlayer: UNOPlayer = {
          cards: [{ color: 'Blue', rank: 1 }],
          id: otherPlayers[0].id,
        };
        const anotherUNOPlayer = { cards: [], id: otherPlayers[1].id };
        const returnMap = new Map<string, number>([
          [otherUNOPlayer.id, 1],
          [anotherUNOPlayer.id, 0],
        ]);
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer, otherUNOPlayer, anotherUNOPlayer],
        });
        expect(controller.othersCards).toEqual(returnMap);
      });
      it('should return undefined if game is not in progress', () => {
        const ourUNOPlayer = { cards: [], id: ourPlayer.id };
        const otherUNOPlayer: UNOPlayer = {
          cards: [{ color: 'Blue', rank: 1 }],
          id: otherPlayers[0].id,
        };
        const anotherUNOPlayer = { cards: [], id: otherPlayers[1].id };
        const controller = UNOAreaControllerWithProp({
          status: 'WAITING_TO_START',
          players: [ourUNOPlayer, otherUNOPlayer, anotherUNOPlayer],
        });
        expect(controller.othersCards).toBe(undefined);
      });
      it('should return undefined if game is undefined', () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
        expect(controller.othersCards).toBe(undefined);
      });
    });
    describe('makeMove', () => {
      it('should throw an erorr if the game is not in progress', async () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
        await expect(async () => controller.makeMove({ color: 'Blue', rank: 1 })).rejects.toEqual(
          new Error(NO_GAME_IN_PROGRESS_ERROR),
        );
      });
      it('should call townController.sendInteractableComamnd', async () => {
        const ourUNOPlayer: UNOPlayer = { cards: [{ color: 'Blue', rank: 1 }], id: ourPlayer.id };
        const otherUNOPlayer = { cards: [], id: otherPlayers[0].id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer, otherUNOPlayer],
        });
        const instanceID = nanoid();
        mockTownController.sendInteractableCommand.mockImplementationOnce(async () => {
          return { gameID: instanceID };
        });
        await controller.joinGame();
        mockTownController.sendInteractableCommand.mockReset();
        await controller.makeMove({ color: 'Blue', rank: 1 });
        expect(mockTownController.sendInteractableCommand).toHaveBeenCalledWith(controller.id, {
          type: 'GameMove',
          gameID: instanceID,
          move: {
            player: ourUNOPlayer.id,
            card: { color: 'Blue', rank: 1 },
          },
        });
      });
    });
    describe('drawCard', () => {
      it('should throw an erorr if the game is not in progress', async () => {
        const controller = UNOAreaControllerWithProp({
          undefinedGame: true,
        });
        await expect(async () => controller.drawCard()).rejects.toEqual(
          new Error(NO_GAME_IN_PROGRESS_ERROR),
        );
      });
      it('should call townController.sendInteractableComamnd', async () => {
        const ourUNOPlayer: UNOPlayer = { cards: [{ color: 'Blue', rank: 1 }], id: ourPlayer.id };
        const otherUNOPlayer = { cards: [], id: otherPlayers[0].id };
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [ourUNOPlayer, otherUNOPlayer],
        });
        const instanceID = nanoid();
        mockTownController.sendInteractableCommand.mockImplementationOnce(async () => {
          return { gameID: instanceID };
        });
        await controller.joinGame();
        mockTownController.sendInteractableCommand.mockReset();
        await controller.drawCard();
        expect(mockTownController.sendInteractableCommand).toHaveBeenCalledWith(controller.id, {
          type: 'DrawCard',
          gameID: instanceID,
          id: ourUNOPlayer.id,
        });
      });
    });
    describe('startGame', () => {
      it('should throw an erorr if the game is in progress', async () => {
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
        });
        await expect(async () => controller.startGame()).rejects.toEqual(
          new Error(GAME_ALREADY_IN_PROGRESS),
        );
      });
      it('should call townController.sendInteractableComamnd', async () => {
        const ourUNOPlayer: UNOPlayer = { cards: [{ color: 'Blue', rank: 1 }], id: ourPlayer.id };
        const otherUNOPlayer = { cards: [], id: otherPlayers[0].id };
        const controller = UNOAreaControllerWithProp({
          status: 'WAITING_TO_START',
          players: [ourUNOPlayer, otherUNOPlayer],
        });
        const instanceID = nanoid();
        mockTownController.sendInteractableCommand.mockImplementationOnce(async () => {
          return { gameID: instanceID };
        });
        await controller.joinGame();
        mockTownController.sendInteractableCommand.mockReset();
        await controller.startGame();
        expect(mockTownController.sendInteractableCommand).toHaveBeenCalledWith(controller.id, {
          type: 'StartGame',
          gameID: instanceID,
        });
      });
    });
    describe('changeColor', () => {
        it('should throw an error if the game is not in progress', async () => {
            const controller = UNOAreaControllerWithProp({
                status: 'WAITING_TO_START',
            });
            await expect(async () => controller.changeColor('Red')).rejects.toEqual(
                new Error(NO_GAME_IN_PROGRESS_ERROR),
            );
        });
        it('should call towncontroller.sendInteractableCommand', async () => {
            const ourUNOPlayer: UNOPlayer = { cards: [{ color: 'Blue', rank: 1 }], id: ourPlayer.id };
            const otherUNOPlayer = { cards: [], id: otherPlayers[0].id };
            const controller = UNOAreaControllerWithProp({
              status: 'IN_PROGRESS',
              players: [ourUNOPlayer, otherUNOPlayer],
        });
        const instanceID = nanoid();
        mockTownController.sendInteractableCommand.mockImplementationOnce(async () => {
          return { gameID: instanceID };
        });
        await controller.joinGame();
        mockTownController.sendInteractableCommand.mockReset();
        await controller.changeColor('Red');
        expect(mockTownController.sendInteractableCommand).toHaveBeenCalledWith(controller.id, {
          type: 'ColorChange',
          gameID: instanceID,
          color: 'Red'
        });
      });
    });
    describe('joinAI', () => {
      it('should throw an erorr if the game is in progress', async () => {
        const controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
        });
        await expect(async () => controller.joinAI('Easy')).rejects.toEqual(
          new Error(GAME_ALREADY_IN_PROGRESS),
        );
      });
      it('should call townController.sendInteractableComamnd', async () => {
        const ourUNOPlayer: UNOPlayer = { cards: [{ color: 'Blue', rank: 1 }], id: ourPlayer.id };
        const otherUNOPlayer = { cards: [], id: otherPlayers[0].id };
        const controller = UNOAreaControllerWithProp({
          status: 'WAITING_TO_START',
          players: [ourUNOPlayer, otherUNOPlayer],
        });
        const instanceID = nanoid();
        mockTownController.sendInteractableCommand.mockImplementationOnce(async () => {
          return { gameID: instanceID };
        });
        await controller.joinGame();
        mockTownController.sendInteractableCommand.mockReset();
        await controller.joinAI('Easy');
        expect(mockTownController.sendInteractableCommand).toHaveBeenCalledWith(controller.id, {
          type: 'JoinAI',
          gameID: instanceID,
          difficulty: 'Easy',
        });
      });
    });
  });
  describe('[] _updateFrom', () => {
    describe('if the game is in progress', () => {
      let controller: UNOAreaController;
      let ourUNOPlayer: UNOPlayer;
      let otherUNOPlayer: UNOPlayer;
      let anotherUNOPlayer: UNOPlayer;
      let finalUNOPlayer: UNOPlayer;
      beforeEach(() => {
        ourUNOPlayer = {
          cards: [
            { color: 'Blue', rank: 1 },
            { color: 'Red', rank: 2 },
          ],
          id: ourPlayer.id,
        };
        otherUNOPlayer = {
          cards: [
            { color: 'Yellow', rank: 1 },
            { color: 'Red', rank: 5 },
          ],
          id: otherPlayers[0].id,
        };
        anotherUNOPlayer = {
          cards: [
            { color: 'Green', rank: 1 },
            { color: 'Green', rank: 2 },
          ],
          id: otherPlayers[1].id,
        };
        finalUNOPlayer = {
          cards: [
            { color: 'Blue', rank: 1 },
            { color: 'Red', rank: 2 },
          ],
          id: otherPlayers[2].id,
        };
        controller = UNOAreaControllerWithProp({
          status: 'IN_PROGRESS',
          players: [otherUNOPlayer, anotherUNOPlayer, ourUNOPlayer, finalUNOPlayer],
        });
      });
      it('should emit a drawDeckChanged event with new deck', () => {
        const model = controller.toInteractableAreaModel();
        const newDeck: Card[] = [{ color: 'Green', rank: 1 }];
        assert(model.game);
        const newModel: GameArea<UNOGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              deck: newDeck,
            },
          },
        };
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        const deckChangedCall = emitSpy.mock.calls.find(call => call[0] === 'drawDeckChanged');
        expect(deckChangedCall).toBeDefined();
        if (deckChangedCall) expect(deckChangedCall[1]).toEqual([{ color: 'Green', rank: 1 }]);
      });
      it('should not emit a drawDeckChanged event if it hasnt changed', () => {
        const model = controller.toInteractableAreaModel();
        assert(model.game);
        expect(controller.drawDeck).toEqual([]);
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(model, otherPlayers.concat(ourPlayer));
        const deckChangedCall = emitSpy.mock.calls.find(call => call[0] === 'drawDeckChanged');
        expect(deckChangedCall).not.toBeDefined();
      });
      it('should emit a turnChanged event with false if it our turn', () => {
        const model = controller.toInteractableAreaModel();
        const newTurn = 1;
        assert(model.game);
        const newModel: GameArea<UNOGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              currentPlayerIndex: newTurn,
            },
          },
        };
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        const turnChangedCall = emitSpy.mock.calls.find(call => call[0] === 'turnChanged');
        expect(turnChangedCall).toBeDefined();
        if (turnChangedCall) expect(turnChangedCall[1]).toEqual(false);
      });
      it('should emit a turn changed even with true if it is our turn', () => {
        const model = controller.toInteractableAreaModel();
        const newTurn = 2;
        assert(model.game);
        const newModel: GameArea<UNOGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              currentPlayerIndex: newTurn,
            },
          },
        };
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        const turnChangedCall = emitSpy.mock.calls.find(call => call[0] === 'turnChanged');
        expect(turnChangedCall).toBeDefined();
        if (turnChangedCall) expect(turnChangedCall[1]).toEqual(true);
      });
      it('should not emit a turnChanged event if the turn has not changed', () => {
        const model = controller.toInteractableAreaModel();
        assert(model.game);
        expect(controller.isOurTurn).toBe(false);
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(model, otherPlayers.concat(ourPlayer));
        const turnChangedCall = emitSpy.mock.calls.find(call => call[0] === 'turnChanged');
        expect(turnChangedCall).not.toBeDefined();
      });
      it('should emit a topCardChanged event if the top card has changed', () => {
        const model = controller.toInteractableAreaModel();
        const newTop: Card = { color: 'Red', rank: 1 };
        assert(model.game);
        const newModel: GameArea<UNOGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              topCard: newTop,
            },
          },
        };
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        const topCardChangedCall = emitSpy.mock.calls.find(call => call[0] === 'topCardChanged');
        expect(topCardChangedCall).toBeDefined();
        if (topCardChangedCall) expect(topCardChangedCall[1]).toEqual({ color: 'Red', rank: 1 });
      });
      it('should not emit a topCardChanged event if top card hasnt changede', () => {
        const model = controller.toInteractableAreaModel();
        assert(model.game);
        expect(controller.topCard).toBe(undefined);
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(model, otherPlayers.concat(ourPlayer));
        const topCardChangedCall = emitSpy.mock.calls.find(call => call[0] === 'topCardChanged');
        expect(topCardChangedCall).not.toBeDefined();
      });
      it('should emit an ourDeckChanged event if our players deck changed', () => {
        const model = controller.toInteractableAreaModel();
        const newDeckWithPlayer: UNOPlayer = {
          cards: [{ color: 'Green', rank: 7 }],
          id: ourPlayer.id,
        };
        assert(model.game);
        const newModel: GameArea<UNOGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              players: [otherUNOPlayer, anotherUNOPlayer, newDeckWithPlayer, finalUNOPlayer],
            },
          },
        };
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        const ourDeckChangedCall = emitSpy.mock.calls.find(call => call[0] === 'ourDeckChanged');
        expect(ourDeckChangedCall).toBeDefined();
        if (ourDeckChangedCall)
          expect(ourDeckChangedCall[1]).toEqual([{ color: 'Green', rank: 7 }]);
      });
      it('should not emit a ourDeckChnaged event if our players deck doesnt change', () => {
        const model = controller.toInteractableAreaModel();
        assert(model.game);
        expect(controller.ourDeck).toEqual([
          { color: 'Blue', rank: 1 },
          { color: 'Red', rank: 2 },
        ]);
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(model, otherPlayers.concat(ourPlayer));
        const ourDeckChangedCall = emitSpy.mock.calls.find(call => call[0] === 'ourDeckChanged');
        expect(ourDeckChangedCall).not.toBeDefined();
      });
      it('should emit an orderChanged event if the direction changed', () => {
        const model = controller.toInteractableAreaModel();
        const newDir = 'counterclockwise';
        assert(model.game);
        const newModel: GameArea<UNOGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              playDirection: newDir,
            },
          },
        };
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        const orderChangedCall = emitSpy.mock.calls.find(call => call[0] === 'orderChanged');
        expect(orderChangedCall).toBeDefined();
        if (orderChangedCall) expect(orderChangedCall[1]).toEqual('counterclockwise');
      });
      it('should not emit an orderChanged event if the direction didnt change', () => {
        const model = controller.toInteractableAreaModel();
        assert(model.game);
        expect(controller.playerDirection).toEqual('clockwise');
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(model, otherPlayers.concat(ourPlayer));
        const orderChangedCall = emitSpy.mock.calls.find(call => call[0] === 'orderChanged');
        expect(orderChangedCall).not.toBeDefined();
      });
      it('should emit an otherCardsChanged event if other cards changed', () => {
        const model = controller.toInteractableAreaModel();
        const otherUNOPlayerNew: UNOPlayer = { cards: [], id: otherPlayers[0].id };
        const newMap: Map<string, number> = new Map<string, number>([
          [otherPlayers[0].id, 0],
          [otherPlayers[1].id, 2],
          [otherPlayers[2].id, 2],
        ]);
        assert(model.game);
        const newModel: GameArea<UNOGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              players: [otherUNOPlayerNew, anotherUNOPlayer, ourUNOPlayer, finalUNOPlayer],
            },
          },
        };
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        const otherChangedCall = emitSpy.mock.calls.find(call => call[0] === 'otherCardsChanged');
        expect(otherChangedCall).toBeDefined();
        if (otherChangedCall) expect(otherChangedCall[1]).toEqual(newMap);
      });
      it('not emit an otherCardsChanged event if other cards didnt change', () => {
        const model = controller.toInteractableAreaModel();
        assert(model.game);
        const othersMap: Map<string, number> = new Map<string, number>([
          [otherPlayers[0].id, 2],
          [otherPlayers[1].id, 2],
          [otherPlayers[2].id, 2],
        ]);
        expect(controller.othersCards).toEqual(othersMap);
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(model, otherPlayers.concat(ourPlayer));
        const othersChangedCall = emitSpy.mock.calls.find(call => call[0] === 'otherCardsChanged');
        expect(othersChangedCall).not.toBeDefined();
      });
    });
    it('should call super._updateFrom', () => {
      const ourUNOPlayer: UNOPlayer = {cards: [], id: ourPlayer.id }
      //eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore - we are testing spying on a private method
      const spy = jest.spyOn(GameAreaController.prototype, '_updateFrom');
      const controller = UNOAreaControllerWithProp({
        players: [ourUNOPlayer],
      });
      const model = controller.toInteractableAreaModel();
      controller.updateFrom(model, otherPlayers.concat(ourPlayer));
      expect(spy).toHaveBeenCalled();
    });
  });
});
