// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/HackTokenERC20.sol";

/// @title HackTokenERC20Test
/// @notice Unit tests for the HackTokenERC20 smart contract.
/// @dev Uses Foundry's forge-std Test utilities for setup, assertions, and cheatcodes.
contract HackTokenERC20Test is Test {

    HackToken _hacktoken;

    /// @notice The contract owner (admin).
    address public admin = vm.addr(1);

    /// @notice Random user (not the owner).
    address public randomUser = vm.addr(2);

    /// @notice Deploys the HackToken contract from the admin address before each test.
    function setUp() public {
        vm.startPrank(admin);
        _hacktoken = new HackToken();
        vm.stopPrank();
    }

    // ------------------------------------------------------------------------
    // ADMIN-ONLY TESTS

    // ------------------------------------------------------------------------

    /// @notice Tests that only the owner can mint tokens.
    function testMintTokensOnlyAdmin() public {
        address recipient = vm.addr(4);
        uint256 amount = 50 ether;

        vm.prank(admin);
        _hacktoken.mintTokens(recipient, amount);
 main
    }

    /// @notice Tests that only the owner can transfer ownership.
    function testTransferOwnerOnlyAdmin() public {
        address newAddress = vm.addr(6);

        vm.prank(randomUser);
        vm.expectRevert();
        _hacktoken.transferOwnershipCustom(newAddress);
    }

    /// @notice Tests that transferring ownership to zero address reverts.
    function testTransferOwnerShipToZeroAddressReverts() public {
        vm.prank(admin);
        vm.expectRevert();
        _hacktoken.transferOwnershipCustom(address(0));
    }

    /// @notice Tests that transferring ownership to the same owner reverts.
    function testTransferOwnerShipToSameOwnerReverts() public {
        vm.prank(admin);
        vm.expectRevert();
        _hacktoken.transferOwnershipCustom(admin);
    }


    /// @notice Tests that only the owner can pause the contract.
    function testPauseOwnerOnlyAdmin() public {
        vm.prank(admin);
        _hacktoken.pause();
    }

    /// @notice Tests that only the owner can unpause the contract.
    function testUnPauseOwnerOnlyAdmin() public {
        vm.prank(admin);
        _hacktoken.pause();
        vm.prank(admin);
        _hacktoken.unpause();
    }

    /// @notice Tests that only the owner can transfer ownership successfully.

    function testTransferOwnerGood() public {
        address newAddress = vm.addr(6);

        vm.prank(admin);
        _hacktoken.transferOwnershipCustom(newAddress);
    }

    // ------------------------------------------------------------------------
    // MINT TESTS

    // ------------------------------------------------------------------------

    /// @notice Tests that the owner can mint tokens to a recipient.
    function testMintTokens() public {
        address recipient = vm.addr(3);
        uint256 amount = 100 ether;
        vm.prank(admin);
        _hacktoken.mintTokens(recipient, amount);

        assertEq(_hacktoken.balanceOf(recipient), amount, "Recipient should have minted tokens");
        assertEq(_hacktoken.totalSupply(), amount, "Total supply should match minted amount");
    }

    /// @notice Tests that minting tokens from a non-owner address reverts.
    function testMintTokensNotTheOwner() public {
        address recipient = vm.addr(5);
        uint256 amount = 10 ether;
        vm.prank(randomUser);
        vm.expectRevert();
        _hacktoken.mintTokens(recipient, amount);
    }

    /// @notice Tests that minting zero tokens reverts with the correct error message.
    function testMintTokensRevertsOnZeroAmount() public {
        address recipient = vm.addr(6);
        uint256 amount = 0;
        vm.prank(admin);
        vm.expectRevert();
        _hacktoken.mintTokens(recipient, amount);
    }

    /// @notice Tests that minting tokens to zero address reverts.
    function testMintTokensToZeroAddressReverts() public {
        address recipient = address(0);
        uint256 amount = 100 ether;
        vm.prank(admin);
        vm.expectRevert();
        _hacktoken.mintTokens(recipient, amount);
    }

    /// @notice Tests that minting tokens to zero address reverts (alternative).
    function testMintTokensRevertsOnZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert();
        _hacktoken.mintTokens(address(0), 13 ether);
    }

    /// @notice Tests that minting above maxSupply reverts.
    function testMintTokensExceedsMaxSupplyReverts() public {
        address recipient = vm.addr(3);
        uint256 maxSupply = _hacktoken.maxSupply();
        vm.prank(admin);
        _hacktoken.mintTokens(recipient, maxSupply);
        vm.prank(admin);
        vm.expectRevert();
        _hacktoken.mintTokens(recipient, 1);
    }

    /// @notice Tests that mintedTokens does not decrease after burning tokens.
    function testMintedTokensDoesNotDecreaseOnBurn() public {
        uint256 mintAmount = 10;
        uint256 burnAmount = 5;
        vm.prank(admin);
        _hacktoken.mintTokens(admin, mintAmount);
        vm.prank(admin);
        _hacktoken.burn(burnAmount);
        assertEq(_hacktoken.mintedTokens(), mintAmount, "mintedTokens should not decrease after burn");
    }

    // ------------------------------------------------------------------------
    // TRANSFER TESTS
    // ------------------------------------------------------------------------

    /// @notice Tests that transferring tokens to zero address reverts.
    function testTransferToZeroAddressReverts() public {
        uint256 amount = 10 ether;
        vm.prank(admin);
        _hacktoken.mintTokens(admin, amount);
        vm.prank(admin);
        vm.expectRevert();
        _hacktoken.transfer(address(0), amount);
    }

    /// @notice Tests that transferring tokens when not paused succeeds.
    function testTransferWhenNotPausedSucceeds() public {
        address recipient = vm.addr(8);
        uint256 amount = 10 ether;
        vm.prank(admin);
        _hacktoken.mintTokens(admin, amount);
        vm.prank(admin);
        _hacktoken.transfer(recipient, amount);
        assertEq(_hacktoken.balanceOf(recipient), amount);
    }

    // ------------------------------------------------------------------------
    // BURN TESTS
    // ------------------------------------------------------------------------

    /// @notice Tests that the owner can burn tokens and the total supply is updated.
    function testBurnTokensOnlyOwner() public {
        uint256 mintAmount = 10;
        uint256 burnAmount = 5;
        vm.prank(admin);
        _hacktoken.mintTokens(admin, mintAmount);
        vm.prank(admin);
        _hacktoken.burn(burnAmount);
        assertEq(_hacktoken.balanceOf(admin), mintAmount - burnAmount, "Owner's balance should decrease by burned amount");
        assertEq(_hacktoken.totalSupply(), mintAmount - burnAmount, "Total supply should decrease by burned amount");
    }

    /// @notice Tests that non-owners cannot burn tokens.
    function testBurnTokensNotOwnerReverts() public {
        uint256 mintAmount = 10;
        uint256 burnAmount = 5;
        vm.prank(admin);
        _hacktoken.mintTokens(randomUser, mintAmount);
        vm.prank(randomUser);
        vm.expectRevert();
        _hacktoken.burn(burnAmount);
    }

    /// @notice Tests that burning zero tokens reverts with the correct error message.
    function testBurnTokensRevertsOnZeroAmount() public {
        uint256 amount = 0;
        vm.expectRevert();
        _hacktoken.burn(amount);
    }

    /// @notice Tests that burning more tokens than balance reverts.
    function testBurnTokensInsufficientBalance() public {
        uint256 amount = 5;
        vm.expectRevert();
        _hacktoken.burn(amount);
    }

    // ------------------------------------------------------------------------
    // PAUSABLE TESTS
    // ------------------------------------------------------------------------

    /// @notice Tests that pausing by non-owner reverts.
    function testPauseByNonOwnerReverts() public {
        vm.prank(randomUser);
        vm.expectRevert();
        _hacktoken.pause();
    }

    /// @notice Tests that unpausing by non-owner reverts.
    function testUnpauseByNonOwnerReverts() public {
        vm.prank(admin);
        _hacktoken.pause();
        vm.prank(randomUser);
        vm.expectRevert();
        _hacktoken.unpause();
    }

    /// @notice Tests that pausing works correctly.
    function testPauseCorrectly() public {
        vm.prank(admin);
        _hacktoken.pause();
    }

    /// @notice Tests that unpausing works correctly.
    function testUnPauseCorrectly() public {
        vm.prank(admin);
        _hacktoken.pause();
        vm.prank(admin);
        _hacktoken.unpause();
    }

    /// @notice Tests that transfers are blocked when the contract is paused.
    function testTransferWhilePausedReverts() public {
        address recipient = vm.addr(7);
        uint256 amount = 10 ether;
        vm.prank(admin);
        _hacktoken.mintTokens(admin, amount);
        vm.prank(admin);
        _hacktoken.pause();     
        vm.prank(admin);
        vm.expectRevert();
        _hacktoken.transfer(recipient, amount);
    }


    /// @notice Tests that minting while paused reverts.
    function testMintWhilePausedReverts() public {
        address recipient = vm.addr(3);
        uint256 amount = 10 ether;
        vm.prank(admin);
        _hacktoken.pause();
        vm.prank(admin);
        vm.expectRevert();
        _hacktoken.mintTokens(recipient, amount);
    }

    /// @notice Tests that burning while paused reverts.
    function testBurnWhilePausedReverts() public {
        uint256 amount = 10 ether;
        vm.prank(admin);
        _hacktoken.mintTokens(admin, amount);
        vm.prank(admin);
        _hacktoken.pause();
        vm.prank(admin);
        vm.expectRevert();
        _hacktoken.burn(1);
    }

    // ------------------------------------------------------------------------
    // EVENTS TESTS
    // ------------------------------------------------------------------------

    /// @notice Event signature for minting tokens.
    event TokenMinted(address to, uint256 amount);

    /// @notice Event signature for ownership transfer.
    event TransferNewOwner(address indexed previousOwner, address indexed newOwner);

    /// @notice Event signature for burning tokens.
    event TokenBurned(address indexed from, uint256 amount);

    /// @notice Tests that minting emits the TokenMinted event.
    function testMintEmitsEvent() public {
        address recipient = vm.addr(4);
        uint256 amount = 1 ether;
        vm.prank(admin);
        vm.expectEmit(false, false, false, true);
        emit TokenMinted(recipient, amount);
        _hacktoken.mintTokens(recipient, amount);
    }

    /// @notice Tests that ownership transfer emits the TransferNewOwner event.
    function testTransferOwnerShipCustomEvent() public {
        address newOwner = vm.addr(5);
        vm.prank(admin);
        vm.expectEmit(true, true, false, false);
        emit TransferNewOwner(admin, newOwner);
        _hacktoken.transferOwnershipCustom(newOwner);
    }

    /// @notice Tests that burning emits the TokenBurned event.
    function testBurnedEvent() public {
        uint256 amount = 1;
        vm.prank(admin);
        _hacktoken.mintTokens(admin, amount);
        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit TokenBurned(admin, amount);
        _hacktoken.burn(amount);
    }
}