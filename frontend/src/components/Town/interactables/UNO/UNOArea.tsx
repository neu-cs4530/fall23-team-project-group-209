import { Card as PlayerCard, GameResult, GameStatus, InteractableID, Player } from '../../../../../../shared/types/CoveyTownSocket';
import React, { useEffect, useState } from 'react';
import { useInteractableAreaController } from '../../../../classes/TownController';
import UNOAreaController from '../../../../classes/interactable/UNOAreaController';
import PlayerController from '../../../../classes/PlayerController';
import { useToast } from '@chakra-ui/react';
import useTownController from '../../../../hooks/useTownController';
import { Card } from '@material-ui/core';

/**
 * Overall UNO frontend area that allows for the player to join a game,
 * start a game, optionally add AI opponent(s), and finish the game.
 * Also contains the leaderboard.
 * @param param0
 * @returns
 */
function UNOArea({ interactableID }: { interactableID: InteractableID }): JSX.Element {
  const gameAreaController = useInteractableAreaController<UNOAreaController>(interactableID);
  const townController = useTownController();
  // states to hold values
  const [history, setHistory] = useState<GameResult[]>(gameAreaController.history);
  const [status, setGameStatus] = useState<GameStatus>(gameAreaController.status);
  const [observers, setObservers] = useState<PlayerController[]>(gameAreaController.observers);

  // toast to provide info to user (game over, connection issue)
  const toast = useToast();

  useEffect(() => {
    //functions to update states
    const updateGame = () => {
      //todo
      setHistory(gameAreaController.history);
      setGameStatus(gameAreaController.status || 'WAITING_TO_START');
      setObservers(gameAreaController.observers);
    };
    const endGame = () => {
      //add toast
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

  // if waiting to start, return the join game screen.
  // otherwise, render the uno table.
  return <></>;
}
