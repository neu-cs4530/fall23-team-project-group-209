
type Color = 'Red' | 'Green' | 'Blue' | 'Yellow' | 'Wild';
type Value = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'Skip' | 'Reverse' | 'DrawTwo' | 'Wild' | 'WildDrawFour';

class Card {
    constructor(public color: Color, public value: Value) {}
}

class EasyAIStrategy {
  unoAreaController: UNOAreaController;

  aiPlayerID: string;

  constructor(unoAreaController: UNOAreaController, aiPlayerID: string) {
    this.unoAreaController = unoAreaController;
    this.aiPlayerID = aiPlayerID;
  }

  async makeMove() {
    const { topCard } = this.unoAreaController;
    const aiHand = this.unoAreaController._getPlayerDeck(this.aiPlayerID);

    if (!topCard || !aiHand) {
      // No valid move possible, or game state not available
      return;
    }

    const playableCard = aiPlayer.cards.find(card => this.isCardPlayable(card, topCard));
    const playableCard = aiHand.find((card: Card) => this.isCardPlayable(card, topCard));

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
    if (playableCard) {
      // Play the first valid card found
      await this.unoAreaController.makeMove(playableCard);
    } else {
      // No valid card to play, draw a card
      await this.unoAreaController.drawCard();
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
