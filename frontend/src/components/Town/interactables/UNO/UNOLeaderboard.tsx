import { Table, Thead, Tr, Tbody, Td } from '@chakra-ui/react';
import React from 'react';

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
export default function UNOLeaderboard(): JSX.Element {
  // not sure what the parameter is yet to read from database?
  // maybe a stringified json?
  return (
    <Table>
      <Thead>
        <Tr>
          <th>Player</th>
          <th>Wins</th>
          <th>Losses</th>
        </Tr>
      </Thead>
      <Tbody>
        <Tr key={1}>
          <Td>{'player1'}</Td>
          <Td>{'p1 wins'}</Td>
          <Td>{'p1 losses'}</Td>
        </Tr>
      </Tbody>
    </Table>
  );
}
