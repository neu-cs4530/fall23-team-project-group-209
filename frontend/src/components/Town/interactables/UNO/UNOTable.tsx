import {
  Box,
  Container,
  GridItem,
  HStack,
  Image,
  Modal,
  ModalContent,
  ModalOverlay,
  SimpleGrid,
  useToast,
  VStack,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import UNOAreaController from '../../../../classes/interactable/UNOAreaController';
import PlayerController from '../../../../classes/PlayerController';
import useTownController from '../../../../hooks/useTownController';
import { Card as PlayerCard } from '../../../../types/CoveyTownSocket';

export type UNOGameProps = {
  gameAreaController: UNOAreaController;
};

// function to create front card sprite
function RenderCard({ card, onClick }: { card: PlayerCard; onClick?: () => void }): JSX.Element {
  const cardText =
    card.rank === 'Reverse'
      ? 'R'
      : card.rank === 'Skip'
      ? 'S'
      : card.rank === 'Wild'
      ? 'W'
      : card.rank;
  return (
    <Box
      textAlign='center'
      borderRadius='3px'
      paddingX='15px'
      paddingY='18px'
      margin='auto'
      maxH={59}
      outline='solid'
      outlineColor='black'
      bg={card.color === 'Wildcard' ? 'white' : card.color}
      textColor={card.color === 'Yellow' || card.color === 'Wildcard' ? 'black' : 'white'}
      onClick={onClick}>
      {cardText}
    </Box>
  );
}

// function to create our player in view
// onClick takes card index and sends to controller
// disable pressing cards on not our turn
function RenderPlayer({
  username,
  cards,
  onClick,
  isYourTurn,
}: {
  username: string;
  cards: PlayerCard[];
  onClick: (index: number) => void;
  isYourTurn: boolean;
}) {
  return (
    <Container>
      <VStack minW='full'>
        <b>{`${username} ${isYourTurn ? '(your turn)' : ''}`}</b>
        <HStack>
          {cards.map((card, index) => (
            <RenderCard key={index} card={card} onClick={() => onClick(index)} />
          ))}
        </HStack>
      </VStack>
    </Container>
  );
}

// function to render player (opponent) in the view
// orientation?
function RenderOpponent({
  username,
  cardCount,
  theirTurn,
}: {
  username: string;
  cardCount: number;
  theirTurn: boolean;
}) {
  return (
    <Container paddingX='100px' minW='fit-content'>
      <VStack minW='full'>
        <HStack>
          <Image src='/user.png' boxSize='80px' alt={username} />
        </HStack>
        <span>{username}</span>
        <span>{theirTurn ? ' (their turn)' : ''}</span>
        <span>{`${cardCount} card(s) left`}</span>
      </VStack>
    </Container>
  );
}

// TODO:
// renders the arrows that denote whose turn it is
// and what direction the game is moving in
// function RenderArrows(order: PlayerController, reversed: boolean) {
//   return;
// }

// renders the deck that cards will be pulled from
// onClick to draw from deck
function RenderDeck({ onClick }: { onClick: () => void }): JSX.Element {
  return <Image boxSize='80px' src='/unocard.png' alt='deck' onClick={onClick} />;
}

/**
 * Where the actual gameplay renders and occurs.
 *
 * @returns
 */
export default function UNOTable({ gameAreaController }: UNOGameProps): JSX.Element {
  const townAreaController = useTownController();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  //states to hold values
  const playerList: PlayerController[] = [];
  const ourPlayer = townAreaController.ourPlayer.id;
  const [p1, setP1] = useState(gameAreaController.player1);
  const [p2, setP2] = useState(gameAreaController.player2);
  const [p3, setP3] = useState(gameAreaController.player3);
  const [p4, setP4] = useState(gameAreaController.player4);
  const [cards, setCards] = useState(gameAreaController.ourDeck || []);
  const [topCard, setTopCard] = useState(
    gameAreaController.topCard || ({ color: 'Wildcard', rank: 'Wild' } as PlayerCard),
  );
  const [, setWinner] = useState(gameAreaController.winner);
  const [othersCards, setOthersCards] = useState(gameAreaController.othersCards);
  const [ourTurn, setOurTurn] = useState(gameAreaController.isOurTurn);
  const [whoseTurn, setWhoseTurn] = useState(gameAreaController.whoseTurn);
  const [isPlayer, setIsPlayer] = useState(gameAreaController.isPlayer);
  const [cardChosen, setCardChosen] = useState<PlayerCard | undefined>(undefined); //used for wild and +4

  useEffect(() => {
    //functions to update states TODO
    const updateGame = () => {
      setP1(gameAreaController.player1);
      setP2(gameAreaController.player2);
      setP3(gameAreaController.player3);
      setP4(gameAreaController.player4);
      setCards(gameAreaController.ourDeck || []);
      setOthersCards(gameAreaController.othersCards);
      setOurTurn(gameAreaController.isOurTurn);
      setWhoseTurn(gameAreaController.whoseTurn);
      setIsPlayer(gameAreaController.isPlayer);
      if (gameAreaController.topCard) {
        setTopCard(gameAreaController.topCard);
      }
    };
    const endGame = () => {
      setWinner(gameAreaController.winner);
    };
    const turnChanged = () => {
      setWhoseTurn(gameAreaController.whoseTurn);
    };
    const ourDeckChanged = () => {
      setCards(gameAreaController.ourDeck || []);
    };
    const topCardChanged = () => {
      if (gameAreaController.topCard) {
        setTopCard(gameAreaController.topCard);
      }
    };
    const otherCardsChanged = () => {
      setOthersCards(gameAreaController.othersCards);
      if (p1 && othersCards && othersCards.get(p1.id) === 1) {
        toast({
          title: 'UNO!',
          description: `${p1.userName} has 1 card left!`,
          status: 'warning',
        });
      }
      if (p2 && othersCards && othersCards.get(p2.id) === 1) {
        toast({
          title: 'UNO!',
          description: `${p2.userName} has 1 card left!`,
          status: 'warning',
        });
      }
      if (p3 && othersCards && othersCards.get(p3.id) === 1) {
        toast({
          title: 'UNO!',
          description: `${p3.userName} has 1 card left!`,
          status: 'warning',
        });
      }
      if (p4 && othersCards && othersCards.get(p4.id) === 1) {
        toast({
          title: 'UNO!',
          description: `${p4.userName} has 1 card left!`,
          status: 'warning',
        });
      }
    };
    //listeners from controller TODO
    gameAreaController.addListener('gameUpdated', updateGame);
    gameAreaController.addListener('gameEnd', endGame);
    gameAreaController.addListener('turnChanged', turnChanged);
    gameAreaController.addListener('ourDeckChanged', ourDeckChanged);
    gameAreaController.addListener('topCardChanged', topCardChanged);
    gameAreaController.addListener('otherCardsChanged', otherCardsChanged);
    //TODO
    return () => {
      gameAreaController.removeListener('gameUpdated', updateGame);
      gameAreaController.removeListener('gameEnd', endGame);
      gameAreaController.removeListener('turnChanged', turnChanged);
      gameAreaController.removeListener('ourDeckChanged', ourDeckChanged);
      gameAreaController.removeListener('topCardChanged', topCardChanged);
      gameAreaController.removeListener('otherCardsChanged', otherCardsChanged);
    };
  }, [gameAreaController, othersCards, p1, p2, p3, p4, toast, townAreaController]);

  if (ourPlayer === p1?.id) {
    playerList.push(p1);
    if (p2) playerList.push(p2);
    if (p3) playerList.push(p3);
    if (p4) playerList.push(p4);
  } else if (ourPlayer === p2?.id) {
    playerList.push(p2);
    if (p3) playerList.push(p3);
    if (p4) playerList.push(p4);
    if (p1) playerList.push(p1);
  } else if (ourPlayer === p3?.id) {
    playerList.push(p3);
    if (p4) playerList.push(p4);
    if (p1) playerList.push(p1);
    if (p2) playerList.push(p2);
  } else if (ourPlayer === p4?.id) {
    playerList.push(p4);
    if (p1) playerList.push(p1);
    if (p2) playerList.push(p2);
    if (p3) playerList.push(p3);
  } else {
    if (p1) playerList.push(p1);
    if (p2) playerList.push(p2);
    if (p3) playerList.push(p3);
    if (p4) playerList.push(p4);
  }

  const onDeckClick = async () => {
    try {
      await gameAreaController.drawCard();
    } catch (err) {
      toast({
        title: 'Error drawing from deck',
        description: (err as Error).toString(),
        status: 'error',
      });
    }
  };
  const onCardClick = async (idx: number) => {
    if (cards[idx].rank === '+4' || cards[idx].rank === 'Wild') {
      setCardChosen(cards[idx]);
      setModalOpen(true);
    } else {
      try {
        await gameAreaController.makeMove(cards[idx]);
      } catch (err) {
        toast({
          title: 'Error placing card',
          description: (err as Error).toString(),
          status: 'error',
        });
      }
    }
  };
  function View(): JSX.Element {
    if (playerList.at(3)) {
      return (
        <VStack minH='full' minW='full' paddingY='30px' spacing='100px'>
          <RenderOpponent
            username={playerList[2].userName}
            cardCount={othersCards?.get(playerList[2].id) ?? 0}
            theirTurn={playerList[2].id === whoseTurn?.id || false}
          />
          <HStack paddingRight='70px'>
            <RenderOpponent
              username={playerList[3].userName}
              cardCount={othersCards?.get(playerList[3].id) ?? 0}
              theirTurn={playerList[3].id === whoseTurn?.id || false}
            />
            <RenderCard card={topCard} />
            <RenderDeck onClick={onDeckClick} />
            <RenderOpponent
              username={playerList[1].userName}
              cardCount={othersCards?.get(playerList[1].id) ?? 0}
              theirTurn={playerList[1].id === whoseTurn?.id || false}
            />
          </HStack>
          {isPlayer ? (
            <RenderPlayer
              username={playerList[0].userName}
              cards={cards}
              onClick={onCardClick}
              isYourTurn={ourTurn}
            />
          ) : (
            <RenderOpponent
              username={playerList[0].userName}
              cardCount={othersCards?.get(playerList[0].id) ?? 0}
              theirTurn={playerList[0].id === whoseTurn?.id || false}
            />
          )}
        </VStack>
      );
    } else if (playerList.at(2)) {
      return (
        <VStack minH='full' paddingY='30px' spacing='100px' align='center'>
          <></>
          <HStack alignItems='stretch' paddingRight='100px'>
            <RenderOpponent
              username={playerList[2].userName}
              cardCount={othersCards?.get(playerList[2].id) ?? 0}
              theirTurn={playerList[2].id === whoseTurn?.id || false}
            />
            <RenderOpponent
              username={playerList[1].userName}
              cardCount={othersCards?.get(playerList[1].id) ?? 0}
              theirTurn={playerList[1].id === whoseTurn?.id || false}
            />
          </HStack>
          <HStack>
            <RenderCard card={topCard} />
            <RenderDeck onClick={onDeckClick} />
          </HStack>
          {isPlayer ? (
            <RenderPlayer
              username={playerList[0].userName}
              cards={cards}
              onClick={onCardClick}
              isYourTurn={ourTurn}
            />
          ) : (
            <RenderOpponent
              username={playerList[0].userName}
              cardCount={othersCards?.get(playerList[0].id) ?? 0}
              theirTurn={playerList[0].id === whoseTurn?.id || false}
            />
          )}
        </VStack>
      );
    } else if (playerList.at(1)) {
      return (
        <VStack minH='full' paddingY='30px' spacing='100px' align='center'>
          <RenderOpponent
            username={playerList[1].userName}
            cardCount={othersCards?.get(playerList[1].id) ?? 0}
            theirTurn={playerList[1].id === whoseTurn?.id || false}
          />
          <HStack>
            <RenderCard card={topCard} />
            <RenderDeck onClick={onDeckClick} />
          </HStack>
          {isPlayer ? (
            <RenderPlayer
              username={playerList[0].userName}
              cards={cards}
              onClick={onCardClick}
              isYourTurn={ourTurn}
            />
          ) : (
            <RenderOpponent
              username={playerList[0].userName}
              cardCount={othersCards?.get(playerList[0].id) ?? 0}
              theirTurn={playerList[0].id === whoseTurn?.id || false}
            />
          )}
        </VStack>
      );
    } else return <></>;
  }

  function ColorPickingModal({
    isOpen,
    onClose,
    card,
  }: {
    isOpen: boolean;
    onClose: () => void;
    card: PlayerCard;
  }): JSX.Element {
    return (
      <Modal size='md' isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent alignItems='center' textAlign='center' paddingY='30px'>
          <VStack spacing='3'>
            <span>{'You placed a +4 or a Wildcard! Pick the next color of the stack.'}</span>
            <SimpleGrid columns={2}>
              <GridItem>
                <Box
                  margin='auto'
                  borderRadius='2px'
                  w='150px'
                  h='150px'
                  outline='solid'
                  outlineColor='black'
                  bg='green'
                  onClick={async () => {
                    await gameAreaController.changeColor('Green');
                    await gameAreaController.makeMove({ rank: card.rank, color: 'Green' });
                    onClose();
                  }}
                />
              </GridItem>
              <GridItem>
                <Box
                  margin='auto'
                  borderRadius='3px'
                  w='150px'
                  h='150px'
                  outline='solid'
                  outlineColor='black'
                  bg='blue'
                  onClick={async () => {
                    await gameAreaController.changeColor('Blue');
                    await gameAreaController.makeMove({ rank: card.rank, color: 'Blue' });
                    onClose();
                  }}
                />
              </GridItem>
              <GridItem>
                <Box
                  margin='auto'
                  borderRadius='3px'
                  w='150px'
                  h='150px'
                  outline='solid'
                  outlineColor='black'
                  bg='yellow'
                  onClick={async () => {
                    await gameAreaController.changeColor('Yellow');
                    await gameAreaController.makeMove({ rank: card.rank, color: 'Yellow' });
                    onClose();
                  }}
                />
              </GridItem>
              <GridItem>
                <Box
                  margin='auto'
                  borderRadius='3px'
                  w='150px'
                  h='150px'
                  outline='solid'
                  outlineColor='black'
                  bg='red'
                  onClick={async () => {
                    await gameAreaController.changeColor('Red');
                    await gameAreaController.makeMove({ rank: card.rank, color: 'Red' });
                    onClose();
                  }}
                />
              </GridItem>
            </SimpleGrid>
          </VStack>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Container>
      {cardChosen && (
        <ColorPickingModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          card={cardChosen}
        />
      )}
      <View />
    </Container>
  );
}
