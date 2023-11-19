import { Box, HStack, VStack } from '@chakra-ui/react';
import { Container } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import UNOAreaController from '../../../../classes/interactable/UNOAreaController';
import PlayerController from '../../../../classes/PlayerController';
import useTownController from '../../../../hooks/useTownController';
import { Card as PlayerCard, GameResult, GameStatus } from '../../../../types/CoveyTownSocket';

// null FOR NOW
export type UNOGameProps = {
  gameAreaController: UNOAreaController;
};

// function to create front card sprite
function RenderCard({ card, onClick }: { card: PlayerCard; onClick?: () => void }): JSX.Element {
  //todo change card colors
  return (
    <Box
      textAlign='center'
      borderRadius='3px'
      paddingX='15px'
      paddingY='18px'
      maxH={59}
      outline='solid'
      outlineColor='black'
      bg={card.color}
      textColor='white'
      onClick={onClick}>
      {card.rank}
    </Box>
  );
}

// function to display card count for opponents
function RenderOpponentCards({ count }: { count: number }): JSX.Element {
  return (
    <Box
      textAlign='center'
      borderRadius='3px'
      paddingX='15px'
      maxH={59}
      paddingY='18px'
      outline='solid'
      bg='lightgray'>
      {count}
    </Box>
  );
}

// function to create our player in view
// onClick takes card index and sends to controller
// disable pressing cards on not our turn
function RenderPlayer({ username, cards }: { username: string; cards: PlayerCard[] }) {
  let onCardClick: (index: number) => void;
  return (
    <Container>
      <VStack>
        <b>{username}</b>
        <HStack>
          {cards.map((card, index) => (
            <RenderCard key={index} card={card} onClick={() => onCardClick(index)} />
          ))}
        </HStack>
      </VStack>
    </Container>
  );
}

// function to render player (opponent) in the view
// orientation?
function RenderOpponent({ username, cardCount }: { username: string; cardCount: number }) {
  return (
    <Container>
      <VStack>
        <RenderOpponentCards count={cardCount} />
        <span>{username}</span>
      </VStack>
    </Container>
  );
}

// TODO:
// renders the arrows that denote whose turn it is
// and what direction the game is moving in
function RenderArrows(order: PlayerController, reversed: boolean) {
  return;
}

// renders the deck that cards will be pulled from
// onClick to draw from deck
function RenderDeck({ onClick }: { onClick: () => void }): JSX.Element {
  return (
    <Box
      textAlign='center'
      borderRadius='3px'
      maxH={59}
      paddingX='19px'
      paddingY='18px'
      outline='solid'
      bg='lightgray'
      onClick={onClick}>
      {''}
    </Box>
  );
}

/**
 * Where the actual gameplay occurs.
 *
 * @returns
 */
export default function UNOTable({ gameAreaController }: UNOGameProps): JSX.Element {
  const townAreaController = useTownController();
  //states to hold values
  const [p1, setP1] = useState(gameAreaController.player1);
  const [p2, setP2] = useState(gameAreaController.player2);
  const [p3, setP3] = useState(gameAreaController.player3);
  const [p4, setP4] = useState(gameAreaController.player4);
  const [cards, setCards] = useState(gameAreaController.ourDeck || []);
  const [winner, setWinner] = useState(gameAreaController.winner);
  const [othersCards, setOthersCards] = useState(gameAreaController.othersCards);

  useEffect(() => {
    //functions to update states TODO
    const updateGame = () => {
      setP1(gameAreaController.player1);
      setP2(gameAreaController.player2);
      setP3(gameAreaController.player3);
      setP4(gameAreaController.player4);
      setCards(gameAreaController.ourDeck || []);
      setOthersCards(gameAreaController.othersCards);
      //todo
    };
    const endGame = () => {
      //todo
      setWinner(gameAreaController.winner);
    };
    //listeners from controller TODO
    gameAreaController.addListener('gameUpdated', updateGame);
    gameAreaController.addListener('gameEnd', endGame);
    //TODO
    return () => {
      gameAreaController.removeListener('gameUpdated', updateGame);
      gameAreaController.removeListener('gameEnd', endGame);
    };
  }, [gameAreaController, townAreaController]);

  // find our player, then move other players around for orientation
  // use mod

  // const player1Name = gameAreaController.players.at(0)?.userName ?? '';
  // const player2Name = gameAreaController.players.at(1)?.userName ?? '';
  // const player3Name = gameAreaController.players.at(2)?.userName ?? '';
  // const player4Name = gameAreaController.players.at(3)?.userName ?? '';

  // todo figure out how to handle the order where current player is static at the bottom

  // 4players
  // header
  // 4th player
  // 2nd, topcard and deck, 3rd player
  // our player

  // 3players
  // header
  //
  // 2nd, topcard and deck, 3rd player
  // our player

  // 2players
  // header
  // 2nd player
  // topcard and deck
  // our player

  //PLACEHOLDERS
  const topCard: PlayerCard = { color: 'Blue', rank: 3 };
  const cardCount = 13;
  const onDeckClick = async () => {
    await gameAreaController.drawCard();
  };
  function View(): JSX.Element {
    if (p1 && p2 && p3 && p4) {
      return (
        <VStack minH='full' paddingY='30px' spacing='100px' align='center'>
          <RenderOpponent username={p3.userName} cardCount={cardCount} />
          <HStack minW='full' spacing='100px' align='stretch'>
            <RenderOpponent username={p4.userName} cardCount={cardCount} />
            <RenderCard card={topCard} onClick={() => {}} />
            <RenderDeck onClick={onDeckClick} />
            <RenderOpponent username={p2.userName} cardCount={cardCount} />
          </HStack>
          <RenderPlayer username={p1.userName} cards={cards} />
        </VStack>
      );
    } else if (p1 && p2 && p3) {
      return (
        <VStack>
          <></>
          <HStack>
            <RenderOpponent username={p3.userName} cardCount={cardCount} />
            <RenderCard card={topCard} />
            <RenderDeck onClick={onDeckClick} />
            <RenderOpponent username={p2.userName} cardCount={cardCount} />
          </HStack>
          <RenderPlayer username={p1.userName} cards={cards} />
        </VStack>
      );
    } else if (p1 && p2) {
      return (
        <VStack>
          <RenderOpponent username={p2.userName} cardCount={cardCount} />
          <HStack>
            <RenderCard card={topCard} />
            <RenderDeck onClick={onDeckClick} />
          </HStack>
          <RenderPlayer username={p1.userName} cards={cards} />
        </VStack>
      );
    } else
      return (
        <VStack minH='full' paddingY='30px' spacing='100px' align='center'>
          <RenderOpponent username={'test'} cardCount={cardCount} />
          <HStack minW='full' spacing='100px' align='stretch'>
            <RenderOpponent username={'test'} cardCount={cardCount} />
            <RenderCard card={topCard} onClick={() => {}} />
            <RenderDeck onClick={onDeckClick} />
            <RenderOpponent username={'test'} cardCount={cardCount} />
          </HStack>
          <RenderPlayer username={'test'} cards={cards} />
        </VStack>
      );
  }

  return (
    <VStack>
      <View />
    </VStack>
  );
}
