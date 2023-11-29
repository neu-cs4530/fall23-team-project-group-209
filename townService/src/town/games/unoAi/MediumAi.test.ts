import { createPlayerForTesting } from '../../../TestUtils';
import Player from '../../../lib/Player';
import { UNOMove } from '../../../types/CoveyTownSocket';
import UNOGame from '../UNOGame';
import MediumAIStrategy from './EasyAi';

describe('MediumAIStrategy', () => {
  let unoGame: UNOGame;
  let aiPlayer: Player;
  let humanPlayer: Player;
  let mediumAIStrategy: MediumAIStrategy;

  beforeEach(() => {
    unoGame = new UNOGame();
    humanPlayer = createPlayerForTesting();
    aiPlayer = createPlayerForTesting();
    unoGame._join(humanPlayer);
    unoGame._join(aiPlayer);
    unoGame.startGame();
    mediumAIStrategy = new MediumAIStrategy(unoGame, aiPlayer.id);
  });

  it('should play the most beneficial card if available', () => {
    // Set up the game state where AI can play a beneficial action card
    unoGame.state.players[1].cards = [
      { color: 'Red', rank: '+2' }, // Action card
      { color: 'Green', rank: 7 },
      { color: 'Blue', rank: 4 },
    ];
    unoGame.state.topCard = { color: 'Red', rank: 5 };
    unoGame.state.currentPlayerIndex = 1;

    const move = mediumAIStrategy.makeMove();
    expect(move).toBeTruthy();
    expect(move?.move.card.rank).toBe('+2'); // AI should play '+2' action card
  });

  it('should draw a card if no cards are playable', () => {
    // Set up the game state where no cards are playable
    unoGame.state.players[1].cards = [
      { color: 'Green', rank: 3 },
      { color: 'Yellow', rank: 6 },
    ];
    unoGame.state.topCard = { color: 'Blue', rank: 9 };
    unoGame.state.currentPlayerIndex = 1;

    const initialDeckSize = unoGame.state.deck.length;
    mediumAIStrategy.makeMove();
    expect(unoGame.state.deck.length).toBeLessThan(initialDeckSize); // AI should have drawn a card
  });

  it('should not make a move if the AI player is not found', () => {
    // Create a new game where the AI player does not exist
    const gameWithoutAI = new UNOGame();
    gameWithoutAI._join(createPlayerForTesting());
    gameWithoutAI._join(createPlayerForTesting());
    gameWithoutAI.startGame();

    const strategyWithoutAI = new MediumAIStrategy(gameWithoutAI, 'nonexistentPlayerID');
    const move = strategyWithoutAI.makeMove();
    expect(move).toBeNull(); // No move should be made
  });

  it('should avoid playing Wild card early', () => {
    unoGame.state.players[1].cards = [
      { color: 'Red', rank: 5 },
      { color: 'Wildcard', rank: 'Wild' },
    ];
    unoGame.state.topCard = { color: 'Red', rank: 3 };
    unoGame.state.currentPlayerIndex = 1;

    const move = mediumAIStrategy.makeMove();
    expect(move).toBeTruthy();
    expect(move?.move.card.rank).not.toBe('Wild'); // AI should not play Wild card early
  });

  it('should play action card to disrupt opponent close to winning', () => {
    unoGame.state.players[0].cards = [
      { color: 'Red', rank: 6 },
      { color: 'Green', rank: 7 },
    ];
    unoGame.state.players[1].cards = [
      { color: 'Red', rank: 'Skip' },
      { color: 'Blue', rank: 4 },
    ];
    unoGame.state.topCard = { color: 'Red', rank: 3 };
    unoGame.state.currentPlayerIndex = 1;

    const move = mediumAIStrategy.makeMove();
    expect(move).toBeTruthy();
    expect(move?.move.card.rank).toBe('Skip'); // AI should play 'Skip' card
  });

  it('should save powerful cards for critical situations', () => {
    // Setting up a game state where AI should save the '+4' card
    unoGame.state.players[0].cards = [
      { color: 'Red', rank: 5 },
      { color: 'Red', rank: 3 },
      { color: 'Red', rank: 2 },
      { color: 'Blue', rank: 4 },
    ];
    unoGame.state.players[1].cards = [
      { color: 'Red', rank: 6 },
      { color: 'Wildcard', rank: '+4' }, // AI has a '+4'
    ];
    unoGame.state.topCard = { color: 'Red', rank: 7 };

    // Ensuring other players have more than two cards
    for (const player of unoGame.state.players) {
      while (player.cards.length <= 2) {
        unoGame.state.deck.push({ color: 'Red', rank: 3 });
        player.cards.push({ color: 'Red', rank: 3 });
      }
    }

    // Apply a human player's move to update the game state
    const unoMove1: UNOMove = {
      player: humanPlayer.id,
      card: { color: 'Red', rank: 5 },
    };
    unoGame.applyMove({
      move: unoMove1,
      playerID: humanPlayer.id,
      gameID: unoGame.id,
    });

    // AI makes its move
    const move = mediumAIStrategy.makeMove();
    // AI should not play the '+4' card in this situation
    expect(move).toBeTruthy();
    expect(move?.move.card.rank).not.toBe('+4');
  });
});
