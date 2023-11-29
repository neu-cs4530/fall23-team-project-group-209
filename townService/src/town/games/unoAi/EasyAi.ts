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
  public makeMove(): GameMove<UNOMove> | null {
    const aiPlayer = this._game.state.players.find(player => player.id === this._aiPlayerID);

    if (!aiPlayer || !this._game.id) {
      return null;
    }

    const playableCard = aiPlayer.cards.find(card => this._game._validCard(card));

    /*
    const playableCard = aiPlayer.cards.find(card =>
      this._game._validMove({ player: this._aiPlayerID, card }),
    );
    */

    if (!playableCard) {
      this._game.drawCard(this._aiPlayerID);
      return this.makeMove(); // Recursively call makeMove until a valid card is found or drawn
    }

    return {
      playerID: this._aiPlayerID,
      gameID: this._game.id,
      move: { card: playableCard, player: this._aiPlayerID },
    };
  }
}

export default EasyAIStrategy;
