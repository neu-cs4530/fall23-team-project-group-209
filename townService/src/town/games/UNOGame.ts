import InvalidParametersError, {
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
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

/**
 * @see README.md (and scroll to the section added at the bottom talking about rule changes.)
 * Everything is outlined further here as needed.
 */
export default class UNOGame extends Game<UNOGameState, UNOMove> {
  public constructor() {
    super({
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

  MAX_PLAYERS = 4;

  MIN_PLAYERS = 2;

  // Function to reset the game state.
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
   *
   * I think more logic needs to be updated, how will the game know if the player has no cards?
   * Applying a move should remove player cards
   * how will the game know when to force the player to draw cards?
   * How will the player draw cards?
   * how will cards be applied?
   * Applying a move should implement the move's specific properties(done)
   *
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

  private _updateDeckStack(card: Card) {
    if (card.rank === '+2') {
      this.state.drawStack += 2;
    } else if (card.rank === '+4') {
      this.state.drawStack += 4;
    }
  }

  // This function does one thing: Updates all the conditional factors after move has been made.
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

  private _validGameState(): boolean {
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    } else {
      return true;
    }
  }

  private _isPlayersTurn(playerId: string): boolean {
    const currentPlayerId = this.state.players[this.state.currentPlayerIndex].id;
    return playerId === currentPlayerId;
  }

  private _validMove(move: UNOMove): boolean {
    if (!this._isPlayersTurn(move.player)) {
      throw new InvalidParametersError('NOT_PLAYER_TURN');
    }

    // THIS is refundant code vvv
    const playerIdMakingMove = move.player;

    // Get the current player's ID based on currentPlayerIndex
    const currentPlayerId = this.state.players[this.state.currentPlayerIndex].id;

    // Check if the ID of the player making the move is the same as the current player's ID
    if (playerIdMakingMove === currentPlayerId) {
      return true;
    }
    throw new InvalidParametersError('NOT_PLAYER_TURN');
  }

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

  // check if a Card is valid to play on topCard
  // TODO: Throw ERROR IF NOT VALID
  private _validCard(card: Card, topCard: Card): boolean {
    // If there's a draw stack, check if the card continues the stack
    if (this.state.drawStack > 0) {
      if (topCard.rank === '+4') {
        return card.rank === '+4';
      }
      if (topCard.rank === '+2') {
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
    if (card.color === topCard.color) {
      return true;
    }

    // Check if the ranks match
    if (card.rank === topCard.rank) {
      return true;
    }

    // If none of the conditions are met, the card is not valid
    throw new InvalidParametersError('INVALID_CARD');
  }

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

  private _shuffleDeck(deck: Card[]): void {
    // Implement a shuffle algorithm to randomize the deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap elements
    }
  }

  // when it's the player's turn, it should check if they have any playable cards in their deck against +2's or +4s
  private _defendableCards(cards: Card[]): boolean {
    return cards.some(card => card.rank === '+2' || card.rank === '+4');
  }

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
      throw new Error('Card not found in player hand');
    }

    player.cards.splice(cardIndex, 1);
  }

  // player draws a card from deck and puts it into their own card array. If there are no cards create new deck of cards
  // and append to deck to put new cards into play.
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
      throw new Error('Player not found or no card to draw');
    }
  }

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

    this._validGameState();
    this._validCard(placeCard.move.card, this.state.topCard);
    this._validMove(placeCard.move);

    // Remove the card from the player's hand
    this._removePlacedCardFromHand(placeCard.move.player, placeCard.move.card);

    // Currently player
    const currentPlayer = this.state.players[this.state.currentPlayerIndex];

    // Checking a win condition for current player
    if (currentPlayer.cards.length === 0) {
      // The player has no cards left and wins the game
      this.state.status = 'OVER';
      this.state.winner = currentPlayer.id;
      return; // Ending the game
    }
    // Check if the card is defendable
    if (!this._defendableCards(currentPlayer.cards) && this.state.drawStack > 0) {
      // Add cards to the player's hand based on drawStack
      for (let i = 0; i < this.state.drawStack; i++) {
        this.drawCard(currentPlayer.id);
      }
      this.state.drawStack = 0;
    }

    this.state.topCard = placeCard.move.card;
    // Need to add this to
    // this._removePlacedCardFromHand(placeCard.move.card);
    this._updateCurrentPlayerIndexAndDir(placeCard.move, this.state.players);
    this._updateDeckStack(placeCard.move.card);
  }

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

  protected _leave(player: Player): void {
    // Check if the player is in the game
    if (!this.state.players.some(p => p.id === player.id)) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }

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
