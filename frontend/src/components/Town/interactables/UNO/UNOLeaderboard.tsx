import { Table, Thead, Tr, Tbody, Td } from '@chakra-ui/react';
import React from 'react';
import { PlayerData } from '../../../../../../shared/types/CoveyTownSocket';

/**
 * This is the leaderboard component that renders a board based on the database that we have created.
 * This database stores information of the players who have played uno, so that they can be displayed
 * the leaderboard takes the database info and displays it on the board
 * The following columns are displayed
 *  - player name - the name of the player
 *  - player wins - the amount of wins the player has from playing uno
 *  - player losses  - the amount of losses the player has from playing uno
 * the rows are ordered based on wins, with the highest winning player at the top of the leaderboard
 * we may incorporate the ability to search for a name in the leaderboard
 */
export default function UNOLeaderboard({
  board,
}: {
  board: PlayerData[] | undefined;
}): JSX.Element {
  return board ? (
    <Table>
      <Thead>
        <Tr>
          <th>Player</th>
          <th>Wins</th>
          <th>Losses</th>
        </Tr>
      </Thead>
      <Tbody>
        {board.map((plr: PlayerData, idx: number) => {
          return (
            <Tr key={idx}>
              <Td>{plr.id}</Td>
              <Td>{plr.wins}</Td>
              <Td>{plr.loss}</Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  ) : (
    <span>No data yet! Play a game to join the leaderboard.</span>
  );
}
