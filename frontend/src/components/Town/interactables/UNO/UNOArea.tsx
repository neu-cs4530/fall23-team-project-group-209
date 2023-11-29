import {
  GameResult,
  GameStatus,
  InteractableID,
} from '../../../../../../shared/types/CoveyTownSocket';
import React, { useCallback, useEffect, useState } from 'react';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import UNOAreaController from '../../../../classes/interactable/UNOAreaController';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Container,
  Divider,
  GridItem,
  Heading,
  HStack,
  List,
  ListItem,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  useToast,
  VStack,
} from '@chakra-ui/react';
import useTownController from '../../../../hooks/useTownController';
import GameAreaInteractable from '../GameArea';
import UNOTable from './UNOTable';
import UNOLeaderboard from './UNOLeaderboard';

function LeaderboardModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}): JSX.Element {
  return isOpen ? (
    <Modal aria-label='leaderboard' size='md' isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent alignItems='center' paddingY='30px'>
        <ModalCloseButton />
        <b>{'UNO Leaderboard'}</b>
        <UNOLeaderboard />
      </ModalContent>
    </Modal>
  ) : (
    <></>
  );
}

/**
 * Holds the rules for the UNO game in a closable modal.
 * @param param0
 * @returns
 */
function RuleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): JSX.Element {
  return isOpen ? (
    <Modal aria-label='rules' size='md' isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent alignItems='center' paddingY='30px'>
        <ModalCloseButton />
        <b>{'UNO Rules'}</b>
        <span>{'Add more text here...'}</span>
      </ModalContent>
    </Modal>
  ) : (
    <></>
  );
}

/**
 * Overall UNO frontend area that allows for the player to join a game,
 * start a game, optionally add AI opponent(s), and finish the game.
 * Also contains the leaderboard.
 * @returns
 */
