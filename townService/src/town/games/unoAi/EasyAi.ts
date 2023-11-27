import UNOGame from '../UNOGame';
import { Card, GameMove, UNOMove } from '../../../types/CoveyTownSocket';

class EasyAIStrategy {
  private _game: UNOGame;

  private _aiPlayerID: string;

  constructor(game: UNOGame, aiPlayerID: string) {
    this._game = game;
    this._aiPlayerID = aiPlayerID;
  }

  async makeMove() {
    const { topCard } = this._game.state;
    const aiPlayer = this._game.state.players.find(player => player.id === this._aiPlayerID);
    const gameID = this._game.id; // Assuming you have a game ID in your UNOGame class

    if (!topCard || !aiPlayer || aiPlayer.cards.length === 0 || !gameID) {
      // No valid move possible, or game state not available
      return;
    }

    const playableCard = aiPlayer.cards.find(card => this.isCardPlayable(card, topCard));

    if (playableCard) {
      // Construct the move according to the GameMove interface
      const move: GameMove<UNOMove> = {
        playerID: this._aiPlayerID,
        gameID,
        move: {
          card: playableCard,
          player: this._aiPlayerID,
        }, // Assuming UNOMove structure matches this
      };
      // Play the first valid card found
      await this._game.applyMove(move);
    } else {
      // No valid card to play, draw a card
      await this._game.drawCard(this._aiPlayerID);
    }
  }

  isCardPlayable(card: Card, topCard: Card): boolean {
    // Basic check for color or value match
    if (card.color === topCard.color || card.rank === topCard.rank) {
      return true;
    }
    // Handling Wild cards
    if (card.color === 'Wildcard') {
      return true;
    }
    return false;
  }
}

export default EasyAIStrategy;
