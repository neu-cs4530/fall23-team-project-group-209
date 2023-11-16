export type TownJoinResponse = {
  /** Unique ID that represents this player * */
  userID: string;
  /** Secret token that this player should use to authenticate
   * in future requests to this service * */
  sessionToken: string;
  /** Secret token that this player should use to authenticate
   * in future requests to the video service * */
  providerVideoToken: string;
  /** List of players currently in this town * */
  currentPlayers: Player[];
  /** Friendly name of this town * */
  friendlyName: string;
  /** Is this a private town? * */
  isPubliclyListed: boolean;
  /** Current state of interactables in this town */
  interactables: TypedInteractable[];
}

export type InteractableType = 'ConversationArea' | 'ViewingArea' | 'TicTacToeArea';
export interface Interactable {
  type: InteractableType;
  id: InteractableID;
  occupants: PlayerID[];
}

export type TownSettingsUpdate = {
  friendlyName?: string;
  isPubliclyListed?: boolean;
}

export type Direction = 'front' | 'back' | 'left' | 'right';

export type PlayerID = string;
export interface Player {
  id: PlayerID;
  userName: string;
  location: PlayerLocation;
};

export type XY = { x: number, y: number };

export interface PlayerLocation {
  /* The CENTER x coordinate of this player's location */
  x: number;
  /* The CENTER y coordinate of this player's location */
  y: number;
  /** @enum {string} */
  rotation: Direction;
  moving: boolean;
  interactableID?: string;
};
export type ChatMessage = {
  author: string;
  sid: string;
  body: string;
  dateCreated: Date;
};

export interface ConversationArea extends Interactable {
  topic?: string;
};
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
};

export interface ViewingArea extends Interactable {
  video?: string;
  isPlaying: boolean;
  elapsedTimeSec: number;
}

export type GameStatus = 'IN_PROGRESS' | 'WAITING_TO_START' | 'OVER';
/**
 * Base type for the state of a game
 */
export interface GameState {
  status: GameStatus;
} 

/**
 * Type for the state of a game that can be won
 */
export interface WinnableGameState extends GameState {
  winner?: PlayerID;
}
/**
 * Base type for a move in a game. Implementers should also extend MoveType
 * @see MoveType
 */
export interface GameMove<MoveType> {
  playerID: PlayerID;
  gameID: GameInstanceID;
  move: MoveType;
}

export type TicTacToeGridPosition = 0 | 1 | 2;

/**
 * Type for a move in TicTacToe
 */
export interface TicTacToeMove {
  gamePiece: 'X' | 'O';
  row: TicTacToeGridPosition;
  col: TicTacToeGridPosition;
}

/**
 * Type for the state of a TicTacToe game
 * The state of the game is represented as a list of moves, and the playerIDs of the players (x and o)
 * The first player to join the game is x, the second is o
 */
export interface TicTacToeGameState extends WinnableGameState {
  moves: ReadonlyArray<TicTacToeMove>;
  x?: PlayerID;
  o?: PlayerID;
}

export type InteractableID = string;
export type GameInstanceID = string;

/**
 * Type for the result of a game
 */
export interface GameResult {
  gameID: GameInstanceID;
  scores: { [playerName: string]: number };
}

/**
 * Base type for an *instance* of a game. An instance of a game
 * consists of the present state of the game (which can change over time),
 * the players in the game, and the result of the game
 * @see GameState
 */
export interface GameInstance<T extends GameState> {
  state: T;
  id: GameInstanceID;
  players: PlayerID[];
  result?: GameResult;
}

/**
 * Base type for an area that can host a game
 * @see GameInstance
 */
export interface GameArea<T extends GameState> extends Interactable {
  game: GameInstance<T> | undefined;
  history: GameResult[];
}

export type CommandID = string;

/**
 * Base type for a command that can be sent to an interactable.
 * This type is used only by the client/server interface, which decorates
 * an @see InteractableCommand with a commandID and interactableID
 */
interface InteractableCommandBase {
  /**
   * A unique ID for this command. This ID is used to match a command against a response
   */
  commandID: CommandID;
  /**
   * The ID of the interactable that this command is being sent to
   */
  interactableID: InteractableID;
  /**
   * The type of this command
   */
  type: string;
}

