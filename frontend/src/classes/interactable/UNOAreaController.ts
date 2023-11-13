import { UNOGameState } from '../../types/CoveyTownSocket';
import GameAreaController, { GameEventTypes } from './GameAreaController';

export type UNOEvents = GameEventTypes & {
  turnChanged: (isOurTurn: boolean) => void;
  deckChanged: () => void;
  orderChanged: () => void; // do we need this
  // TODO
};

export default class UNOAreaController extends GameAreaController<UNOGameState, UNOEvents> {
  public isActive(): boolean {
    throw new Error('Method not implemented.');
  }
}
