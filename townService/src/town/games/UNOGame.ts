import InvalidParametersError, {
  CARD_NOT_FOUND_IN_HAND,
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  NOT_PLAYER_TURN,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_FOUND_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import {
  Card,
  CardColor,
  GameMove,
  UNOGameState,
  UNOMove,
  UNOPlayer,
  UNOSuit,
} from '../../types/CoveyTownSocket';
import Game from './Game';
// eslint-disable-next-line import/no-cycle
import EasyAIStrategy from './unoAi/EasyAi';
// eslint-disable-next-line import/no-cycle
import MediumAIStrategy from './unoAi/MediumAi';

/**
 * @see README.md (and scroll to the section added at the bottom talking about rule changes.)
 * Everything is outlined further here as needed.
 * Represents a game of UNO, extending the generic Game class functionality
 * with specific logic for UNO
 */
export default class UNOGame extends Game<UNOGameState, UNOMove> {
  /**
   * Initializes a new UNO game with the default settings
   */
  public constructor() {
    super({
      // Initializes the game state setup
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

  // Maximum number of players allowed in the game.
  MAX_PLAYERS = 4;

  private _aiStrategies: { [playerId: string]: EasyAIStrategy | MediumAIStrategy } = {};

  // Minimum number of players required to start the game
  MIN_PLAYERS = 2;

  /**
   * Resets the game state to its initial configuration.
   * This is typically used at the start of a new game.
   */
  private _resetGameState(): void {
    this.state = {
      moves: [],
      deck: this._makeDeck(),
      players: this.state.players.map(player => ({ ...player, cards: [] })),
      topCard: undefined,
      status: 'WAITING_TO_START',
      currentPlayerIndex: 0,
      playDirection: 'clockwise',
      drawStack: 0,
    };
  }

  /**
   * Initializes the game, shuffling and distributing cards among players.
   * Also sets the initial top card of the game.
   */
  private _initializeGame() {
    const tdeck = this._makeDeck();
    this.state.deck = [];
    if (!this._validDeck(tdeck)) {
      throw new Error('SHOULD THIS ERROR BE IN THE VALID DECK? CAN WE JUST DO THAT?');
    }

    // Initialize the deck in the state if it's undefined
    if (this.state.deck === undefined) {
      this.state.deck = [];
    }

    // Assign the validated and shuffled deck to the state
    this.state.deck = tdeck;
    // give 7 cards to each player. If cards run out, then make a new deck and add it to game somehow.

    this.state.players.forEach(player => {
      for (let i = 0; i < 7; i++) {
        // Check if the deck has enough cards
        if (this.state.deck.length === 0) {
          const newDeck = this._makeDeck();
          this.state.deck.push(...newDeck);
        }
        // Give the top card from the deck to the player
        const card = this.state.deck.pop();
        if (card) {
          player.cards.push(card);
        }
      }
    });

    // Set the initial top card from the deck
    let topCard = this.state.deck.pop();
    while (topCard && (topCard.rank === '+4' || topCard.rank === 'Wild' || topCard.rank === '+2')) {
      // Ensure the starting card is not a Wild or Wild Draw Four
      this.state.deck.unshift(topCard); // Place it back at the bottom
      this._shuffleDeck(this.state.deck); // Shuffle again
      topCard = this.state.deck.pop(); // Draw a new top card
    }
    this.state.topCard = topCard;
  }
  /**
   * Updates the draw stack based on the played card.
   * This is used for action cards like '+2' and '+4'.
   *
   * @param {Card} card - The card that was played.
   */

  private _updateDeckStack(card: Card) {
    if (card.rank === '+2') {
      this.state.drawStack += 2;
    } else if (card.rank === '+4') {
      this.state.drawStack += 4;
    }
  }

  /**
   * Updates the current player's index and the direction of play.
   * This accounts for action cards like 'Reverse' and 'Skip'.
   *
   * @param {UNOMove} move - The move that was played.
   * @param {ReadonlyArray<UNOPlayer>} players - The list of players in the game.
   * @return {number} The index of the next player.
   */
  private _updateCurrentPlayerIndexAndDir(
    move: UNOMove,
    players: ReadonlyArray<UNOPlayer>,
  ): number {
    if (!move.card) {
      // Since a move should always have a card, throw an error or handle this unexpected case
      throw new Error('Invalid move: no card played.');
    }
    const cardRank = move.card.rank;
    const numPlayers = players.length;

    // Update direction and currentPlayerIndex for Reverse card
    if (cardRank === 'Reverse') {
      this.state.playDirection =
        this.state.playDirection === 'clockwise' ? 'counterclockwise' : 'clockwise';
      // Move to the previous player in the new direction
      this.state.currentPlayerIndex = (this.state.currentPlayerIndex - 1 + numPlayers) % numPlayers;
    } else if (cardRank === 'Skip') {
      // Skip the next player
      this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 2) % numPlayers;
    } else {
      // Move to the next player
      this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % numPlayers;
    }
    return this.state.currentPlayerIndex;
  }
  /**
   * Checks whether the current game state is valid for certain actions.
   * Throws an error if the game is not in progress.
   *
   * @return {boolean} True if the game state is valid.
   */

  private _validGameState(): boolean {
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    } else {
      return true;
    }
  }

  /**
   * Determines if it's the specified player's turn.
   *
   * @param {string} playerId - The ID of the player.
   * @return {boolean} True if it's the player's turn.
   */

  private _isPlayersTurn(playerId: string): boolean {
    const currentPlayerId = this.state.players[this.state.currentPlayerIndex].id;
    return playerId === currentPlayerId;
  }

  /**
   * Validates whether a move made by a player is valid.
   *
   * @param {UNOMove} move - The move to validate.
   * @return {boolean} True if the move is valid.
   */

  public _validMove(move: UNOMove): boolean {
    if (!this._isPlayersTurn(move.player)) {
      throw new InvalidParametersError(NOT_PLAYER_TURN);
    }
    const playerIdMakingMove = move.player;

    // Get the current player's ID based on currentPlayerIndex
    const currentPlayerId = this.state.players[this.state.currentPlayerIndex].id;

    // Check if the ID of the player making the move is the same as the current player's ID
    if (playerIdMakingMove === currentPlayerId) {
      return true;
    }
    throw new InvalidParametersError(NOT_PLAYER_TURN);
  }

  /**
   * Validates the integrity of the UNO deck.
   * Ensures that the deck has the correct number of cards of each color and rank,
   * including action and wild cards.
   *
   * @param {Card[]} deck - The deck to validate.
   * @return {boolean} True if the deck is valid.
   * @throws {InvalidParametersError} If the deck does not meet the required criteria.
   */

  private _validDeck(deck: Card[]): boolean {
    if (deck.length !== 108) {
      throw new InvalidParametersError('DECK_LENGTH_INCORRECT');
    }

    const colorCounts: { [key in CardColor]?: number } = {};
    const rankCounts = new Map<UNOSuit, number>();

    for (const card of deck) {
      colorCounts[card.color] = (colorCounts[card.color] || 0) + 1;
      rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
    }

    // Check number cards
    for (const color of ['Blue', 'Green', 'Red', 'Yellow'] as CardColor[]) {
      if (colorCounts[color] !== 25) {
        throw new InvalidParametersError('DECK_INTEGRITY_COMPROMISEDColor');
      }
      for (let i = 1; i <= 9; i++) {
        if (rankCounts.get(i as UNOSuit) !== 8) {
          throw new InvalidParametersError('DECK_INTEGRITY_COMPROMISEDRank');
        }
      }
    }

    // Check action cards
    for (const action of ['Skip', 'Reverse', '+2'] as UNOSuit[]) {
      if (rankCounts.get(action) !== 8) {
        throw new InvalidParametersError('DECK_INTEGRITY_COMPROMISEDAction');
      }
    }

    // Check wild and wild draw four cards
    if (rankCounts.get('Wild') !== 4 || rankCounts.get('+4') !== 4) {
      throw new InvalidParametersError('DECK_INTEGRITY_COMPROMISEDWild');
    }

    return true;
  }

  /**
   * Validates if a card can be legally played on the current top card.
   *
   * The method checks for color and rank matches and handles special conditions,
   * such as when there's an active draw stack (e.g., a series of +2's or +4's) and
   * the play of Wild and Wild Draw Four cards.
   *
   * @param {Card} card - The card that the player intends to play.
   * @param {Card} topCard - The current top card on the play stack.
   * @return {boolean} True if the card can be played, false otherwise.
   * @throws {InvalidParametersError} If the card cannot be played based on the game rules.
   */

  public _validCard(card: Card): boolean {
    const currTopCard = this.state.topCard;

    if (!currTopCard) {
      throw new InvalidParametersError(
        'Draw stack is greater than 0 but the top card is not valid',
      );
    }

    // If there's a draw stack, check if the card continues the stack
    if (this.state.drawStack > 0) {
      if (currTopCard.rank === '+4') {
        return card.rank === '+4';
      }
      if (currTopCard.rank === '+2') {
        return card.rank === '+2' || card.rank === '+4';
      }
      // if the top card is not +2 or +4, we throw an Error as this condition is not possible
      throw new InvalidParametersError(
        'Draw stack is greater than 0 but the top card is not valid',
      );
    }

    // Handle Wild and Wild Draw Four cards
    if (card.rank === 'Wild' || card.rank === '+4') {
      return true; // These can be played on any card if there's no draw stack
    }

    // Check if the colors match
    if (card.color === currTopCard.color) {
      return true;
    }

    // Check if the ranks match
    if (card.rank === currTopCard.rank) {
      return true;
    }

    // If none of the conditions are met, the card is not valid
    return false;
  }

  /**
   * Creates a new deck of UNO cards. This deck includes numbered cards, action cards,
   * and wild cards in appropriate proportions and colors.
   *
   * @return {Card[]} The newly created and shuffled deck of UNO cards.
   */

  private _makeDeck(): Card[] {
    const deck: Card[] = [];
    const colors: CardColor[] = ['Red', 'Green', 'Yellow', 'Blue'];

    // Add number cards for each color
    colors.forEach(color => {
      // One '0' card per color
      deck.push({ color, rank: 0 });

      // Two of each number from 1 to 9 for each color
      for (let num = 1; num <= 9; num++) {
        deck.push({ color, rank: num as UNOSuit });
        deck.push({ color, rank: num as UNOSuit });
      }

      // Add two Skip, Reverse, and Draw Two cards for each color
      ['Skip', 'Reverse', '+2'].forEach(action => {
        deck.push({ color, rank: action as UNOSuit });
        deck.push({ color, rank: action as UNOSuit });
      });
    });

    // Add Wild and Wild Draw Four cards (4 of each)
    for (let i = 0; i < 4; i++) {
      deck.push({ color: 'Wildcard', rank: 'Wild' });
      deck.push({ color: 'Wildcard', rank: '+4' });
    }

    // Shuffle the deck
    this._shuffleDeck(deck);
    return deck;
  }

  /**
   * Shuffles the provided deck of cards using a modern version of the Fisher-Yates shuffle algorithm.
   *
   * @param {Card[]} deck - The deck of cards to shuffle.
   */

  private _shuffleDeck(deck: Card[]): void {
    // Implement a shuffle algorithm to randomize the deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap elements
    }
  }

  /**
   * Determines whether the specified cards in a player's hand can defend against +2 or +4 cards.
   *
   * @param {Card[]} cards - The array of cards in the player's hand.
   * @return {boolean} True if the player can defend against +2 or +4 cards, false otherwise.
   */

  private _defendableCards(cards: Card[]): boolean {
    const currTopCard = this.state.topCard;

    if (!currTopCard) {
      return false; // In case there is no top card
    }

    if (currTopCard.rank === '+4') {
      // Player can only defend with a '+4' card
      return cards.some(card => card.rank === '+4');
    }
    if (currTopCard.rank === '+2') {
      // Player can defend with either '+2' or '+4' card
      return cards.some(card => card.rank === '+2' || card.rank === '+4');
    }
    return false; // No defense needed for other card types
  }

  /**
   * Removes a specified card from a player's hand. Used when a player places a card on the stack.
   *
   * @param {string} playerId - The ID of the player.
   * @param {Card} cardToRemove - The card to remove from the player's hand.
   * @throws Error if the player or card is not found.
   */

  private _removePlacedCardFromHand(playerId: string, cardToRemove: Card): void {
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    const cardIndex = player.cards.findIndex(
      c =>
        c.rank === cardToRemove.rank &&
        (cardToRemove.color === 'Wildcard' || c.color === cardToRemove.color),
    );

    if (cardIndex === -1) {
      throw new Error(CARD_NOT_FOUND_IN_HAND);
    }

    player.cards.splice(cardIndex, 1);
  }

  /**
   * Handles a player's request to draw a card from the deck.
   *
   * @param {string} playerId - The ID of the player drawing the card.
   */

  public drawCard(playerId: string) {
    this._validGameState();
    // Check if it's the player's turn
    if (!this._isPlayersTurn(playerId)) {
      throw new InvalidParametersError('NOT_PLAYER_TURN');
    }
    // Check if the deck is empty
    if (this.state.deck.length === 0) {
      // Create a new deck and shuffle it
      const newDeck = this._makeDeck();
      this._shuffleDeck(newDeck);
      this.state.deck.push(...newDeck);
    }

    // Draw the top card from the deck
    const card = this.state.deck.pop();

    // Find the player and add the card to their hand
    const player = this.state.players.find(p => p.id === playerId);
    if (player && card) {
      player.cards.push(card);
    } else {
      // Handle the case where the player is not found or no card is drawn
      throw new Error(PLAYER_NOT_FOUND_MESSAGE);
    }
  }

  /**
   * Applies a player's move to the game state.
   *
   * @param {GameMove<UNOMove>} placeCard - The move to be applied.
   */

  public applyMove(placeCard: GameMove<UNOMove>): void {
    if (placeCard.move.card === undefined) {
      throw new InvalidParametersError('NO CARD FOUND');
    }
    if (this.state.topCard === undefined) {
      throw new InvalidParametersError('TOP CARD UNDEFINED');
    }
    // Check if it's the correct player's turn
    if (!this._isPlayersTurn(placeCard.move.player)) {
      throw new InvalidParametersError('NOT_PLAYER_TURN');
    }

    if (!this._validGameState()) {
      throw new InvalidParametersError('NOT A VALID GAMESTATE WHEN MOVE APPLIED');
    }

    // Currently player
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];

    if (!this._defendableCards(currentPlayer.cards) && this.state.drawStack > 0) {
      // Check if the card is defendable
      // Add cards to the player's hand based on drawStack
      for (let i = 0; i < this.state.drawStack; i++) {
        this.drawCard(currentPlayer.id);
      }
      this.state.drawStack = 0;
    } else {
      if (!this._validCard(placeCard.move.card)) {
        throw new InvalidParametersError('NOT A VALID CARD WHEN MOVE APPLIED');
      }

      if (!this._validMove(placeCard.move)) {
        throw new InvalidParametersError('NOT A VALID MOVE WHEN MOVE APPLIED');
      }
      // Remove the card from the player's hand
      this._removePlacedCardFromHand(placeCard.move.player, placeCard.move.card);

      // Checking a win condition for current player
      if (currentPlayer.cards.length === 0) {
        // The player has no cards left and wins the game
        this.state.status = 'OVER';
        this.state.winner = currentPlayer.id;
        return; // Ending the game
      }
      this.state.topCard = placeCard.move.card;
    }
    this._updateCurrentPlayerIndexAndDir(placeCard.move, this.state.players);
    this._updateDeckStack(placeCard.move.card);

    const nextPlayer = this.state.players[this.state.currentPlayerIndex];

    // Handle AI player's turn
    if (nextPlayer.isAI) {
      if (this.state.drawStack > 0 && !this._defendableCards(nextPlayer.cards)) {
        // AI needs to draw cards due to the draw stack and has no defendable cards
        for (let i = 0; i < this.state.drawStack; i++) {
          this.drawCard(nextPlayer.id);
        }
        this.state.drawStack = 0;
        // Move to the next player after drawing
        this._updateCurrentPlayerIndexAndDir(placeCard.move, this.state.players);
      } else {
        // AI makes a move
        const aiMove = this._aiStrategies[nextPlayer.id].makeMove();
        if (aiMove?.move.card.rank === '+4' || aiMove?.move.card.rank === 'Wild') {
          aiMove.move.card.color = this.state.topCard.color;
        }
        if (aiMove) {
          this.applyMove(aiMove); // This is a recursive call, but controlled
        }
      }
    }
  }

  /**
   * Changes the color of all Wild and Wild Draw Four cards in the current player's hand.
   *
   * @param {CardColor} color - The new color to be set for these cards.
   * @throws {InvalidParametersError} If the game is not in progress or the color is invalid.
   */
  public colorChange(color: CardColor): void {
    // Ensure the game is in the correct state
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }

    // Validate the input color
    const validColors = ['Red', 'Green', 'Yellow', 'Blue'];
    if (!validColors.includes(color)) {
      throw new InvalidParametersError('INVALID_COLOR');
    }

    // Identify the current player
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];
    if (!currentPlayer) {
      throw new InvalidParametersError('CURRENT_PLAYER_NOT_FOUND');
    }

    // Iterate through the current player's hand and change the color of all Wild and +4 cards
    currentPlayer.cards.forEach(card => {
      if (card.rank === 'Wild' || card.rank === '+4') {
        card.color = color;
      }
    });
  }

  /**
   * Handles a player joining the game.
   *
   * @param {Player} player - The player attempting to join the game.
   */

  public _join(player: Player): void {
    // Check if the player is already in the game
    if (this.state.players.some(p => p.id === player.id)) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }
    // Check if there's room for the player to join
    if (this.state.players.length >= this.MAX_PLAYERS) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }

    // Convert Player to UNOPlayer
    const unoPlayer: UNOPlayer = {
      cards: [],
      id: player.id,
    };

    this.state.players = [...this.state.players, unoPlayer];
    if (this.state.players.length === this.MAX_PLAYERS) {
      this.startGame();
    }
  }

  public joinAI(difficulty: string): void {
    // Ensure the game isn't full
    if (this.state.players.length >= this.MAX_PLAYERS) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }

    // Find the last non-AI player to replace with an AI player
    const nonAIPlayer = [...this.state.players].reverse().find(player => !player.isAI);
    if (nonAIPlayer) {
      // Update the found player to be an AI player
      nonAIPlayer.isAI = true;

      // Initialize the appropriate AI logic based on the difficulty
      if (difficulty === 'Easy') {
        this._aiStrategies[nonAIPlayer.id] = new EasyAIStrategy(this, nonAIPlayer.id);
      } else if (difficulty === 'Med') {
        this._aiStrategies[nonAIPlayer.id] = new MediumAIStrategy(this, nonAIPlayer.id);
      } else {
        throw new InvalidParametersError('INVALID_DIFFICULTY');
      }
    } else {
      // Handle the case where all players are already AI or no players are in the game
      throw new InvalidParametersError('NO_HUMAN_PLAYER_TO_REPLACE');
    }

    // Start the game if the maximum number of players is reached
    if (this.state.players.length === this.MAX_PLAYERS) {
      this.startGame();
    }
  }

  /**
   * Starts the game if the minimum number of players is met.
   * Resets the game if it's in an 'OVER' state.
   */

  public startGame(): void {
    if (this.state.players.length < this.MIN_PLAYERS) {
      throw new InvalidParametersError('NOT_ENOUGH_PLAYERS_MESSAGE');
    }

    // Reset the game state if the game is restarting
    if (this.state.status === 'OVER') {
      this._resetGameState();
    }

    // Initialize the game if it is in progress
    this.state.status = 'IN_PROGRESS';
    this._initializeGame();
  }

  // how to handle the winner? if people leave, the last one standing is the winner
  // if players leave then update the players list -> filter function to get there
  // if it's 1v1

  // if player leaves and game

  // if a startgame button is pressed, start the game?
  // if people is valid and dadada
  // then start the game -> join game can call this function when gme is full.

  // Refactor leave, if the game was started with the Start Game button the code does not apply here.

  /**
   * Handles the process when a player leaves the game.
   * Updates the game state accordingly.
   */

  protected _leave(player: Player): void {
    // Check if the player is in the game
    // if (!this.state.players.some(p => p.id === player.id)) {
    //   throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    // }

    // Remove the player who is leaving
    this.state.players = this.state.players.filter(p => p.id !== player.id);

    // If the game has not started yet
    if (this.state.status === 'WAITING_TO_START' || this.state.players.length < this.MAX_PLAYERS) {
      this.state.status = 'WAITING_TO_START';
    }
    // If there are only two players left in an in-progress game and one leaves
    else if (this.state.players.length === 1 && this.state.status === 'IN_PROGRESS') {
      // Declare the remaining player as the winner
      this.state = {
        ...this.state,
        status: 'OVER',
        winner: this.state.players[0].id,
      };
    }

    this.state = {
      ...this.state,
      status: 'OVER',
    };
  }
}
