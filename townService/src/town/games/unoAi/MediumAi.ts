/*
import UNOGame from '../UNOGame';

import { Card, UNOPlayer, GameMove, UNOMove } from '../../../types/CoveyTownSocket';

class MCTSAI {
  root: Node;

  unoAreaController: UNOAreaController;

  constructor(unoAreaController: UNOAreaController) {
    const initialState = this.createGameStateFromController(unoAreaController);
    this.root = new Node(initialState, null, null);
    this.unoAreaController = unoAreaController;
  }

  createGameStateFromController(controller: UNOAreaController): GameState {
    // Create and return a GameState object based on the current state of the game from the controller
    // Extract and return the current game state from the controller
    // Use controller methods like controller.ourDeck(), controller.topCard, etc.
  }

  selectMove(): Move {
    // Main method to perform MCTS steps

    // 1. Selection
    // 2. Expansion
    // 3. Simulation
    // 4. Backpropagation

    // Return the best move after running MCTS for a certain number of iterations or time
    for (let i = 0; i < numberOfIterations; i++) {
      let node = this.selectNode(this.root);
      if (!node.isFullyExpanded()) {
        node = this.expandNode(node);
      }
      const outcome = this.simulateRandomPlay(node);
      this.backpropagate(node, outcome);
    }

    // Select the best move from the root node based on the results of the MCTS
    return this.bestMoveFromRoot();
  }

  selectNode(node: Node): Node {
    while (node.isFullyExpanded()) {
      node = node.selectChild();
    }
    return node;
  }

  expandNode(node: Node): Node {
    // Choose a move that has not been explored yet and create a new node
  }

  // Run a simulated game from a given node using random plays until a terminal state
  simulateRandomPlay(node: Node): GameOutcome {
    // Randomly play out a game from the node's state until the end
    // Return the outcome (win/lose)
  }

  // Update the nodes from the given node up to the root based on the simulation outcome
  backpropagate(node: Node, outcome: GameOutcome): void {
    // Update wins and simulations for each node in the path
  }

  bestMoveFromRoot(): Move {
    // Choose the move from the root node that has the best win ratio or most simulations
  }
}
*/
