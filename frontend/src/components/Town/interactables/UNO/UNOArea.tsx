import {
  Card,
  GameResult,
  GameStatus,
  InteractableID,
} from '../../../../../../shared/types/CoveyTownSocket';
import React, { useCallback, useEffect, useState } from 'react';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import UNOAreaController from '../../../../classes/interactable/UNOAreaController';
import PlayerController from '../../../../classes/PlayerController';
import {
  Button,
  Container,
  List,
  ListItem,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import useTownController from '../../../../hooks/useTownController';
import GameAreaInteractable from '../GameArea';
import UNOTable from './UNOTable';

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
  // states to hold game values
  const [history, setHistory] = useState<GameResult[]>(gameAreaController.history);
  const [status, setGameStatus] = useState<GameStatus>(gameAreaController.status);
  const [observers, setObservers] = useState<PlayerController[]>(gameAreaController.observers);

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
      setHistory(gameAreaController.history);
      setGameStatus(gameAreaController.status || 'WAITING_TO_START');
      setObservers(gameAreaController.observers);
    };
    const endGame = () => {
      setHistory(gameAreaController.history);
    };
    //listeners from controller
    gameAreaController.addListener('gameUpdated', updateGame);
    gameAreaController.addListener('gameEnded', endGame);
    //TODO
    return () => {
      gameAreaController.removeListener('gameUpdated', updateGame);
      gameAreaController.removeListener('gameEnded', endGame);
    };
  }, [gameAreaController, townController]);

  const joinGameButton = (
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

  // if waiting to start, return the join game screen.
  // otherwise, render the uno table.
  return (
    <Container>
      {joinGameButton}
      <List aria-label='list of players in the game'>
        {/* add button to add AI players */}
        <ListItem>Player 1: {p1?.userName || '(No player yet!)'}</ListItem>
        <ListItem>Player 2: {p2?.userName || '(No player yet!)'}</ListItem>
        <ListItem>Player 3: {p3?.userName || '(No player yet!)'}</ListItem>
        <ListItem>Player 4: {p4?.userName || '(No player yet!)'}</ListItem>
      </List>
      <UNOTable gameAreaController={gameAreaController} />
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
