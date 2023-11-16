import {
  Card as PlayerCard,
  GameResult,
  GameStatus,
  InteractableID,
  Player,
} from '../../../../../../shared/types/CoveyTownSocket';
import React, { useCallback, useEffect, useState } from 'react';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import UNOAreaController from '../../../../classes/interactable/UNOAreaController';
import PlayerController from '../../../../classes/PlayerController';
import {
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
function UNOArea({ interactableID }: { interactableID?: InteractableID }): JSX.Element {
  //const gameAreaController = useInteractableAreaController<UNOAreaController>(interactableID);
  const townController = useTownController();
  // states to hold values
  // const [history, setHistory] = useState<GameResult[]>(gameAreaController.history);
  // const [status, setGameStatus] = useState<GameStatus>(gameAreaController.status);
  // const [observers, setObservers] = useState<PlayerController[]>(gameAreaController.observers);

  // toast to provide info to user (game over, connection issue)
  const toast = useToast();

  useEffect(() => {
    //functions to update states
    const updateGame = () => {
      //todo
      // setHistory(gameAreaController.history);
      // setGameStatus(gameAreaController.status || 'WAITING_TO_START');
      // setObservers(gameAreaController.observers);
    };
    const endGame = () => {
      //add toast
    };
    //listeners from controller
    // gameAreaController.addListener('gameUpdated', updateGame);
    // gameAreaController.addListener('gameEnded', endGame);
    //TODO
    return () => {
      // gameAreaController.removeListener('gameUpdated', updateGame);
      // gameAreaController.removeListener('gameEnded', endGame);
    };
  }, [townController]);

  // if waiting to start, return the join game screen.
  // otherwise, render the uno table.
  return <UNOTable />;
}

/**
 * A wrapper component for the TicTacToeArea component.
 * Determines if the player is currently in a tic tac toe area on the map, and if so,
 * renders the TicTacToeArea component in a modal.
 *
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

  // if (gameArea && gameArea.getData('type') === 'UNO') {
  return (
    <Modal size={'xl'} isOpen={true} onClose={closeModal} closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{'UNO Test'}</ModalHeader>
        <ModalCloseButton />
        <UNOArea />
      </ModalContent>
    </Modal>
  );
  // }
  return <></>;
}
