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
      status: 'IN_PROGRESS',
      currentPlayerIndex: 0,
      playDirection: 'clockwise',
      drawStack: 0,
    });
  }

  // TODO, make updateable.
  MAX_PLAYERS = 4;

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
    this._shuffleDeck(this.state.deck);
    // give 7 cards to each player. If cards run out, then make a new deck and add it to game somehow.

    this.state.players.forEach(player => {
      for (let i = 0; i < 7; i++) {
        // Check if the deck has enough cards
        if (this.state.deck.length === 0) {
          const newDeck = this._makeDeck();
          this._shuffleDeck(newDeck); // another shuffle cause why not - this might create testing issues (?)
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
    while (topCard && (topCard.rank === '+4' || topCard.rank === 'Wild')) {
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

  // TODO: Throw ERROR IF NOT VALID
  private _validMove(move: UNOMove): boolean {
    // Assuming UNOMove has a property 'playerId' which is the ID of the player making the move
    const playerIdMakingMove = move.player;

    // Get the current player's ID based on currentPlayerIndex
    const currentPlayerId = this.state.players[this.state.currentPlayerIndex].id;

    // Check if the ID of the player making the move is the same as the current player's ID
    return playerIdMakingMove === currentPlayerId;
  }

  // TODO: Throw ERROR IF NOT VALID
  private _validDeck(deck: Card[]): boolean {
    if (deck.length !== 108) {
      return false;
    }

    const colorCounts: { [key in CardColor]?: number } = {};
    const rankCounts = new Map<UNOSuit, number>();

    for (const card of deck) {
      colorCounts[card.color] = (colorCounts[card.color] || 0) + 1;
      rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
    }

    // Check number cards
    for (const color of ['Blue', 'Green', 'Red', 'Yellow'] as CardColor[]) {
      if (colorCounts[color] !== 19) {
        return false;
      }
      for (let i = 1; i <= 9; i++) {
        if (rankCounts.get(i as UNOSuit) !== 8) {
          return false;
        }
      }
    }

    // Check action cards
    for (const action of ['Skip', 'Reverse', '+2'] as UNOSuit[]) {
      if (rankCounts.get(action) !== 8) {
        return false;
      }
    }

    // Check wild and wild draw four cards
    if (rankCounts.get('Wild') !== 4 || rankCounts.get('+4') !== 4) {
      return false;
    }

    return true;
  }

  // check if a Card is valid to play on topCard
  // TODO: Throw ERROR IF NOT VALID
  private _validCard(card: Card, topCard: Card): boolean {
    // Check if the card is a Wild card (can be played on anything)
    if (card.rank === 'Wild' || card.rank === '+4') {
      return true;
    }

    // Check if the colors match (if the top card is not a Wild card)
    if (topCard.color !== 'Wildcard' && card.color === topCard.color) {
      return true;
    }

    // Check if the ranks match
    if (card.rank === topCard.rank) {
      return true;
    }

    // If none of the conditions are met, the card is not valid
    return false;
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

  // player draws a card from deck and puts it into their own card array. If there are no cards create new deck of cards
  // and append to deck to put new cards into play.
  public drawCard(playerId: string) {
    this._validGameState();
    // Check if player's turn:
    // TODO: DECOUPLE THE METHOD SO IT MAKES SENSE FOR THIS AS WELL
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
    this._validGameState();
    this._validCard(placeCard.move.card, this.state.topCard);
    this._validMove(placeCard.move);
    // check to see if it can defend
    // if not deal cards to THIS PLAYER
    this.state.topCard = placeCard.move.card;
    this._updateCurrentPlayerIndexAndDir(placeCard.move, this.state.players);
    this._updateDeckStack(placeCard.move.card);
  }

  // Refactor join, if the game was started with the Start Game button the code does not apply here.
  public _join(player: Player): void {
    // Check if the player is already in the game
    if (this.state.players.some(p => p.id === player.id)) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }
    // Check if there's room for the player to join
    if (this.state.players.length >= this.MAX_PLAYERS) {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }

    // Convert Player to UNOPlayer by adding the additional properties
    // SHOULD THIS BE IN THIS FUNCTION THIS IS KINDA BUSTED BROOO
    const unoPlayer: UNOPlayer = {
      ...player,
      cards: [],
      id: player.id,
      userName: player.userName,
    };

    this.state.players = [...this.state.players, unoPlayer];

    // what would make the game starts

    if (this.state.players.length === this.MAX_PLAYERS) {
      this.state = {
        ...this.state,
        status: 'IN_PROGRESS',
      };
      this._initializeGame();
    }
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
    // if player chooses to leave the game, this is what will happen.
    if (!this.state.players.find(() => player.id === this.id)) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    // Handles case where the game has not started yet
    if (this.state.players.length !== this.MAX_PLAYERS) {
      // Case where players are still queuing up
      this.state = {
        ...this.state,
        status: 'WAITING_TO_START',
      };
      // Remove the player who is leaving
      this.state.players = this.state.players.filter(() => player.id !== this.id);
    }

    // TALK TO GROUP ABOUT THIS BIT HERE:
    // if there are only two players left, and the game is actually in progress
    else {
      // if player is player 1 and the lobby is then inherently empty
      this.state = {
        ...this.state,
        status: 'OVER',
        winner: undefined, // maybe no winner
      };
    }
  }
}
