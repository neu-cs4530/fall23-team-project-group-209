import UNOGame from './UNOGame';
import { createPlayerForTesting } from '../../TestUtils';
import {
  CARD_NOT_FOUND_IN_HAND,
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  NOT_PLAYER_TURN,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import { Card, UNOMove } from '../../types/CoveyTownSocket';
import Player from '../../lib/Player';

describe('UNOGame', () => {
  let game: UNOGame;
  const player1 = createPlayerForTesting();
  const player2 = createPlayerForTesting();

  beforeEach(() => {
    game = new UNOGame();
    game.join(player1);
    game.join(player2);
  });
  describe('drawCard', () => {
    test("should successfully allow a player to draw a card if it's their turn", () => {
      game.startGame();
      const initialDeckSize = game.state.deck.length;
      game.drawCard(player1.id);
      expect(game.state.players[0].cards).toHaveLength(8);
      expect(game.state.deck).toHaveLength(initialDeckSize - 1);
    });

    test("should throw an error if a player tries to draw a card when it's not their turn", () => {
      game.startGame();
      expect(() => game.drawCard(player2.id)).toThrowError(NOT_PLAYER_TURN);
    });

    test("should add a card to the player's hand", () => {
      game.startGame();
      expect(game.state.players[0].cards).toHaveLength(7);
      game.drawCard(player1.id);
      expect(game.state.players[0].cards).toHaveLength(8);
    });

    test('should reduce the deck size by one', () => {
      game.startGame();
      const initialDeckSize = game.state.deck.length;
      game.drawCard(player1.id);
      expect(game.state.deck).toHaveLength(initialDeckSize - 1);
    });

    test('should create and shuffle a new deck if the deck is empty', () => {
      game.startGame();
      // Empty the deck... MANUALLY
      game.state.deck = [];
      game.drawCard(player1.id);
      expect(game.state.deck.length).toBeGreaterThan(0);
    });

    test('should throw an error if the game state is not IN_PROGRESS', () => {
      // Aaaaannd this test is why we didn't put startGamein the beforeEach
      expect(() => game.drawCard(player1.id)).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
    });

    test('should throw an error if the player is not found', () => {
      game.startGame();
      expect(() => game.drawCard('nonexistentplayer')).toThrowError(NOT_PLAYER_TURN);
      // the not_player_turn is called when handling whether the id's exist where it's supposed to.
    });

    test('should handle cases where no card is available to draw', () => {
      game.startGame();
      // Empty the deck and disable reshuffling
      game.state.deck = [];
      expect(() => game.drawCard(player1.id)).not.toThrowError('No cards available to draw');
      // there is also an else statement at the end which catches this - but this should be fine.
    });

    test('should not allow drawing a card if the game is over', () => {
      game.startGame();
      game.state.status = 'OVER';
      expect(() => game.drawCard(player1.id)).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
    });

    test('should update the game state correctly after a card is drawn', () => {
      game.startGame();
      game.drawCard(player1.id);
      expect(game.state.players[0].cards).toHaveLength(8);
      expect(game.state.deck.length).toBeLessThan(108);
    });
    test('should ensure other players can also draw smoothly and deck length continues to go down', () => {
      game.startGame();
      game.drawCard(player1.id);
      expect(game.state.players[0].cards).toHaveLength(8);
      expect(game.state.deck.length).toBeLessThan(108);
    });
  });

  describe('applyMove', () => {
    const redZero: Card = {
      color: 'Red',
      rank: 0,
    };
    const redFour: Card = {
      color: 'Red',
      rank: 4,
    };
    const blueZero: Card = {
      color: 'Blue',
      rank: 0,
    };
    const greenFive: Card = {
      color: 'Green',
      rank: 5,
    };
    const unoMove1: UNOMove = {
      // make sure to give a player this uno move to their deck
      player: player1.id,
      card: redZero,
    };
    beforeEach(() => {
      game.startGame();
    });
    it('should correctly apply a valid move - color check', () => {
      const playerHasRedZero = game.state.players[0].cards.some(
        card => card.color === redZero.color && card.rank === redZero.rank,
      );

      // Add redzero to the player's deck if they don't have it
      if (!playerHasRedZero) {
        game.state.players[0].cards.push(redZero);
      }
      game.state.topCard = redFour;
      game.applyMove({
        move: unoMove1,
        playerID: player1.id,
        gameID: game.id,
      });
      expect(game.state.topCard).toEqual(unoMove1.card);
      expect(game.state.players[0].cards).not.toContain(unoMove1.card);
      expect(game.state.currentPlayerIndex).toBe(1);
    });
    it('should correctly apply a valid move - rank check', () => {
      const playerHasRedZero = game.state.players[0].cards.some(
        card => card.color === redZero.color && card.rank === redZero.rank,
      );

      // Add redzero to the player's deck if they don't have it
      if (!playerHasRedZero) {
        game.state.players[0].cards.push(redZero);
      }
      game.state.topCard = blueZero;
      game.applyMove({
        move: unoMove1,
        playerID: player1.id,
        gameID: game.id,
      });
      expect(game.state.topCard).toEqual(unoMove1.card);
      expect(game.state.players[0].cards).not.toContain(unoMove1.card);
      expect(game.state.currentPlayerIndex).toBe(1);
    });

    it('should throw an error if the move is invalid', () => {
      game.state.players[0].cards = [greenFive];
      game.state.topCard = blueZero;

      expect(() =>
        game.applyMove({
          move: unoMove1,
          playerID: player1.id,
          gameID: game.id,
        }),
      ).toThrowError(CARD_NOT_FOUND_IN_HAND);
    });

    it('should update the top card of the deck', () => {
      const playerHasRedZero = game.state.players[0].cards.some(
        card => card.color === redZero.color && card.rank === redZero.rank,
      );

      // Add redZero to the player's deck if they don't have it
      if (!playerHasRedZero) {
        game.state.players[0].cards.push(redZero);
      }
      game.state.topCard = blueZero;
      game.applyMove({
        move: unoMove1,
        playerID: player1.id,
        gameID: game.id,
      });
      expect(game.state.topCard).toEqual(unoMove1.card);
    });

    it("should remove the played card from the player's hand", () => {
      const playerHasRedZero = game.state.players[0].cards.some(
        card => card.color === redZero.color && card.rank === redZero.rank,
      );

      // Add redZero to the player's deck if they don't have it
      if (!playerHasRedZero) {
        game.state.players[0].cards.push(redZero);
      }
      game.state.topCard = blueZero;
      game.applyMove({
        move: unoMove1,
        playerID: player1.id,
        gameID: game.id,
      });
      expect(game.state.players[0].cards).not.toContain(unoMove1.card);
    });

    it("should throw an error if the player's turn is not correct", () => {
      const move: UNOMove = {
        player: player2.id,
        card: {
          color: 'Blue',
          rank: 7,
        },
      };

      // Expect an error to be thrown because it's player1's turn, not player2's
      expect(() =>
        game.applyMove({
          move,
          playerID: player2.id,
          gameID: game.id,
        }),
      ).toThrowError(NOT_PLAYER_TURN);
    });

    it("should update the game state to 'OVER' if a player wins", () => {
      game.state.players[0].cards = [redZero]; // Only one card left
      game.state.topCard = blueZero;
      game.applyMove({
        move: unoMove1,
        playerID: player1.id,
        gameID: game.id,
      });
      expect(game.state.status).toEqual('OVER');
      expect(game.state.winner).toEqual(player1.id);
    });

    it("should correctly handle 'Skip' cards", () => {
      const skipCard: Card = { color: 'Yellow', rank: 'Skip' };
      const skipMove: UNOMove = { player: player1.id, card: skipCard };
      game.state.players[0].cards.push(skipCard);
      game.state.topCard = { color: 'Yellow', rank: 4 };
      game.applyMove({
        move: skipMove,
        playerID: player1.id,
        gameID: game.id,
      });
      expect(game.state.currentPlayerIndex).toBe(0);
    });

    it("should correctly handle 'Reverse' cards", () => {
      const reverseCard: Card = { color: 'Green', rank: 'Reverse' };
      const reverseMove: UNOMove = { player: player1.id, card: reverseCard };
      game.state.players[0].cards.push(reverseCard);
      game.state.topCard = { color: 'Green', rank: 5 };
      game.applyMove({
        move: reverseMove,
        playerID: player1.id,
        gameID: game.id,
      });
      expect(game.state.playDirection).toBe('counterclockwise');
    });

    it("should handle the draw stack correctly for '+2' cards", () => {
      const plusTwoCard: Card = { rank: '+2', color: 'Green' };
      game.state.players[0].cards = [redZero];
      game.state.players[1].cards = [blueZero];

      game.state.players[0].cards.push(plusTwoCard);
      game.state.topCard = { rank: 4, color: 'Green' }; // A card that allows '+2' to be played (both green)

      const plusTwoMove: UNOMove = { player: player1.id, card: plusTwoCard };
      game.applyMove({ move: plusTwoMove, playerID: player1.id, gameID: game.id });
      expect(game.state.drawStack).toBe(2);
    });
    it("should handle the draw stack correctly for '+4' cards", () => {
      const plusFourCard: Card = { rank: '+4', color: 'Wildcard' };
      game.state.players[0].cards = [redZero];
      game.state.players[1].cards = [blueZero];
      game.state.players[1].cards.push(plusFourCard);
      game.state.topCard = { rank: 5, color: 'Red' }; // A card that allows '+4' to be played

      game.state.currentPlayerIndex = 1;

      const plusFourMove = { player: player2.id, card: plusFourCard };
      game.applyMove({ move: plusFourMove, playerID: player2.id, gameID: game.id });
      expect(game.state.drawStack).toBe(4);
    });

    it('should throw an error if the game is not in progress', () => {
      game.state.status = 'WAITING_TO_START'; // Set the game status to a state that is not in progress
      const move: UNOMove = {
        player: player1.id,
        card: {
          color: 'Blue',
          rank: 7,
        },
      };
      // Expect an error to be thrown because the game is not in progress
      expect(() =>
        game.applyMove({
          move,
          playerID: player1.id,
          gameID: game.id,
        }),
      ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
    });

    it('should update the current player index correctly', () => {
      const playerHasRedZero = game.state.players[0].cards.some(
        card => card.color === redZero.color && card.rank === redZero.rank,
      );

      // Add redThree to the player's deck if they don't have it
      if (!playerHasRedZero) {
        game.state.players[0].cards.push(redZero);
      }
      game.state.topCard = blueZero;
      game.applyMove({
        move: unoMove1,
        playerID: player1.id,
        gameID: game.id,
      });
      expect(game.state.currentPlayerIndex).toBe(1);
    });
  });

  describe('_join', () => {
    let newGame: UNOGame;
    beforeEach(() => {
      newGame = new UNOGame();
    });
    it('should allow a player to join if there is room', () => {
      const newPlayer1 = createPlayerForTesting();
      newGame._join(newPlayer1);
      const newPlayer2 = createPlayerForTesting();
      newGame._join(newPlayer2);
      game.startGame();
      expect(newGame.state.players[0].id).toContain(newPlayer1.id);
      expect(newGame.state.players[1].id).toContain(newPlayer2.id);
    });
    it('should throw an error if the player is already in the game', () => {
      const newPlayer = createPlayerForTesting();
      newGame._join(newPlayer);
      expect(() => newGame._join(newPlayer)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    });

    it('should throw an error if the game is full', () => {
      for (let i = 0; i < newGame.MAX_PLAYERS; i++) {
        newGame._join(createPlayerForTesting());
      }
      expect(() => newGame._join(createPlayerForTesting())).toThrowError(GAME_FULL_MESSAGE);
    });

    it('should start the game automatically when max players join', () => {
      for (let i = 0; i < newGame.MAX_PLAYERS; i++) {
        newGame._join(createPlayerForTesting());
      }
      expect(newGame.state.status).toEqual('IN_PROGRESS');
    });

    it('should correctly initialize a new player in the game', () => {
      const newPlayer = createPlayerForTesting();
      newGame._join(newPlayer);
      const addedPlayer = newGame.state.players.find(p => p.id === newPlayer.id);
      expect(addedPlayer).toBeDefined();
      if (addedPlayer) {
        expect(addedPlayer.cards).toEqual([]);
      }
      if (!addedPlayer) {
        expect(addedPlayer).toBeDefined();
      }
    });

    it('should maintain the order of players as they join', () => {
      const newPlayer1 = createPlayerForTesting();
      newGame._join(newPlayer1);
      const newPlayer2 = createPlayerForTesting();
      newGame._join(newPlayer2);
      expect(newGame.state.players[0].id).toEqual(newPlayer1.id);
      expect(newGame.state.players[1].id).toEqual(newPlayer2.id);
    });
  });

  describe('startGame', () => {
    let newGame: UNOGame;
    beforeEach(() => {
      newGame = new UNOGame();
      newGame._join(createPlayerForTesting());
      newGame._join(createPlayerForTesting());
      newGame.startGame();
    });
    it('should set the game state to IN_PROGRESS', () => {
      expect(newGame.state.status).toEqual('IN_PROGRESS');
    });

    it('should throw an error if there are not enough players', () => {
      const throwAwayGame = new UNOGame();
      throwAwayGame._join(createPlayerForTesting());
      expect(() => throwAwayGame.startGame()).toThrowError('NOT_ENOUGH_PLAYERS');
    });

    it('should initialize the deck correctly', () => {
      expect(newGame.state.deck.length).toBeGreaterThan(0);
    });

    it('should distribute cards to all players', () => {
      newGame.state.players.forEach(player => {
        expect(player.cards.length).toBeGreaterThan(0);
      });
    });

    it('should set the initial top card correctly', () => {
      expect(newGame.state.topCard).toBeDefined();
    });

    it('should reset properly when resetting', () => {
      newGame.state.status = 'OVER';
      newGame.startGame();
      expect(newGame.state.status).toEqual('IN_PROGRESS');
      expect(newGame.state.players.every(player => player.cards.length === 0)).toBe(false);
    });

    it('starts new game when start game is called while in progres', () => {
      expect(() => newGame.startGame());
    });

    it('should set the currentPlayerIndex correctly', () => {
      expect(newGame.state.currentPlayerIndex).toBe(0); // Assuming the first player starts
    });

    it('should initialize the play direction correctly', () => {
      expect(newGame.state.playDirection).toEqual('clockwise');
    });
  });

  describe('_leave', () => {
    let leaveGame: UNOGame;
    let p1: Player;
    let p2: Player;
    let p3: Player;

    beforeEach(() => {
      leaveGame = new UNOGame();
      p1 = createPlayerForTesting();
      p2 = createPlayerForTesting();
      p3 = createPlayerForTesting();
      leaveGame._join(p1);
      leaveGame._join(p2);
      leaveGame.startGame();
    });

    it('should remove a player correctly from the game', () => {
      leaveGame.leave(p1);
      expect(leaveGame.state.players.some(p => p.id === p1.id)).toBe(false);
    });

    // it('should throw an error if the player is not in the game', () => {
    //   expect(() => leaveGame.leave(p3)).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
    // });

    it('should handle the game state when the game has not started', () => {
      const newGame = new UNOGame();
      const newPlayer = createPlayerForTesting();
      newGame._join(newPlayer);
      newGame.leave(newPlayer);
      expect(newGame.state.status).toEqual('OVER');
    });

    it('should update player count correctly', () => {
      const throwaway: UNOGame = new UNOGame();
      p1 = createPlayerForTesting();
      p2 = createPlayerForTesting();
      throwaway._join(p1);
      throwaway._join(p2);
      throwaway.leave(p1);
      expect(throwaway.state.players.length).toBe(1);
    });

    it('should handle cases where multiple players leave', () => {
      leaveGame.join(p3); // Adding a third player
      leaveGame.leave(p1);
      leaveGame.leave(p2);
      expect(leaveGame.state.players.length).toBe(1);
      expect(leaveGame.state.players[0].id).toEqual(p3.id);
    });
  });

  describe('colorChange', () => {
    let colorChangeGame: UNOGame;
    let currentPlayer: Player;
    let otherPlayer: Player;

    beforeEach(() => {
      colorChangeGame = new UNOGame();
      currentPlayer = createPlayerForTesting();
      otherPlayer = createPlayerForTesting();

      colorChangeGame._join(currentPlayer);
      colorChangeGame._join(otherPlayer);

      colorChangeGame.startGame();
    });

    it('should throw an error if the game is not in progress', () => {
      colorChangeGame.state.status = 'WAITING_TO_START';
      expect(() => colorChangeGame.colorChange('Red')).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
    });

    it('should throw an error if the color is invalid', () => {
      // Typescript itself throws the error so this is fine.
    });

    it('should change the color of all Wild and Wild Draw Four cards', () => {
      const newColor = 'Green';
      colorChangeGame.colorChange(newColor);
      game.state.players[0].cards.forEach(card => {
        if (card.rank === 'Wild' || card.rank === '+4') {
          expect(card.color).toEqual(newColor);
        }
      });
    });

    it('should not affect cards other than Wild and Wild Draw Four', () => {
      const originalCards = game.state.players[0].cards.map(card => ({ ...card }));
      colorChangeGame.colorChange('Blue');
      game.state.players[0].cards.forEach((card, index) => {
        if (card.rank !== 'Wild' && card.rank !== '+4') {
          expect(card).toEqual(originalCards[index]);
        }
      });
    });

    it('should throw an error if the current player is not found', () => {
      // Setting to index that WILL fail.
      colorChangeGame.state.currentPlayerIndex = -1;
      expect(() => colorChangeGame.colorChange('Red')).toThrowError('CURRENT_PLAYER_NOT_FOUND');
    });
  });
  describe('joinAI', () => {
    let joinAIGame: UNOGame;
    let humanPlayer1: Player;

    beforeEach(() => {
      joinAIGame = new UNOGame();
      humanPlayer1 = createPlayerForTesting();
      joinAIGame._join(humanPlayer1);
    });

    it('should throw an error if the game is full', () => {
      for (let i = 0; i < joinAIGame.MAX_PLAYERS - 1; i++) {
        joinAIGame._join(createPlayerForTesting());
      }
      expect(() => joinAIGame.joinAI('Easy')).toThrowError(GAME_FULL_MESSAGE);
    });

    it('should replace a non-AI player with an AI player', () => {
      joinAIGame.joinAI('Easy');
      const replacedPlayer = joinAIGame.state.players.find(player => player.id === humanPlayer1.id);
      if (replacedPlayer) {
        expect(replacedPlayer.isAI).toBe(true);
      } else {
        expect(1).toBe(2);
      }
    });
  });
  describe('_validMove', () => {
    let validMoveGame: UNOGame;
    let p1: Player;
    let p2: Player;

    beforeEach(() => {
      validMoveGame = new UNOGame();
      p1 = createPlayerForTesting();
      p2 = createPlayerForTesting();
      validMoveGame._join(p1);
      validMoveGame._join(p2);
      validMoveGame.startGame();
    });

    it("should throw an error if it is not the player's turn", () => {
      const move: UNOMove = {
        player: p2.id,
        card: { color: 'Red', rank: 5 },
      };
      expect(() => validMoveGame._validMove(move)).toThrowError(NOT_PLAYER_TURN);
    });

    it('should return true if the move is valid', () => {
      const move: UNOMove = {
        player: p1.id,
        card: { color: 'Blue', rank: 3 },
      };
      expect(validMoveGame._validMove(move)).toBe(true);
    });
    it('should return true if the move is not valid', () => {
      // Typescript actually checks for these type errors and enforces so this makes my life easier.
    });

    it('should throw an error if the player making the move is not the current player', () => {
      const move: UNOMove = {
        player: p2.id,
        card: { color: 'Green', rank: 2 },
      };
      validMoveGame.state.currentPlayerIndex = 0;
      expect(() => validMoveGame._validMove(move)).toThrowError(NOT_PLAYER_TURN);
    });
  });
});
