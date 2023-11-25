import UNOGame from './UNOGame';

// TODO, implement a before each and all that stuff up here.

describe('TicTacToeGame', () => {
  let game: UNOGame;
  // should I cast this game as any in order to test private methods?

  beforeEach(() => {
    game = new UNOGame();
  });
  describe('UNOGame constructor', () => {
    it('should initialize game state correctly', () => {
      expect(game.state).toEqual(
        expect.objectContaining({
          moves: [],
          deck: [],
          players: [],
          topCard: undefined,
          status: 'WAITING_TO_START',
          currentPlayerIndex: 0,
          playDirection: 'clockwise',
          drawStack: 0,
        }),
      );
    });
  });
  describe('_initializeGame', () => {
    it('should create a valid and shuffled deck', () => {
      game._initializeGame();
      expect(game.state.deck).toHaveLength(108); // Assuming 108 is the correct deck size
      // You can add more checks for the composition of the deck
    });

    it('should ensure the deck is shuffled', () => {
      // This test checks if the deck is shuffled by comparing the order of cards
      // with a newly created deck. It's a probabilistic test.
      const firstDeck = game._makeDeck();
      game._initializeGame();
      const secondDeck = game.state.deck;
      expect(secondDeck).not.toEqual(firstDeck);
    });
    it('should distribute 7 cards to each player', () => {
      game.join(players); // Make sure this correctly adds players
      game._initializeGame();
      game.state.players.forEach(player => {
        expect(player.cards).toHaveLength(7);
      });
    });
    it('should handle empty deck by creating a new deck', () => {
      game.join(players);
      game._initializeGame();
      // Manually empty the deck
      game.state.deck = [];
      game._initializeGame(); // Reinitialize to trigger deck replenishment
      expect(game.state.deck).not.toHaveLength(0);
    });
    it('should set an initial top card that is not a Wild or Wild Draw Four', () => {
      game.join(players);
      game._initializeGame();
      expect(game.state.topCard).toBeDefined();
      expect(['Wild', '+4']).not.toContain(game.state.topCard.rank);
    });
    it('should set game state to IN_PROGRESS after initialization', () => {
      game.join(players);
      game._initializeGame();
      expect(game.state.status).toBe('IN_PROGRESS');
    });
  });
  describe('_updateDeckStack', () => {
    it('should increase drawStack correctly for +2 and +4 cards', () => {
      game._updateDeckStack({ color: 'Red', rank: '+2' });
      expect(game.state.drawStack).toBe(2);
      game._updateDeckStack({ color: 'Blue', rank: '+4' });
      expect(game.state.drawStack).toBe(6);
    });
    it('should not change drawStack for non-draw cards', () => {
      const initialDrawStack = game.state.drawStack;
      game._updateDeckStack({ color: 'Green', rank: '5' });
      expect(game.state.drawStack).toBe(initialDrawStack);
    });
    it('should accumulate drawStack correctly for multiple draw cards', () => {
      game._updateDeckStack({ color: 'Red', rank: '+2' });
      game._updateDeckStack({ color: 'Blue', rank: '+2' });
      expect(game.state.drawStack).toBe(4);
    });
    it('should reset drawStack after being applied', () => {
      game._updateDeckStack({ color: 'Yellow', rank: '+4' });
      // Simulate drawing cards and resetting the stack
      game.state.drawStack = 0;
      expect(game.state.drawStack).toBe(0);
    });
    it('should handle invalid card inputs gracefully', () => {
      const initialDrawStack = game.state.drawStack;
      game._updateDeckStack({ color: 'InvalidColor', rank: 'InvalidRank' });
      expect(game.state.drawStack).toBe(initialDrawStack);
    });
    it('should work correctly with a full deck', () => {
      game._initializeGame(); // Assuming this populates the deck
      game._updateDeckStack({ color: 'Blue', rank: '+4' });
      expect(game.state.drawStack).toBe(4);
    });
  });

  describe('_validGameState', () => {
    it('should throw an error if game is not in progress', () => {
      expect(() => game._validGameState()).toThrow(InvalidParametersError);
    });
    it('should return true when the game is in progress', () => {
      game.state.status = 'IN_PROGRESS';
      expect(game._validGameState()).toBe(true);
    });
    it('should throw an error if the game is waiting to start', () => {
      game.state.status = 'WAITING_TO_START';
      expect(() => game._validGameState()).toThrow(InvalidParametersError);
    });

    it('should throw an error if the game is over', () => {
      game.state.status = 'OVER';
      expect(() => game._validGameState()).toThrow(InvalidParametersError);
    });
    it('should throw an error for invalid game states', () => {
      game.state.status = 'INVALID_STATE';
      expect(() => game._validGameState()).toThrow(InvalidParametersError);
    });
    it('should validate the game state after game initialization', () => {
      game.join(players); // Add players to start the game
      game.startGame(); // This should set the status to 'IN_PROGRESS'
      expect(game._validGameState()).toBe(true);
    });
    it('should throw an error when the game is completed', () => {
      game.join(players);
      game.startGame();
      // Simulate game completion
      game.state.status = 'OVER';
      expect(() => game._validGameState()).toThrow(InvalidParametersError);
    });
  });

  describe('_validDeck and _makeDeck', () => {
    it('should create a valid deck', () => {
      const deck = game._makeDeck();
      expect(game._validDeck(deck)).toBe(true);
    });
    it('should create a deck with the correct number of each card type', () => {
      const deck = game._makeDeck();
      const cardCounts = deck.reduce((counts, card) => {
        const key = `${card.color}-${card.rank}`;
        counts[key] = (counts[key] || 0) + 1;
        return counts;
      }, {});

      // Assuming specific counts for each card type
      expect(cardCounts['Red-0']).toBe(1);
      expect(cardCounts['Blue-Skip']).toBe(2);
      expect(cardCounts['Wildcard-Wild']).toBe(4);
      // Add checks for other cards as needed
    });
    it('should reject a deck with incorrect length', () => {
      const invalidDeck = game._makeDeck().slice(1); // Remove one card
      expect(() => game._validDeck(invalidDeck)).toThrow(InvalidParametersError);
    });
    it('should reject a deck missing specific card types', () => {
      const deck = game._makeDeck();
      const modifiedDeck = deck.filter(card => card.rank !== '+4'); // Remove '+4' cards
      expect(() => game._validDeck(modifiedDeck)).toThrow(InvalidParametersError);
    });
    it('should contain the correct number of each number card', () => {
      const deck = game._makeDeck();
      for (let i = 0; i <= 9; i++) {
        const count = deck.filter(card => card.rank === i).length;
        expect(count).toBe(8); // Assuming 8 of each number card
      }
    });
    it('should have the correct number of action and wild cards', () => {
      const deck = game._makeDeck();
      const actionCardCounts = {
        'Skip': 0,
        'Reverse': 0,
        '+2': 0,
        'Wild': 0,
        '+4': 0,
      };

      deck.forEach(card => {
        if (actionCardCounts.hasOwnProperty(card.rank)) {
          actionCardCounts[card.rank]++;
        }
      });

      expect(actionCardCounts.Skip).toBe(8);
      expect(actionCardCounts.Reverse).toBe(8);
      expect(actionCardCounts['+2']).toBe(8);
      expect(actionCardCounts.Wild).toBe(4);
      expect(actionCardCounts['+4']).toBe(4);
    });

    // Additional tests for invalid deck scenarios
  });

  describe('applyMove', () => {
    it('should apply a move and update the game state', () => {
      // Setup game state and players
      const move = { player: 'player1', card: { color: 'Red', rank: '5' } };
      game.applyMove({ move });
      // Assert state changes
    });

    // More tests for different move scenarios
  });

  describe('drawCard', () => {
    it('should allow a player to draw a card', () => {
      // Setup game state and players
      game.drawCard('player1');
      // Assertions
    });
  });
});
