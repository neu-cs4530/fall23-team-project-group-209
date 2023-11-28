import { deepEqual } from 'assert';
import { Card, GameArea, GameStatus, UNOGameState, UNOPlayer } from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import GameAreaController, { GameEventTypes } from './GameAreaController';
import { PLAYER_NOT_IN_GAME_ERROR } from './TicTacToeAreaController';
import { NO_GAME_IN_PROGRESS_ERROR } from './TicTacToeAreaController';

export const GAME_ALREADY_IN_PROGRESS = 'The game is already in progress';
// UNO events to be communicated from controller
export type UNOEvents = GameEventTypes & {
  turnChanged: (isOurTurn: boolean) => void;
  drawDeckChanged: (deck: Card[] | undefined) => void;
  ourDeckChanged: (deck: Card[] | undefined) => void;
  topCardChanged: (topCard: Card | undefined) => void;
  directionChanged: (direction: string | undefined) => void; // do we need this
  otherCardsChanged: (others: Map<string, number> | undefined) => void;
};

/**
 * this class is responsible for handling the state of a UNO game, and for sending commands to the server
 */
export default class UNOAreaController extends GameAreaController<UNOGameState, UNOEvents> {
  //
  /**
   * Returns the top card of the game state. This top card is what is displayed to all players,
   * and is what our player attempts to place the card on, therefore updating the top card. If the
   * game has not started, there is no top card
   */
  get topCard(): Card | undefined {
    return this._model.game?.state.topCard;
  }

  //
  /**
   * returns the deck of cards that a player draws from when they are in need of a new card.
   * This deck does not exist when the game hasnt started yet, and is updated whenver a player
   * draws a card
   */
  get drawDeck(): Card[] | undefined {
    return this._model.game?.state.deck;
  }

  //
  /**
   * returns the deck of our player, that is the player that this controller is for.
   * If the game is not in progress, returns undefined,
   * Throws an error if our player is not in this game.
   */
  get ourDeck(): Card[] | undefined {
    const ourPlayer: string = this._townController.ourPlayer.id;
    if (!this.isActive()) {
      //game isnt in progress, player doesnt have a deck
      return undefined;
    } else if (!this.isPlayer) {
      //player isnt in game, cant have deck
      throw new Error(PLAYER_NOT_IN_GAME_ERROR);
    } else {
      // player should have a valid deck to return
      return this._getPlayerDeck(ourPlayer);
    }
  }

