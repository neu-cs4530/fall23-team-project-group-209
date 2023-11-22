import { nanoid } from 'nanoid';
import {
    Card,
  GameArea,
  GameResult,
  GameStatus,
  Player,
  UNOGameState,
  UNOMove,
  UNOPlayer,
} from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import TownController from '../TownController';
import GameAreaController from './GameAreaController';
import UNOAreaController, { NO_GAME_IN_PROGRESS_ERROR } from './UNOAreaController';
import { mock } from 'jest-mock-extended';
import assert from 'assert';


describe('[] UNOAreaController', () => {
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
        get: () => [ourPlayer, ... otherPlayers],
    });
    mockTownController.getPlayer.mockImplementation(playerID => {
        const p = mockTownController.players.find(player => player.id === playerID);
        assert(p);
        return p;
    });

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
        players.forEach((player) => {
            occs.push(player.id);
        });
    };
    const ret = new UNOAreaController(
        id,
        {
            id,
            occupants: occs,
            history: history || [],
            type: 'UNOArea',
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
                    playDirection: playDirection || 'clockwise'
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
  });