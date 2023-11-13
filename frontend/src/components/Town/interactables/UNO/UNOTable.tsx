import { HStack, VStack } from '@chakra-ui/react';
import { Card, Container } from '@material-ui/core';
import React, { useEffect } from 'react';
import UNOAreaController from '../../../../classes/interactable/UNOAreaController';
import PlayerController from '../../../../classes/PlayerController';
import useTownController from '../../../../hooks/useTownController';
import { Card as PlayerCard } from '../../../../types/CoveyTownSocket';

export type UNOGameProps = {
  gameAreaController: UNOAreaController;
};

// function to create front card sprite
function RenderCard({ card }: { card: PlayerCard }): JSX.Element {
  //todo change card colors
  return <Card raised={true}>{card.rank}</Card>;
}

// function to display card count for opponents
function RenderOpponentCards({ count }: { count: number }): JSX.Element {
  return <Card raised={true}>{count}</Card>;
}

// function to create our player in view
function RenderPlayer({ username, cards }: { username: string; cards: PlayerCard[] }) {
  return (
    <Container>
      <VStack>
        <b>{username}</b>
        <HStack>
          {cards.map((card, index) => (
            <RenderCard key={index} card={card} />
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

// renders the arrows that denote whose turn it is
// and what direction the game is moving in
function RenderArrows(order: PlayerController, reversed: boolean) {
  return;
}

// renders the deck that cards will be pulled from (decorative)
function RenderDeck(): JSX.Element {
  return <Card raised={true}></Card>;
}

/**
 * Where the actual gameplay occurs.
 *
 * @returns
 */
export default function UNOTable({ gameAreaController }: UNOGameProps): JSX.Element {
  const townAreaController = useTownController();
  //states to hold values

  useEffect(() => {
    //functions to update states TODO
    const updateGame = () => {
      //todo
    };
    const endGame = () => {
      //todo
    };
    //listeners from controller TODO
    gameAreaController.addListener('', updateGame);
    gameAreaController.addListener('', endGame);
    //TODO
    return () => {
      //gameAreaController.removeListener();
    };
  }, [gameAreaController]);

  const player1Name = gameAreaController.players.at(0)?.userName ?? '';
  const player2Name = gameAreaController.players.at(1)?.userName ?? '';
  const player3Name = gameAreaController.players.at(2)?.userName ?? '';
  const player4Name = gameAreaController.players.at(3)?.userName ?? '';

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
  let topCard: PlayerCard;
  const view = () => {
    switch (gameAreaController.players.length) {
      case 2:
        <VStack>
          <RenderOpponent username={player2Name} cardCount={} />
          <HStack>
            <RenderCard card={topCard} />
            <RenderDeck />
          </HStack>
          <RenderPlayer username={townAreaController.ourPlayer.userName} cards={} />
        </VStack>;
        break;
      case 3:
        <VStack>
          <></>
          <HStack>
            <RenderOpponent username={player3Name} cardCount={} />
            <RenderCard card={topCard} />
            <RenderDeck />
            <RenderOpponent username={player2Name} cardCount={} />
          </HStack>
          <RenderPlayer username={townAreaController.ourPlayer.userName} cards={} />
        </VStack>;
        break;
      case 4:
        <VStack>
          <RenderOpponent username={player3Name} cardCount={} />
          <HStack>
          <RenderOpponent username={player4Name} cardCount={} />
            <RenderCard card={topCard} />
            <RenderDeck />
            <RenderOpponent username={player2Name} cardCount={} />
          </HStack>
          <RenderPlayer username={townAreaController.ourPlayer.userName} cards={} />
        </VStack>;
        break;
    }
  };

  return (
    <Container>
      <VStack>
        {/* header goes here */}
        {view}
      </VStack>
    </Container>
  );
}
