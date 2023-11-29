// eslint-disable-next-line import/no-cycle
import UNOGame from '../UNOGame';

import { Card, UNOPlayer, GameMove, UNOMove, UNOSuit } from '../../../types/CoveyTownSocket';

/**
 * Represents the count of each color of cards.
 */
type ColorCount = {
  Blue?: number;
  Green?: number;
  Red?: number;
  Yellow?: number;
  [key: string]: number | undefined;
};

/**
 * Priority values for action card ranks.
 */
const actionCardRanks: { [key in UNOSuit]?: number } = {
  '+4': 4,
  'Wild': 3,
  'Skip': 2,
  'Reverse': 2,
  '+2': 2,
};

/**
 * MediumAIStrategy class provides a medium-level artificial intelligence strategy for playing UNO.
 */
class MediumAIStrategy {
  private _game: UNOGame;

  private _aiPlayerID: string;

  /**
   * Constructs an instance of MediumAIStrategy.
   * @param {UNOGame} game - The game instance.
   * @param {string} aiPlayerID - The ID of the AI player.
   */
  constructor(game: UNOGame, aiPlayerID: string) {
    this._game = game;
    this._aiPlayerID = aiPlayerID;
  }

  /**
   * Determines and executes the next move for the AI player.
   * @return {GameMove<UNOMove> | null} The game move or null if no move is possible.
   */
  public makeMove(): GameMove<UNOMove> | null {
    const aiPlayer = this._game.state.players.find(player => player.id === this._aiPlayerID);

    if (!aiPlayer || !this._game.id) {
      return null;
    }

    // Enhanced logic for smarter decision making
    const bestMove = this._determineBestMove(aiPlayer.cards);

    if (!bestMove) {
      // No valid move found, draw a card
      this._game.drawCard(this._aiPlayerID);
      return this.makeMove();
    }

    return {
      playerID: this._aiPlayerID,
      gameID: this._game.id,
      move: { card: bestMove, player: this._aiPlayerID },
    };
  }

  /**
   * Determines the best move from the given set of cards.
   * @param {Card[]} cards - The cards available to the AI player.
   * @return {Card | null} The best card to play or null if no beneficial move is found.
   */
  private _determineBestMove(cards: Card[]): Card | null {
    // Early exit if no cards are available
    if (cards.length === 0) {
      return null;
    }

    const allPlayers = this._game.state.players;
    const currPlayerIndex = this._game.state.currentPlayerIndex;

    // Count cards of each color in hand
    const colorCount: ColorCount = cards.reduce((count, card) => {
      if (card.color !== 'Wildcard') {
        count[card.color] = (count[card.color] || 0) + 1;
      }
      return count;
    }, {} as ColorCount); // Initialize colorCount as an empty object of type ColorCount

    // Sort the cards to prioritize action and wild cards, and then by the most common color in hand
    const sortedCards = cards.slice().sort((a, b) => {
      // Prioritize action cards and wild cards
      const actionPriority = this._getActionCardPriority(b) - this._getActionCardPriority(a);
      if (actionPriority !== 0) return actionPriority;

      // Next, prioritize the most common color in hand
      const colorPriority = (colorCount[b.color] || 0) - (colorCount[a.color] || 0);
      return colorPriority;
    });

    // Find a card that can be played
    for (const card of sortedCards) {
      if (this._game._validCard(card)) {
        // Check if playing this card is beneficial based on the current game state
        if (this._isBeneficialMove(card, allPlayers, currPlayerIndex)) {
          return card;
        }
      }
    }

    // No beneficial card found
    return null;
  }

  /**
   * Determines the priority of action cards based on their rank.
   * Higher priority values are assigned to more impactful action cards.
   *
   * @param {Card} card - The card to evaluate.
   * @return {number} The priority score of the card.
   */
  private _getActionCardPriority(card: Card): number {
    // Higher number means higher priority
    // Use the rank of the card to get its priority, defaulting to 0 if not found
    return actionCardRanks[card.rank] || 0;
  }

  /**
   * Evaluates if playing a given card is beneficial based on the current game state.
   * This function considers several factors such as the next player's hand size,
   * the types of cards in the AI's hand, and the potential impact of the card.
   *
   * @param {Card} card - The card to evaluate.
   * @param {ReadonlyArray<UNOPlayer>} players - The list of players in the game.
   * @param {number} currentPlayerIndex - The index of the current player (AI).
   * @return {boolean} True if playing the card is considered beneficial.
   */
  private _isBeneficialMove(
    card: Card,
    players: ReadonlyArray<UNOPlayer>,
    currentPlayerIndex: number,
  ): boolean {
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayer = players[nextPlayerIndex];
    const criticalCardCount = 2; // Threshold for considering a player close to winning

    // Consider saving Wild and +4 cards for critical situations
    if (
      (card.rank === 'Wild' || card.rank === '+4') &&
      players.some(player => player.cards.length > 2)
    ) {
      return false; // Save these cards for later unless a player is close to winning
    }

    // If the AI has a Wild card but also has other playable cards, it might save the Wild card for a more critical situation
    if (
      card.rank === 'Wild' &&
      players[currentPlayerIndex].cards.some(c => this._game._validCard(c) && c.rank !== 'Wild')
    ) {
      return false; // Avoid using Wild too early
    }

    // Check if the next player has few cards and prioritize action cards to disrupt their turn
    if (
      ['Skip', 'Reverse', '+2', '+4'].includes(card.rank.toString()) &&
      nextPlayer.cards.length <= criticalCardCount
    ) {
      return true; // Beneficial to disrupt a player close to winning
    }

    // If the AI has multiple cards of the same color, it might be beneficial to play one to reduce hand size
    const sameColorCards = players[currentPlayerIndex].cards.filter(c => c.color === card.color);
    if (sameColorCards.length > 2) {
      return true; // Beneficial to play cards of the same color
    }

    // Prioritize playing action cards if the AI has many cards, to change gameplay dynamics
    if (
      players[currentPlayerIndex].cards.length > 4 &&
      ['Skip', 'Reverse', '+2'].includes(card.rank.toString())
    ) {
      return true; // Beneficial to play action cards when AI has many cards
    }

    // Default to true if no specific condition is met
    return true;
  }
}

export default MediumAIStrategy;