function UNOArea({ interactableID }: { interactableID: InteractableID }): JSX.Element {
  const gameAreaController = useInteractableAreaController<UNOAreaController>(interactableID);
  const townController = useTownController();
  // states to hold UNOAreaValues
  const [isJoining, setIsJoining] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isLBModalOpen, setIsLBModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  // states to hold game values from controller
  const [, setHistory] = useState<GameResult[]>(gameAreaController.history);
  const [status, setGameStatus] = useState<GameStatus>(gameAreaController.status);
  //const [observers, setObservers] = useState<PlayerController[]>(gameAreaController.observers);
  const [inGame, setInGame] = useState(gameAreaController.isPlayer);
  const [whoseTurn, setWhoseTurn] = useState(gameAreaController.whoseTurn);
  const [direction, setDirection] = useState(gameAreaController.playerDirection);
  const [winner, setWinner] = useState(gameAreaController.winner);

  const [p1, setP1] = useState(gameAreaController.player1);
  const [p2, setP2] = useState(gameAreaController.player2);
  const [p3, setP3] = useState(gameAreaController.player3);
  const [p4, setP4] = useState(gameAreaController.player4);

  // toast to provide info to user (game over, connection issue)
  const toast = useToast();

  useEffect(() => {
    //functions to update states
    const updateGame = () => {
      setP1(gameAreaController.player1);
      setP2(gameAreaController.player2);
      setP3(gameAreaController.player3);
      setP4(gameAreaController.player4);
      setGameStatus(gameAreaController.status || 'WAITING_TO_START');
      //setObservers(gameAreaController.observers);
      setInGame(gameAreaController.isPlayer);
      setWhoseTurn(gameAreaController.whoseTurn);
      setWinner(gameAreaController.winner);
      setDirection(gameAreaController.playerDirection);
    };
    const endGame = () => {
      setHistory(gameAreaController.history);
    };
    const turnChanged = () => {
      setWhoseTurn(gameAreaController.whoseTurn);
    };
    const directionChanged = () => {
      setDirection(gameAreaController.playerDirection);
    };
    //listeners from controller
    gameAreaController.addListener('gameUpdated', updateGame);
    gameAreaController.addListener('gameEnd', endGame);
    gameAreaController.addListener('turnChanged', turnChanged);
    gameAreaController.addListener('directionChanged', directionChanged);
    return () => {
      gameAreaController.removeListener('gameUpdated', updateGame);
      gameAreaController.removeListener('gameEnd', endGame);
      gameAreaController.removeListener('turnChanged', turnChanged);
      gameAreaController.removeListener('directionChanged', directionChanged);
    };
  }, [gameAreaController, townController]);

  const joinGameButton =
    (inGame && status === 'WAITING_TO_START') || status === 'IN_PROGRESS' ? (
      <></>
    ) : (
      <Button
        onClick={async () => {
          setIsJoining(true);
          try {
            await gameAreaController.joinGame();
          } catch (err) {
            toast({
              title: 'Error joining game',
              description: (err as Error).toString(),
              status: 'error',
            });
          }
          setIsJoining(false);
        }}
        disabled={isJoining}
        isLoading={isJoining}>
        Join New Game
      </Button>
    );

  const startGameButton =
    p2 && inGame && status === 'WAITING_TO_START' ? (
      <Button
        onClick={async () => {
          setIsStarting(true);
          try {
            await gameAreaController.startGame();
          } catch (err) {
            toast({
              title: 'Error starting game',
              description: (err as Error).toString(),
              status: 'error',
            });
          }
          setIsStarting(false);
        }}
        disabled={isStarting}
        isLoading={isStarting}>
        Start Game
      </Button>
    ) : (
      <></>
    );

  const addAIButton =
    inGame && status === 'WAITING_TO_START' && !p4 ? (
      <Button
        onClick={async () => {
          try {
            setIsAIModalOpen(true);
          } catch (err) {
            toast({
              title: 'Error adding AI',
              description: (err as Error).toString(),
              status: 'error',
            });
          }
        }}>
        Add AI Opponent
      </Button>
    ) : (
      <></>
    );

  function AIModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): JSX.Element {
    const [mode, setMode] = useState('Easy');
    const onClick = async () => {
      setIsJoining(true);
      try {
        await gameAreaController.joinAI(mode);
        onClose();
        toast({
          title: 'Success',
          description: `Added a(n) ${mode === 'med' ? 'medium' : mode} AI to the game.`,
          status: 'success',
        });
      } catch (err) {
        toast({
          title: 'Error adding AI to game',
          description: (err as Error).toString(),
          status: 'error',
        });
      }
      setIsJoining(false);
    };
    return isOpen ? (
      <Modal aria-label='leaderboard' size='md' isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent alignItems='center' paddingY='30px'>
          <ModalCloseButton />
          <VStack spacing='3'>
            <span>{'What level AI opponent would you like to play against?'}</span>
            <Select
              value={mode}
              onChange={e => {
                setMode(e.target.value);
              }}>
              <option value='Easy'>Easy</option>
              <option value='Med'>Medium</option>
              <option value='Hard'>Hard</option>
            </Select>
            <Button
              size='md'
              width='70px'
              onClick={onClick}
              disabled={isJoining}
              isLoading={isJoining}>
              Add
            </Button>
          </VStack>
        </ModalContent>
      </Modal>
    ) : (
      <></>
    );
  }

  const listPlayers =
    status !== 'IN_PROGRESS' ? (
      <SimpleGrid columns={3} gap={6}>
        <GridItem colSpan={2} alignContent='center'>
          <List aria-label='list of players in the game'>
            <VStack alignItems='stretch'>
              <ListItem>Player 1: {p1?.userName || '(No player yet!)'}</ListItem>
              <ListItem>Player 2: {p2?.userName || '(No player yet!)'}</ListItem>
              <ListItem>Player 3: {p3?.userName || '(No player yet!)'}</ListItem>
              <ListItem>Player 4: {p4?.userName || '(No player yet!)'}</ListItem>
            </VStack>
          </List>
        </GridItem>
        <GridItem>
          <VStack paddingTop='5px'>
            {addAIButton}
            {joinGameButton}
            {startGameButton}
          </VStack>
        </GridItem>
      </SimpleGrid>
    ) : (
      <List aria-label='list of players in the game'>
        <VStack alignItems='stretch' borderY={-1}>
          <ListItem>Player 1: {p1?.userName || '(No player yet!)'}</ListItem>
          <ListItem>Player 2: {p2?.userName || '(No player yet!)'}</ListItem>
          {p3 && <ListItem>Player 3: {p3.userName}</ListItem>}
          {p4 && <ListItem>Player 4: {p4.userName}</ListItem>}
        </VStack>
      </List>
    );

  const statusText = () => {
    const winnerText = winner ? `The winner is ${winner.userName}!` : 'There is no winner.';
    switch (status) {
      case 'WAITING_TO_START':
        return <span aria-label='status'>{'Game is waiting to start.'}</span>;
      case 'IN_PROGRESS':
        return (
          <span aria-label='status'>{`Game is in progress. It is ${whoseTurn?.userName}'s turn. The game direction is ${direction}.`}</span>
        );
      case 'OVER':
        return <span aria-label='status'>{`Game is over! ${winnerText}`}</span>;
      default:
        <></>;
    }
  };

  const lbModalButton = (
    <Button paddingX='20px' marginX='20px' onClick={() => setIsLBModalOpen(true)}>
      Leaderboard
    </Button>
  );
  const ruleModalButton = (
    <Button paddingX='20px' marginX='20px' onClick={() => setIsRuleModalOpen(true)}>
      Rules
    </Button>
  );

  // if waiting to start, return the join game screen.
  // otherwise, render the UNO table.
  return (
    <Container minW='full' paddingX='0px'>
      <AIModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
      <LeaderboardModal isOpen={isLBModalOpen} onClose={() => setIsLBModalOpen(false)} />
      <RuleModal isOpen={isRuleModalOpen} onClose={() => setIsRuleModalOpen(false)} />
      <VStack minW='max' bgColor='white' align='center' paddingBottom='5'>
        <HStack>
          {lbModalButton}
          {ruleModalButton}
        </HStack>
        <Divider />
        {listPlayers}
        <Divider />
        {statusText()}
      </VStack>
      <Container
        bgColor='tomato'
        minW='full'
        border='solid'
        borderWidth='5px'
        borderRadius='5px'
        borderColor='black'>
        {status !== 'WAITING_TO_START' && <UNOTable gameAreaController={gameAreaController} />}
      </Container>
    </Container>
  );
}

/**
 * A wrapper component for the TicTacToeArea component.
 * Determines if the player is currently in a tic tac toe area on the map, and if so,
 * renders the UNOArea component in a modal.
 */
export default function UNOAreaWrapper(): JSX.Element {
  const gameArea = useInteractable<GameAreaInteractable>('gameArea');
  const townController = useTownController();
  const closeModal = useCallback(() => {
    if (gameArea) {
      townController.interactEnd(gameArea);
      const controller = townController.getGameAreaController(gameArea);
      controller.leaveGame();
    }
  }, [townController, gameArea]);

  if (gameArea && gameArea.getData('type') === 'UNO') {
    return (
      <Modal size='4xl' isOpen={true} onClose={closeModal} closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{gameArea.name}</ModalHeader>
          <ModalCloseButton />
          <UNOArea interactableID={gameArea.name} />
        </ModalContent>
      </Modal>
    );
  }
  return <></>;
}
