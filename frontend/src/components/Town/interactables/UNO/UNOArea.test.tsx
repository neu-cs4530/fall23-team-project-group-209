import { ChakraProvider } from '@chakra-ui/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import assert from 'assert';
import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import React from 'react';
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
import UNOAreaWrapper from '../UNO/UNOArea';
import PhaserGameArea from '../GameArea';

const mockGameArea = mock<PhaserGameArea>();
mockGameArea.getData.mockReturnValue('UNO');
jest.spyOn(TownControllerHooks, 'useInteractable').mockReturnValue(mockGameArea);
const useInteractableAreaControllerSpy = jest.spyOn(
  TownControllerHooks,
  'useInteractableAreaController',
);

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

  public mockReset() {
    this.makeMove.mockReset();
  }
}

describe('UNOAreaTests', () => {
  //setup
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

  function renderUNOArea() {
    return render(
      <ChakraProvider>
        <TownControllerContext.Provider value={mockTownController}>
          <UNOAreaWrapper />
        </TownControllerContext.Provider>
      </ChakraProvider>,
    );
  }

  let gameAreaController: MockUNOAreaController;

  beforeEach(() => {
    gameAreaController = new MockUNOAreaController();
    mockGameArea.name = 'UNO Test';
    useInteractableAreaControllerSpy.mockReturnValue(gameAreaController);
  });

  describe('data display', () => {
    it('should display the uno modal', () => {
      renderUNOArea();
      expect(screen.queryByText('UNO Test')).toHaveTextContent('UNO Test');
      expect(screen.queryByText('Join New Game')).toBeInTheDocument();
      expect(screen.queryByText('Leaderboard')).toBeInTheDocument();
      expect(screen.queryByText('Rules')).toBeInTheDocument();
    });

    it('should display leaderboard and rules buttons at all statuses', () => {
      renderUNOArea();
      expect(screen.queryByText('Leaderboard')).toBeInTheDocument();
      expect(screen.queryByText('Rules')).toBeInTheDocument();
      gameAreaController.mockStatus = 'IN_PROGRESS';
      act(() => {
        gameAreaController.emit('gameUpdated');
      });
      expect(screen.queryByText('Leaderboard')).toBeInTheDocument();
      expect(screen.queryByText('Rules')).toBeInTheDocument();
      gameAreaController.mockStatus = 'OVER';
      act(() => {
        gameAreaController.emit('gameUpdated');
      });
      expect(screen.queryByText('Leaderboard')).toBeInTheDocument();
      expect(screen.queryByText('Rules')).toBeInTheDocument();
    });

    it('should display usernames or no player yet if game is not started', () => {
      gameAreaController.mockp1 = ourPlayer;
      gameAreaController.mockp2 = otherPlayers[0];
      gameAreaController.mockp3 = otherPlayers[1];
      renderUNOArea();
      const list = screen.queryByLabelText('list of players in the game');
      expect(list).toHaveTextContent(ourPlayer.userName);
      expect(list).toHaveTextContent(otherPlayers[0].userName);
      expect(list).toHaveTextContent(otherPlayers[1].userName);
      expect(list).toHaveTextContent('Player 4: (No player yet!)');
    });

    it('should not display empty player slots in the list of an in-progress game', () => {
      gameAreaController.mockp1 = ourPlayer;
      gameAreaController.mockp2 = otherPlayers[0];
      gameAreaController.mockp3 = otherPlayers[1];
      gameAreaController.mockStatus = 'IN_PROGRESS';
      renderUNOArea();
      const list = screen.queryByLabelText('list of players in the game');
      expect(list).toHaveTextContent(ourPlayer.userName);
      expect(list).toHaveTextContent(otherPlayers[0].userName);
      expect(list).toHaveTextContent(otherPlayers[1].userName);
      expect(list).not.toHaveTextContent('Player 4: (No player yet!)');
    });

    it('should display add AI button when a user is in a game waiting to start if there is room', () => {
      gameAreaController.mockp1 = ourPlayer;
      gameAreaController.mockIsPlayer = true;
      renderUNOArea();
      expect(screen.queryByText('Join New Game')).not.toBeInTheDocument();
      const button = screen.queryByText('Add AI Opponent');
      expect(button).toBeInTheDocument();
      gameAreaController.mockp2 = otherPlayers[0];
      gameAreaController.mockp3 = otherPlayers[1];
      act(() => {
        gameAreaController.emit('gameUpdated');
      });
      expect(button).toBeInTheDocument();
      gameAreaController.mockp4 = otherPlayers[2];
      act(() => {
        gameAreaController.emit('gameUpdated');
      });
      // game started with 4 players, no button option
      expect(button).not.toBeInTheDocument();
    });

    it('should not display AI button if not in game', () => {
      renderUNOArea();
      expect(screen.queryByText('Add AI Opponent')).not.toBeInTheDocument();
    });

    it('should display start game button when players > 2', () => {
      gameAreaController.mockp1 = ourPlayer;
      gameAreaController.mockIsPlayer = true;
      gameAreaController.mockp2 = undefined;
      renderUNOArea();
      const button = screen.queryByText('Start Game');
      expect(button).not.toBeInTheDocument();
      gameAreaController.mockp2 = otherPlayers[1];
      act(() => {
        gameAreaController.emit('gameUpdated');
      });
      expect(screen.queryByText('Start Game')).toBeInTheDocument();
    });

    it('should not display start/join game/add AI when game is in progress', () => {
      gameAreaController.mockp1 = ourPlayer;
      gameAreaController.mockp2 = otherPlayers[0];
      gameAreaController.mockIsPlayer = true;
      gameAreaController.mockStatus = 'IN_PROGRESS';
      renderUNOArea();
      expect(screen.queryByText('Join New Game')).not.toBeInTheDocument();
      expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
      expect(screen.queryByText('Add AI Opponent')).not.toBeInTheDocument();
    });

    it('should display game status at all statuses', () => {
      //waiting to start
      gameAreaController.mockp1 = ourPlayer;
      gameAreaController.mockIsPlayer = true;
      renderUNOArea();
      const status = screen.queryByLabelText('status');
      expect(status).toHaveTextContent('waiting to start');
      //in progress
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockp2 = otherPlayers[1];
      gameAreaController.mockWhoseTurn = ourPlayer;
      gameAreaController.mockPlayerDirection = 'clockwise';
      act(() => {
        gameAreaController.emit('gameUpdated');
      });
      expect(status).toHaveTextContent('clockwise');
      expect(status).toHaveTextContent(ourPlayer.userName);
      expect(status).toHaveTextContent('in progress');
      // over
      gameAreaController.mockStatus = 'OVER';
      gameAreaController.mockWinner = otherPlayers[1];
      act(() => {
        gameAreaController.emit('gameUpdated');
      });
      expect(status).toHaveTextContent('over');
      expect(status).toHaveTextContent(otherPlayers[1].userName);
    });
  });

  describe('button clicks', () => {
    it('should open the leaderboard modal when clicked', () => {
      renderUNOArea();
      const button = screen.getByText('Leaderboard');
      fireEvent.click(button);
      expect(screen.queryByText('UNO Leaderboard')).toBeInTheDocument();
    });

    it('should open the rules modal when clicked', () => {
      renderUNOArea();
      const button = screen.getByText('Rules');
      fireEvent.click(button);
      expect(screen.queryByText('UNO Rules')).toBeInTheDocument();
    });

    it('should call the add AI opponent controller method when clicked', async () => {
      const joinAISpy = jest.spyOn(gameAreaController, 'joinAI');
      gameAreaController.mockp1 = ourPlayer;
      gameAreaController.mockIsPlayer = true;
      renderUNOArea();
      expect(screen.queryByText('Join New Game')).not.toBeInTheDocument();
      const button = screen.getByText('Add AI Opponent');
      await act(async () => {
        fireEvent.click(button);
      });
      await act(async () => {
        fireEvent.click(screen.getByText('Add'));
      });
      expect(joinAISpy).toBeCalledWith('Easy');
    });

    it('should call the joinGame method when joining the game', async () => {
      const joinSpy = jest.spyOn(gameAreaController, 'joinGame');
      renderUNOArea();
      const button = screen.getByText('Join New Game');
      await act(async () => {
        fireEvent.click(button);
      });
      expect(joinSpy).toBeCalled();
    });

    it('should call the startGame method when the button is pressed', async () => {
      const startSpy = jest.spyOn(gameAreaController, 'startGame');
      gameAreaController.mockp1 = ourPlayer;
      gameAreaController.mockp2 = otherPlayers[0];
      gameAreaController.mockIsPlayer = true;
      renderUNOArea();
      const button = screen.getByText('Start Game');
      await act(async () => {
        fireEvent.click(button);
      });
      expect(startSpy).toBeCalledWith();
    });
  });

  describe('listeners', () => {
    it('should add listeners on element mount', () => {
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();

      renderUNOArea();
      expect(addListenerSpy).toBeCalledTimes(5);
      expect(addListenerSpy).toBeCalledWith('gameUpdated', expect.any(Function));
      expect(addListenerSpy).toBeCalledWith('gameEnd', expect.any(Function));
      expect(addListenerSpy).toBeCalledWith('turnChanged', expect.any(Function));
      expect(addListenerSpy).toBeCalledWith('directionChanged', expect.any(Function));
    });

    it('should remove listeners on dismount', () => {
      const removeSpy = jest.spyOn(gameAreaController, 'removeListener');
      removeSpy.mockClear();

      const renderData = renderUNOArea();
      renderData.unmount();

      expect(removeSpy).toBeCalledTimes(5);
      expect(removeSpy).toBeCalledWith('gameUpdated', expect.any(Function));
      expect(removeSpy).toBeCalledWith('gameEnd', expect.any(Function));
      expect(removeSpy).toBeCalledWith('turnChanged', expect.any(Function));
      expect(removeSpy).toBeCalledWith('directionChanged', expect.any(Function));
    });

    it('should not add listeners on every rerender', () => {
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();

      const renderData = renderUNOArea();
      expect(addListenerSpy).toBeCalledTimes(5);

      renderData.rerender(
        <ChakraProvider>
          <TownControllerContext.Provider value={mockTownController}>
            <UNOAreaWrapper />
          </TownControllerContext.Provider>
        </ChakraProvider>,
      );

      expect(addListenerSpy).toBeCalledTimes(5);
    });
  });
});
