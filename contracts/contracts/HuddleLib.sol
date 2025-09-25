// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library HuddleLib {
    error ZeroAddressDetected();
    error FieldCannotBeEmpty();
    error CounterOverflow();
    error CounterUnderflow();

    struct LeaderBoardEntry {
        address user;
        uint64 tasksCompleted;
        uint256 hbarEarned;
        uint256 erc20Earned;
        uint256 proposalsVoted;
        uint256 combinedScore; // tasksCompleted + proposalsVoted
    }

    function validateAddress(address addr) internal pure {
        if (addr == address(0)) revert ZeroAddressDetected();
    }

    function validateString(string calldata str) internal pure {
        if (bytes(str).length == 0) revert FieldCannotBeEmpty();
    }

    function calculateFee(uint256 amount, uint256 feePercent) internal pure returns (uint256 fee, uint256 net) {
        unchecked {
            fee = (amount * feePercent) / 10000;
            net = amount - fee;
        }
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @notice Sorts workspace members by their combined task completion and proposal voting activity
     * @param entries Array of LeaderBoardEntry structs to sort
     * @return sortedEntries Array sorted in descending order by combined score (top performers first)
     */
    function sortLeaderboardEntries(
        LeaderBoardEntry[] memory entries
    ) internal pure returns (LeaderBoardEntry[] memory sortedEntries) {
        if (entries.length <= 1) {
            return entries;
        }

        // Create a copy to avoid modifying the original array
        sortedEntries = new LeaderBoardEntry[](entries.length);
        for (uint256 i = 0; i < entries.length; i++) {
            sortedEntries[i] = entries[i];
        }

        // Simple bubble sort (efficient for small arrays up to ~20 members)
        // For larger workspaces, consider implementing quicksort
        for (uint256 i = 0; i < sortedEntries.length - 1; i++) {
            for (uint256 j = 0; j < sortedEntries.length - i - 1; j++) {
                if (sortedEntries[j].combinedScore < sortedEntries[j + 1].combinedScore) {
                    // Swap elements
                    LeaderBoardEntry memory temp = sortedEntries[j];
                    sortedEntries[j] = sortedEntries[j + 1];
                    sortedEntries[j + 1] = temp;
                }
            }
        }

        return sortedEntries;
    }

    /**
     * @notice Gets the top N performers from a sorted leaderboard
     * @param sortedEntries Array of sorted LeaderBoardEntry structs
     * @param topN Number of top performers to return
     * @return topEntries Array containing the top N performers
     */
    function getTopPerformers(
        LeaderBoardEntry[] memory sortedEntries,
        uint256 topN
    ) internal pure returns (LeaderBoardEntry[] memory topEntries) {
        uint256 resultSize = min(sortedEntries.length, topN);
        topEntries = new LeaderBoardEntry[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            topEntries[i] = sortedEntries[i];
        }
        
        return topEntries;
    }

    /**
     * @notice Calculates combined score for a user (tasks completed + proposals voted)
     * @param tasksCompleted Number of tasks the user has completed
     * @param proposalsVoted Number of proposals the user has voted on
     * @return score Combined score
     */
    function calculateCombinedScore(
        uint64 tasksCompleted,
        uint256 proposalsVoted
    ) internal pure returns (uint256 score) {
        // Simple addition - you could implement weighted scoring here
        // e.g., tasks worth 2 points, proposals worth 1 point
        return uint256(tasksCompleted) + proposalsVoted;
    }
}