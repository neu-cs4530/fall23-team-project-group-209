import Player from '../../lib/Player';
import {
  InteractableCommand,
  InteractableCommandReturnType,
  InteractableType,
} from '../../types/CoveyTownSocket';
import GameArea from './GameArea';
import UNOGame from './UNOGame';

export default class TicTacToeGameArea extends GameArea<UNOGame> {
  protected getType(): InteractableType {
    return null;
  }

  public handleCommand<CommandType extends InteractableCommand>(
    command: CommandType,
    player: Player,
  ): InteractableCommandReturnType<CommandType> {
    return undefined;
  }
}