  /**
   * This helper function returns the deck of cards for a player, given the ID
   * @param id the ID of the player whos cards we want
   * @returns the list of cards the player has, if the player is in the game and has cards, else undefined
   */
  private _getPlayerDeck(id: string): Card[] | undefined {
    const allPlayers: ReadonlyArray<UNOPlayer> | undefined = this._model.game?.state.players;
    if (allPlayers) {
      const thePlayer: UNOPlayer | undefined = allPlayers.find(occupant => occupant.id === id);
      if (thePlayer) {
        return thePlayer.cards;
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  //
  /**
   * This getter returns the direction that the flow of turns is moving at this time, or undefined
   * if the game is not active.
   */
  get playerDirection(): string | undefined {
    if (!this.isActive()) {
      return undefined;
    } else {
      return this._model.game?.state.playDirection;
    }
  }

  //
  /**
   * returns the playerController for the player denoted as player1 in the UNO game,
   * or undefined if there is no player1
   */
  get player1(): PlayerController | undefined {
    const player1 = this._model.game?.state.players[0]; // first player in list is player 1
    if (player1) {
      return this.occupants.find(occupant => occupant.id === player1.id);
    }
    //there is no player1 in the game
    return undefined;
  }

  //
  /**
   * returns the playerController for the player denoted as player2 in the UNO game,
   * or undefined if there is no player2
   */
  get player2(): PlayerController | undefined {
    const player2 = this._model.game?.state.players[1]; // second player in list is player 2
    if (player2) {
      return this.occupants.find(occupant => occupant.id === player2.id);
    }
    //there is no player2 in the game
    return undefined;
  }

  //
  /**
   * returns the playerController for the player denoted as player3 in the UNO game,
   * or undefined if there is no player3
   */
  get player3(): PlayerController | undefined {
    const player3 = this._model.game?.state.players[2]; // third player in list is player 3
    if (player3) {
      return this.occupants.find(occupant => occupant.id === player3.id);
    }
    //there is no player3 in the game
    return undefined;
  }

  //
  /**
   * returns the playerController for the player denoted as player4 in the UNO game,
   * or undefined if there is no player4
   */
  get player4(): PlayerController | undefined {
    const player4 = this._model.game?.state.players[3]; // fourth player in list is player 4
    if (player4) {
      return this.occupants.find(occupant => occupant.id === player4.id);
    }
    //there is no player4 in the game
    return undefined;
  }

  //
  /**
   * returns a map of all other players IDs and the number of cards they have, if the game is in progres
   * If the game is not yet in progress, undefined is returned.
   */
  get othersCards(): Map<string, number> | undefined {
    //create new map
    const playersAndCards: Map<string, number> = new Map<string, number>();
    const ourPlayer = this._townController.ourPlayer.id;
    if (this.isActive()) {
      const allPlayers: ReadonlyArray<UNOPlayer> | undefined = this._model.game?.state.players;
      if (allPlayers) {
        //for each player in the game, if not our player, add them and their card count to the map
        allPlayers.forEach(player => {
          if (player.id !== ourPlayer) {
            playersAndCards.set(player.id, player.cards.length);
          }
        });
        return playersAndCards;
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  //
  /**
   * returns the playerController for the winner of the game of UNO, if there is one
   */
  get winner(): PlayerController | undefined {
    const winner = this._model.game?.state.winner;
    if (winner) {
      return this.occupants.find(occupant => occupant.id === winner);
    }
    // there is no winner, game hasnt started etc...
    return undefined;
  }

  //
  /**
   * returns the status of the game. If the game is null because it hasnt been initialized
   * then it returns waiting to start, else it will return the status of the game.
   */
  get status(): GameStatus {
    const status = this._model.game?.state.status; // could be null
    if (!status) {
      //there is no status, game hasnt been intialized
      return 'WAITING_TO_START';
    } else {
      return status;
    }
  }

  //
  /**
   * Returns the playerController for the player whos turn it is. If the game has not started,
   * then it returns undefined.
   */
  get whoseTurn(): PlayerController | undefined {
    const playerIndex: number | undefined = this._model.game?.state.currentPlayerIndex;
    if ((playerIndex !== undefined) && this.isActive()) {
      const player: UNOPlayer | undefined = this._model.game?.state.players[playerIndex];
      return this.occupants.find(occupant => occupant.id === player?.id);
    } else {
      return undefined;
    }
  }

  //
  /**
   * returns true if it is our players turn
   */
  get isOurTurn(): boolean {
    return this.whoseTurn?.id === this._townController.ourPlayer.id;
  }

  //
  /**
   * returns true if our player is a player in this game of UNO.
   */
  get isPlayer(): boolean {
    return this._model.game?.players.includes(this._townController.ourPlayer.id) || false;
  }

  //
  /**
   * @returns true if the status of this game is in progress.
   */
  public isActive(): boolean {
    return this._model.game?.state.status === 'IN_PROGRESS';
  }

/**
 * Checks to see how the model has changed, and then emits events
 * to the front end so it can update the visual display. 
 * @param newModel the model that the old model is compared to 
 */
  protected _updateFrom(newModel: GameArea<UNOGameState>): void {
    //seems like it makes sense to store old model values, call super
    //check which values updated and call emitters based on it
    const oldTurn = this.whoseTurn;
    const oldTopCard = this.topCard;
    const oldDrawDeck = this.drawDeck;
    const oldOurDeck = this.ourDeck;
    const oldDirection = this.playerDirection;
    const oldOthersCards = this.othersCards;
    super._updateFrom(newModel);
    const newTurn = this.whoseTurn;
    const newTopCard = this.topCard;
    const newDrawDeck = this.drawDeck;
    const newOurDeck = this.ourDeck;
    const newDirection = this.playerDirection;
    const newOthersCards = this.othersCards;
    //check to see what states in the new and old model have changed, emit the correct events
    if (oldTurn?.id !== newTurn?.id) {
      this.emit('turnChanged', this.isOurTurn);
    }
    if (!this._compareCard(oldTopCard, newTopCard)) { 
      this.emit('topCardChanged', newTopCard);
    }
    if (!this._compareDecks(oldDrawDeck, newDrawDeck)) {
      this.emit('drawDeckChanged', newDrawDeck);
    }
    if (!this._compareDecks(oldOurDeck, newOurDeck)) {
      this.emit('ourDeckChanged', newOurDeck);
    }
    if (!(oldDirection === newDirection)) {
      this.emit('orderChanged', newDirection);
    }
    if (!this._compareOtherDecksMap(oldOthersCards, newOthersCards)) {
      this.emit('otherCardsChanged', newOthersCards);
    }
  }

  /**
   * this private helper helps to compare 2 decks of cards to see if they are equal. 2 Decks are equal if
   * they are of the same length and each card is the same at every index.  If both piles are undefined, they
   * are equal, and if one is undefined and the other is not, then they arent equal.
   * @param pile1 the first pile or undefined we compare
   * @param pile2 the second pile or undefined we compare
   * @returns true if the 2 piles have the same length and each card is the same at every index, or if both are undefined. Else
   * returns false.
   */
  private _compareDecks(pile1: Card[] | undefined, pile2: Card[] | undefined): boolean | undefined {
    if (!pile1 && !pile2) {
      return true;
    } else if ((!pile1 && pile2) || (pile1 && !pile2)) {
      return false;
    } else {
      return (
        pile1?.length === pile2?.length && pile1?.every((card, index) => this._compareCard(card, pile2?.[index]))
      );
    }
  }


  /**
   * this private helper helps to determine if the old map for others player and their amount of cards
   * holds the same information as the new map for other players and their amount of cards.
   * @param others1 the old map
   * @param others2 the new map
   * @returns true if both maps are undefined, or if the maps are the same size and each key exists in both
   * and has the same amount of cards for each value./
   */
  private _compareOtherDecksMap(
    others1: Map<string, number> | undefined,
    others2: Map<string, number> | undefined,
  ): boolean {
    if (!others1 && !others2) {
      return true;
    } else if ((!others1 && others2) || (others1 && !others2)) {
      return false;
    } else if (others1 && others2) {
      const sameSize: boolean = others1?.size === others2?.size;
      let sameKeyVal = true;
      let otherNum;
      // iterate through each key in others 1
      // if the key doesnt exist in others2, set flag,
      // if the key does exist in others2, check if same
      // value in both, and set flag if not
      for (let [player, num] of others1) {
        otherNum = others2.get(player);
        //in case undefiend, make sure key exists
        if (otherNum !== num || (otherNum === undefined && others2.has(player))) {
          sameKeyVal = false;
        }
        /** 
        if (!others2?.has(player)) {
          sameKeyVal = false;
          break;
        } else {
          if (others1?.get(player) !== others2?.get(player)) {
            sameKeyVal = false;
            break;
          }
        }
        */
      }
      return sameSize && sameKeyVal;
    } else {
      return false;
    }
  }

  /**
   * this function sends a request to the server for this player to place down a card
   * if the game is not in progress, throws a NO_GAME_IN_PROGRESS_ERROR
   * @param card the card that our player is attempting to place down
   */
  public async makeMove(card: Card) {
    const instanceID = this._instanceID;
    if (!instanceID || this._model.game?.state.status !== 'IN_PROGRESS') {
      throw new Error(NO_GAME_IN_PROGRESS_ERROR);
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'GameMove',
      gameID: instanceID,
      move: {
        player: this._townController.ourPlayer.id,
        card: card,
      },
    });
  }

  /**
   * this function sends a request to the server for this player to pick up a card from the draw deck
   * if the game is not in progress, throws a NO_GAME_IN_PROGRESS_ERROR
   */
  public async drawCard() {
    const instanceID = this._instanceID;
    if (!instanceID || this._model.game?.state.status !== 'IN_PROGRESS') {
      throw new Error(NO_GAME_IN_PROGRESS_ERROR);
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'DrawCard',
      gameID: instanceID,
      id: this._townController.ourPlayer.id,
    });
  }

  /**
   * this function sends a request to the server for this game to start
   * if the game is already in progress, throws GAME_ALREADY_IN_PROGRESS
   */
  public async startGame() {
    const instanceID = this._instanceID;
    if (!instanceID || this._model.game?.state.status !== 'WAITING_TO_START') {
      throw new Error(GAME_ALREADY_IN_PROGRESS); //discuss about this
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'StartGame',
      gameID: instanceID,
    });
  }

  /**
   * this function sends a request to the server for the game to have an AI player join
   * if the game is already in progress, throws GAME_ALREADY_IN_PROGRESS
   * @param difficulty
   */
  public async joinAI(difficulty: string) {
    const instanceID = this._instanceID;
    if (!instanceID || this._model.game?.state.status !== 'WAITING_TO_START') {
      throw new Error(GAME_ALREADY_IN_PROGRESS);
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'JoinAI',
      gameID: instanceID,
      difficulty: difficulty,
    });
  }

  /**
   * Send s a command to the towntroller for changing the color of the top card
   * if the game isnt in progres, throws error
   * @param color the color to change the top card to
   */
  public async changeColor(color: string) {
    const instanceID = this._instanceID;
    if (!instanceID || this._model.game?.state.status !== 'IN_PROGRESS') {
      throw new Error(NO_GAME_IN_PROGRESS_ERROR);
    }
    await this._townController.sendInteractableCommand(this.id, {
      type: 'ColorChange',
      gameID: instanceID,
      color: color,
    });
  }

  /**
   * compare 2 cards
   * @param card first card
   * @param card2 second card
   * @returns true if the cards have the same rank and color
   */
  private _compareCard(card: Card | undefined, card2: Card | undefined): boolean {
    return (card?.color === card2?.color) && (card?.rank === card2?.rank);
  }
}
