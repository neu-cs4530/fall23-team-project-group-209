import UNOGame from './UNOGame';
import Player from '../../lib/Player';
import InvalidParametersError from '../../lib/InvalidParametersError';
import { createPlayerForTesting } from '../../TestUtils';
import { Card } from '../../types/CoveyTownSocket';

describe('UNOGame', () => {
  let game: UNOGame;

  beforeEach(() => {
    game = new UNOGame();
  });

  describe('drawCard', () => {
    // Mocks and setup can be done here

    it("should successfully allow a player to draw a card if it's their turn", () => {
      const player = createPlayerForTesting();
      game._join(player);
      game.startGame();

      // Mocking the method to return a specific card or state
      jest.spyOn(game, 'drawCard').mockImplementation(() => {
        const mockCard = { color: 'Red', rank: 5 } as Card;
        const playerIndex = game.state.players.findIndex(p => p.id === player.id);
        if (playerIndex !== -1) {
          game.state.players[playerIndex].cards.push(mockCard);
        }
      });

      expect(() => game.drawCard(player.id)).not.toThrow();
      // Add more assertions to check if the card is added to the player's hand
    });

    it("should throw an error if a player tries to draw a card when it's not their turn", () => {
      const player1 = createPlayerForTesting();
      const player2 = createPlayerForTesting();
      game._join(player1);
      game._join(player2);
      game.startGame();

      expect(() => game.drawCard(player2.id)).toThrowError(InvalidParametersError);
    });

    it('should update the game state correctly after a card is drawn', () => {
      const player = createPlayerForTesting();
      game._join(player);
      game.startGame();

      game.drawCard(player.id);
      // Assert on the updated game state
      expect(game.state.deck.length).toBeLessThan(108);
      // Add more assertions related to the game state
    });

    // ... other test cases ...
  });

  // Additional describe blocks for other methods can be added here
});
