import { ChakraProvider } from '@chakra-ui/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import assert from 'assert';
import React from 'react';
import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import UNOAreaController from '../../../../classes/interactable/UNOAreaController';
import PlayerController from '../../../../classes/PlayerController';
import TownController, * as TownControllerHooks from '../../../../classes/TownController';
import TownControllerContext from '../../../../contexts/TownControllerContext';
import {
  GameResult,
  GameStatus,
  UNOGameState,
  GameArea,
  Card,
} from '../../../../types/CoveyTownSocket';
import PhaserGameArea from '../GameArea';
import UNOTable from './UNOTable';

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => {
  const ui = jest.requireActual('@chakra-ui/react');
  const mockUseToast = () => mockToast;
  return {
    ...ui,
    useToast: mockUseToast,
  };
});

const mockGameArea = mock<PhaserGameArea>();
mockGameArea.getData.mockReturnValue('UNO');
jest.spyOn(TownControllerHooks, 'useInteractable').mockReturnValue(mockGameArea);

class MockUNOAreaController extends UNOAreaController {
  makeMove = jest.fn();

  joinGame = jest.fn();

  drawCard = jest.fn();

  startGame = jest.fn();

  joinAI = jest.fn();

  changeColor = jest.fn();

  mockTopCard: Card | undefined = undefined;

  mockDrawDeck: Card[] | undefined = undefined;

  mockOurDeck: Card[] | undefined = undefined;

  mockPlayerDirection: string | undefined = undefined;

  mockIsPlayer = false;

  mockIsOurTurn = false;

  mockObservers: PlayerController[] = [];

  mockWinner: PlayerController | undefined = undefined;

  mockWhoseTurn: PlayerController | undefined = undefined;

  mockStatus: GameStatus = 'WAITING_TO_START';

  mockp1: PlayerController | undefined = undefined;

  mockp2: PlayerController | undefined = undefined;

  mockp3: PlayerController | undefined = undefined;

  mockp4: PlayerController | undefined = undefined;

  mockOthersCards: Map<string, number> | undefined = undefined;

  mockCurrentGame: GameArea<UNOGameState> | undefined = undefined;

  mockIsActive = false;

  mockHistory: GameResult[] = [];

  public constructor() {
    super(nanoid(), mock<GameArea<UNOGameState>>(), mock<TownController>());
  }

  get topCard() {
    return this.mockTopCard;
  }

  get drawDeck() {
    return this.mockDrawDeck;
  }

  get ourDeck() {
    return this.mockOurDeck;
  }

  get playerDirection() {
    return this.mockPlayerDirection;
  }

  get player1() {
    return this.mockp1;
  }

  get player2() {
    return this.mockp2;
  }

  get player3() {
    return this.mockp3;
  }

  get player4() {
    return this.mockp4;
  }

  get history(): GameResult[] {
    return this.mockHistory;
  }

  get isOurTurn() {
    return this.mockIsOurTurn;
  }

  get observers(): PlayerController[] {
    return this.mockObservers;
  }

  get winner(): PlayerController | undefined {
    return this.mockWinner;
  }

  get whoseTurn(): PlayerController | undefined {
    return this.mockWhoseTurn;
  }

  get status(): GameStatus {
    return this.mockStatus;
  }

  get isPlayer() {
    return this.mockIsPlayer;
  }

  public isActive(): boolean {
    return this.mockIsActive;
  }

  public get othersCards(): Map<string, number> | undefined {
    return this.mockOthersCards;
  }

  public mockReset() {
    this.makeMove.mockReset();
  }
}

describe('UNOTableTests', () => {
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

  const gameAreaController = new MockUNOAreaController();

  function renderUNOTable() {
    return render(
      <ChakraProvider>
        <TownControllerContext.Provider value={mockTownController}>
          <UNOTable gameAreaController={gameAreaController} />
        </TownControllerContext.Provider>
      </ChakraProvider>,
    );
  }

  describe('data display', () => {
    it('should show our player and cards', () => {
      gameAreaController.mockp1 = ourPlayer;
      gameAreaController.mockIsPlayer = true;
      gameAreaController.mockp2 = otherPlayers[0];
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockOurDeck = [
        { rank: 'Wild', color: 'Wildcard' },
        { rank: 4, color: 'Green' },
      ];
      gameAreaController.mockTopCard = { rank: 6, color: 'Green' };
      renderUNOTable();
      expect(screen.queryByText(ourPlayer.userName)).toBeInTheDocument();
      expect(screen.queryByText('W')).toBeInTheDocument();
      expect(screen.queryByText('4')).toBeInTheDocument();
      expect(screen.queryByText('6')).toBeInTheDocument();
    });

    it('should not render to the user when they are the only person in a game', () => {
      gameAreaController.mockp1 = ourPlayer;
      gameAreaController.mockIsPlayer = true;
      gameAreaController.mockp2 = undefined;
      renderUNOTable();
      expect(screen.queryByText(ourPlayer.userName)).toBeNull();
    });

    it('should display all members of the game', () => {
      gameAreaController.mockp1 = ourPlayer;
      gameAreaController.mockIsPlayer = true;
      gameAreaController.mockIsOurTurn = true;
      gameAreaController.mockp2 = otherPlayers[0];
      gameAreaController.mockp3 = otherPlayers[1];
      gameAreaController.mockp4 = otherPlayers[2];
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockOurDeck = [
        { rank: 'Wild', color: 'Wildcard' },
        { rank: 4, color: 'Green' },
      ];
      gameAreaController.mockTopCard = { rank: 6, color: 'Green' };
      const newMap: Map<string, number> = new Map<string, number>([
        [otherPlayers[0].id, 100],
        [otherPlayers[1].id, 200],
        [otherPlayers[2].id, 300],
      ]);
      gameAreaController.mockOthersCards = newMap;
      renderUNOTable();
      expect(screen.queryByText(`${ourPlayer.userName} (your turn)`)).toBeInTheDocument();
      expect(screen.queryByText(otherPlayers[0].userName)).toBeInTheDocument();
      expect(screen.queryByText(otherPlayers[1].userName)).toBeInTheDocument();
      expect(screen.queryByText(otherPlayers[2].userName)).toBeInTheDocument();
      expect(screen.queryByText('100 card(s) left')).toBeInTheDocument();
      expect(screen.queryByText('200 card(s) left')).toBeInTheDocument();
      expect(screen.queryByText('300 card(s) left')).toBeInTheDocument();
    });
  });

  describe('button click', () => {
    it('should call the drawDeck function when clicking a card', () => {
      const cardSpy = jest.spyOn(gameAreaController, 'makeMove');
      gameAreaController.mockp1 = ourPlayer;
      gameAreaController.mockIsPlayer = true;
      gameAreaController.mockp2 = otherPlayers[0];
      gameAreaController.mockOurDeck = [{ rank: 4, color: 'Blue' }];
      gameAreaController.mockTopCard = { rank: 8, color: 'Blue' };
      renderUNOTable();
      act(() => {
        fireEvent.click(screen.getByText('4'));
        expect(cardSpy).toBeCalled();
      });
    });
  });
});