export type InteractableCommand =  ViewingAreaUpdateCommand | JoinGameCommand | GameMoveCommand<TicTacToeMove> | LeaveGameCommand;
export interface ViewingAreaUpdateCommand  {
  type: 'ViewingAreaUpdate';
  update: ViewingArea;
}
export interface JoinGameCommand {
  type: 'JoinGame';
}
export interface LeaveGameCommand {
  type: 'LeaveGame';
  gameID: GameInstanceID;
}
export interface GameMoveCommand<MoveType> {
  type: 'GameMove';
  gameID: GameInstanceID;
  move: MoveType;
}
export type InteractableCommandReturnType<CommandType extends InteractableCommand> = 
  CommandType extends JoinGameCommand ? { gameID: string}:
  CommandType extends ViewingAreaUpdateCommand ? undefined :
  CommandType extends GameMoveCommand<TicTacToeMove> ? undefined :
  CommandType extends LeaveGameCommand ? undefined :
  never;

export type InteractableCommandResponse<MessageType> = {
  commandID: CommandID;
  interactableID: InteractableID;
  error?: string;
  payload?: InteractableCommandResponseMap[MessageType];
}

export interface ServerToClientEvents {
  playerMoved: (movedPlayer: Player) => void;
  playerDisconnect: (disconnectedPlayer: Player) => void;
  playerJoined: (newPlayer: Player) => void;
  initialize: (initialData: TownJoinResponse) => void;
  townSettingsUpdated: (update: TownSettingsUpdate) => void;
  townClosing: () => void;
  chatMessage: (message: ChatMessage) => void;
  interactableUpdate: (interactable: Interactable) => void;
  commandResponse: (response: InteractableCommandResponse) => void;
}

export interface ClientToServerEvents {
  chatMessage: (message: ChatMessage) => void;
  playerMovement: (movementData: PlayerLocation) => void;
  interactableUpdate: (update: Interactable) => void;
  interactableCommand: (command: InteractableCommand & InteractableCommandBase) => void;
}

/*
 * UNO Game Types
 * The following info is necessary to properly handle the UNO model. There are 108 cards and the following will 
 * Represent them and how they are handled.
 * There are the following card types:
 * Number Cards, Action Cards, and Draw Cards
 * 
 * NUMBER CARDS:
 * There are 76 number cards, of which there are four color sets: 
 * red, green, yellow, blue
 * 
 * Each of these sets has one '0' card and two of each number from '1' to '9'
 * 
 * ACTION CARDS:
 * Each color set has two of each action card:
 * Skip: The next player in sequence misses a turn.
 * Reverse: The direction of play changes (clockwise to counterclockwise, or vice versa).
 * The game starts clockwise, btw.
 * 
 * The following are considered action cards but are separate from the color sets.
 * Wild: There are four of these cards in a deck, and they can be played regardless of the color in play. 
 * The player who plays it gets to choose the color that continues play.
 * 
 * DRAW CARDS:
 * Draw cards add cards to the draw stack. If the subsequent player does not have a draw card they must draw the 
 * ENTIRE draw stack. 
 * 
 * Each color set has two of the following:
 * Draw Two: The card adds two cards to the draw stack. Can only be played if the corresponding color or a wildcard is the 
 * last card played.
 * 
 * Wild Draw Four: There are also four of these cards in a deck.
 * This card can be played at all times. 
 */

/**
 * Types of colors of card
 */
export type CardColor = 'Blue' | 'Green' | 'Red' | 'Yellow' | 'Wildcard'

/**
 * Suits of UNO Card
 */
export type UNOSuit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | '+2' | '+4' | 'Skip' | 'Reverse' | 'Wild'

/**
 * Card type
 * Later will need to add valid card and valid deck checker.
 */
export interface Card {
  color: CardColor;
  rank: UNOSuit;
}

export interface UNOPlayer extends Player {
  gameID?: GameInstanceID; // do we need this. I think so.
  cards: Card[];
}

/**
 * Type for a move in UNO
 * 
 * Maybe no player, but just card I think. then check if it's valid in gameArea.
 */
export interface UNOMove {
  player: PlayerID;
  card?: Card;
}


/**
 * Type for the state of an UNO game
 * The players are stored in a read only array, up to 4 players.
 * I think we would need a player's deck or something along those lines, maybe a dict?
 * We don't need to care about what the players actually are here, we assume they play properly.
 */
export interface UNOGameState extends WinnableGameState {
  moves: ReadonlyArray<UNOMove> ;
  deck: Card[];
  players: ReadonlyArray<UNOPlayer> ;
  topCard: Card | undefined;
  currentPlayerIndex: number; // Index of the current player in the players array
  playDirection: 'clockwise' | 'counterclockwise'; // Direction of play, starts on clockwise
  drawStack: number; // Number of cards to draw, used for cumulative draw cards - no limits here
}