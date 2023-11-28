// eslint-disable-next-line import/no-cycle
import UNOGame from '../UNOGame';

import { GameMove, UNOMove } from '../../../types/CoveyTownSocket';

class EasyAIStrategy {
  private _game: UNOGame;

  private _aiPlayerID: string;

  constructor(game: UNOGame, aiPlayerID: string) {
    this._game = game;
    this._aiPlayerID = aiPlayerID;
  }

  /**
   * Determines and performs the next move for the AI player.
   * The AI will play the first playable card found in its hand, or draw a card if none are playable.
   */
  public makeMove() {
    const aiPlayer = this._game.state.players.find(player => player.id === this._aiPlayerID);

    if (!aiPlayer || !this._game.id) {
      // No valid move possible, or game state not available
      return;
    }

    let playableCard = null;
    for (const card of aiPlayer.cards) {
      const mockMove: UNOMove = {
        player: this._aiPlayerID,
        card,
      };
      if (this._game._validMove(mockMove)) {
        playableCard = card;
        break; // Found a valid move, break the loop
      }
    }

    if (!playableCard) {
      // Draw a card if no playable card is found
      this._game.drawCard(this._aiPlayerID);
      // Re-check for a playable card in the updated hand
      // This part might be recursively called until a valid card is found
      this.makeMove();
      return;
    }

    // Play the found playable card
    const move: GameMove<UNOMove> = {
      playerID: this._aiPlayerID,
      gameID: this._game.id,
      move: {
        card: playableCard,
        player: this._aiPlayerID,
      },
    };
    // Apply the move
    this._game.applyMove(move);
  }
}

export default EasyAIStrategy;
