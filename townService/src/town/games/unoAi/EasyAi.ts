
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
        const topCard = this.unoAreaController.topCard;
        const aiHand = this.unoAreaController._getPlayerDeck(this.aiPlayerID);

        if (!topCard || !aiHand) {
            // No valid move possible, or game state not available
            return;
        }

        const playableCard = aiHand.find((card: Card) => this.isCardPlayable(card, topCard));

        if (playableCard) {
            // Play the first valid card found
            await this.unoAreaController.makeMove(playableCard);
        } else {
            // No valid card to play, draw a card
            await this.unoAreaController.drawCard();
        }
    }

    isCardPlayable(card: Card, topCard: Card): boolean {
        if (card.color === 'Wild' || card.color === topCard.color) {
            return true;
        }
        if (topCard.color !== 'Wild' && card.value === topCard.value) {
            return true;
        }
        // Add additional logic for special cards if needed
        return false;
    }

    chooseWildCardColor(hand: Card[]): Color {
        const colorCounts: Record<Color, number> = {
            'Red': 0, 'Green': 0, 'Blue': 0, 'Yellow': 0,
            Wild: 0
        };
        hand.forEach(card => {
            if (card.color !== 'Wild') {
                colorCounts[card.color]++;
            }
        });
        let mostCommonColor: Color = 'Red';
        let maxCount: number = 0;
        for (const color in colorCounts) {
            if (colorCounts[color as Color] > maxCount) {
                maxCount = colorCounts[color as Color];
                mostCommonColor = color as Color;
            }
        }
        return mostCommonColor;
    }
}
