import { createPlayerForTesting } from '../../../TestUtils';
import Player from '../../../lib/Player';
import { UNOMove } from '../../../types/CoveyTownSocket';
import UNOGame from '../UNOGame';
import EasyAIStrategy from './EasyAi';

describe('EasyAIStrategy', () => {
  let unoGame: UNOGame;
  let aiPlayer: Player;
  let humanPlayer: Player;
  let easyAIStrategy: EasyAIStrategy;

  beforeEach(() => {
    unoGame = new UNOGame();
    humanPlayer = createPlayerForTesting();
    aiPlayer = createPlayerForTesting();
    unoGame._join(humanPlayer);
    unoGame._join(aiPlayer);
    unoGame.startGame();
    easyAIStrategy = new EasyAIStrategy(unoGame, aiPlayer.id);
  });

  it('should play the first playable card if available', () => {
    unoGame.state.players[0].cards = [
      { color: 'Red', rank: 6 },
      { color: 'Blue', rank: 4 },
    ];
    unoGame.state.players[1].cards = [
      { color: 'Red', rank: 5 },
      { color: 'Blue', rank: 4 },
    ];
    unoGame.state.topCard = { color: 'Red', rank: 3 };
    const unoMove1: UNOMove = {
      player: humanPlayer.id,
      card: { color: 'Red', rank: 6 },
    };
    unoGame.applyMove({
      move: unoMove1,
      playerID: humanPlayer.id,
      gameID: unoGame.id,
    });
    easyAIStrategy.makeMove();
    expect(unoGame.state.players[1].cards).not.toContainEqual({
      card: { color: 'Red', rank: 5 },
    });
  });

  it('should draw a card if no cards are playable', () => {
    const stack = unoGame.state.deck.length;
    unoGame.state.players[0].cards = [
      { color: 'Red', rank: 6 },
      { color: 'Green', rank: 7 },
    ];
    unoGame.state.players[1].cards = [
      { color: 'Red', rank: 5 },
      { color: 'Blue', rank: 4 },
    ];
    unoGame.state.topCard = { color: 'Green', rank: 3 };
    const unoMove1: UNOMove = {
      player: humanPlayer.id,
      card: { color: 'Green', rank: 7 },
    };
    unoGame.applyMove({
      move: unoMove1,
      playerID: humanPlayer.id,
      gameID: unoGame.id,
    });
    easyAIStrategy.makeMove();
    expect(unoGame.state.deck.length).toBeLessThan(stack);
  });

  it('should not make a move if the AI player is not found', () => {
    const humanThrowaway = createPlayerForTesting();
    const gameThrowaway = new UNOGame();
    gameThrowaway._join(humanThrowaway);
    gameThrowaway._join(humanPlayer);
    easyAIStrategy.makeMove();
    gameThrowaway.startGame();
    gameThrowaway.state.topCard = { color: 'Green', rank: 3 };
    expect(gameThrowaway.state.topCard).toEqual({ color: 'Green', rank: 3 });
  });
});
