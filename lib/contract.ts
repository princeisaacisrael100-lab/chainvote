/**
 * On-chain Voting Smart Contract Configuration
 * -----------------------------------------
 * Target Network: Sepolia Testnet
 * Contract Address: 0xb9333...7f59
 */

export const CONTRACT_ADDRESS = "0xb9333b036dc625ecc533cb9eeb6d3db8d5407f59";
export const SEPOLIA_CHAIN_ID = "0xaa36a7";

/* 
 * Standard ABI for the Original ChainVote contract.
 * Note: This contract does not support hard deletion, only closing.
 */
export const CONTRACT_ABI = [
  "function createPoll(string memory _question, string[] memory _options) external returns (uint256)",
  "function vote(uint256 _pollId, uint256 _optionIndex) external",
  "function closePoll(uint256 _pollId) external",
  "function getPoll(uint256 _pollId) external view returns (string memory question, string[] memory options, uint256[] memory votes, bool active, address creator)",
  "function getPollCount() external view returns (uint256)",
  "function hasVoted(uint256 _pollId, address _voter) external view returns (bool)",
];

export interface Poll {
  id: number;
  question: string;
  options: string[];
  votes: number[];
  active: boolean;
  voted: boolean;
  creator: string;
}
