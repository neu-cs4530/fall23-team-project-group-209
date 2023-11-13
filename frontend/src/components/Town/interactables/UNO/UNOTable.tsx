import { HStack, VStack } from '@chakra-ui/react';
import { Card, Container } from '@material-ui/core';
import React, { useEffect } from 'react';
import UNOAreaController from '../../../../classes/interactable/UNOAreaController';
import PlayerController from '../../../../classes/PlayerController';
import useTownController from '../../../../hooks/useTownController';
import { Card as PlayerCard } from '../../../../types/CoveyTownSocket';

// null FOR NOW
export type UNOGameProps = {
  gameAreaController?: UNOAreaController;
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

// renders the arrows that denote whose turn it is
// and what direction the game is moving in
function RenderArrows(order: PlayerController, reversed: boolean) {
  return;
}

// renders the deck that cards will be pulled from
// onClick to draw from deck
function RenderDeck({ onClick }: { onClick: () => void }): JSX.Element {
  return <Card raised={true} onClick={onClick}></Card>;
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
    // gameAreaController.addListener('', updateGame);
    // gameAreaController.addListener('', endGame);
    //TODO
    return () => {
      //gameAreaController.removeListener();
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
  let topCard: PlayerCard;
  let cardCount: number;
  let cards: PlayerCard[];
  let onDeckClick: () => void;
  const playerCount = 4; // another placeholder
  const View = () => {
    switch (playerCount) {
      // case 2:
      //   return (
      //     <VStack>
      //       <RenderOpponent username={'debug'} cardCount={cardCount} />
      //       <HStack>
      //         <RenderCard card={topCard} />
      //         <RenderDeck onClick={onDeckClick} />
      //       </HStack>
      //       <RenderPlayer username={townAreaController.ourPlayer.userName} cards={cards} />
      //     </VStack>
      //   );
      // case 3:
      //   return (
      //     <VStack>
      //       <></>
      //       <HStack>
      //         <RenderOpponent username={player3Name} cardCount={cardCount} />
      //         <RenderCard card={topCard} />
      //         <RenderDeck onClick={onDeckClick} />
      //         <RenderOpponent username={player2Name} cardCount={cardCount} />
      //       </HStack>
      //       <RenderPlayer username={townAreaController.ourPlayer.userName} cards={cards} />
      //     </VStack>
      //   );
      case 4:
        return (
          <VStack>
            <RenderOpponent username={'debug'} cardCount={cardCount} />
            <HStack>
              <RenderOpponent username={'another test a long test'} cardCount={cardCount} />
              <RenderCard card={topCard} />
              <RenderDeck onClick={onDeckClick} />
              <RenderOpponent username={'test'} cardCount={cardCount} />
            </HStack>
            <RenderPlayer username={townAreaController.ourPlayer.userName} cards={cards} />
          </VStack>
        );
      default:
        return <></>;
    }
  };

  return (
    <Container>
      <VStack>
        {/* header goes here */}
        {View}
      </VStack>
    </Container>
  );
}
