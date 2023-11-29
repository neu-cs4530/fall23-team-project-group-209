// eslint-disable-next-line import/no-cycle
import UNOGame from '../UNOGame';

import { Card, UNOPlayer, GameMove, UNOMove, UNOSuit } from '../../../types/CoveyTownSocket';

type ColorCount = {
  Blue?: number;
  Green?: number;
  Red?: number;
  Yellow?: number;
  [key: string]: number | undefined;
};

// Define actionCardRanks with an index signature
const actionCardRanks: { [key in UNOSuit]?: number } = {
  '+4': 4,
  'Wild': 3,
  'Skip': 2,
  'Reverse': 2,
  '+2': 2,
};

class MediumAIStrategy {
  private _game: UNOGame;

  private _aiPlayerID: string;

  constructor(game: UNOGame, aiPlayerID: string) {
    this._game = game;
    this._aiPlayerID = aiPlayerID;
  }

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

  private _getActionCardPriority(card: Card): number {
    // Higher number means higher priority
    // Use the rank of the card to get its priority, defaulting to 0 if not found
    return actionCardRanks[card.rank] || 0;
  }

  private _isBeneficialMove(
    card: Card,
    players: ReadonlyArray<UNOPlayer>,
    currentPlayerIndex: number,
  ): boolean {
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    const nextPlayer = players[nextPlayerIndex];
    const criticalCardCount = 2; // Threshold for considering a player close to winning

    // Check if the next player has few cards and prioritize action cards to disrupt their turn
    if (
      ['Skip', 'Reverse', '+2', '+4'].includes(card.rank.toString()) &&
      nextPlayer.cards.length <= criticalCardCount
    ) {
      return true; // Beneficial to disrupt a player close to winning
    }

    // Additional beneficial move checks:

    // 1. If the AI has multiple cards of the same color, it might be beneficial to play one to reduce hand size
    const sameColorCards = players[currentPlayerIndex].cards.filter(c => c.color === card.color);
    if (sameColorCards.length > 2) {
      return true; // Beneficial to play cards of the same color
    }

    // 2. If the AI has a Wild card but also has other playable cards, it might save the Wild card for a more critical situation
    if (
      card.rank === 'Wild' &&
      players[currentPlayerIndex].cards.some(c => this._game._validCard(c) && c.rank !== 'Wild')
    ) {
      return false; // Avoid using Wild too early
    }

    // 3. Prioritize playing action cards if the AI has many cards, to change gameplay dynamics
    if (
      players[currentPlayerIndex].cards.length > 4 &&
      ['Skip', 'Reverse', '+2'].includes(card.rank.toString())
    ) {
      return true; // Beneficial to play action cards when AI has many cards
    }

    // 4. Consider saving Wild and +4 cards for critical situations
    if (
      (card.rank === 'Wild' || card.rank === '+4') &&
      players.some(player => player.cards.length > 2)
    ) {
      return false; // Save these cards for later unless a player is close to winning
    }

    // Default to true if no specific condition is met
    return true;
  }
}

export default MediumAIStrategy;
