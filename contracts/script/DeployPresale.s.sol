// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.24;

import { Script } from "forge-std/Script.sol";
import { PresaleAllocation } from "../src/PresaleAllocation.sol";

/**
 * @title DeployPresale
 * @author HackChain
 * @notice Deploys ONLY the presale contract, against a HACK token that was already deployed
 * separately.
 * @dev Use this script, not `DeployCore.s.sol`, now that the token is deployed on its own:
 * `DeployCore` creates a brand new `HackToken` as part of the full stack, which would leave the
 * presale pointing at a token nobody else uses.
 *
 * Reads three values from the environment:
 *  - `HACK_TOKEN_ADDRESS`   the already-deployed HACK token
 *  - `PRESALE_CAP`          the cap, in units of 18 decimals (100,000,000 HACK is 1e26)
 *  - `PRESALE_ADMIN_ADDRESS` the multisig that will administer the presale
 *
 * After running this, someone holding `MINTER_ROLE` on the token must mint `PRESALE_CAP` to the
 * address this script prints — the contract cannot pay any claim until that happens.
 */
contract DeployPresale is Script {
    error InvalidDeploymentConfiguration();

    function run() external returns (address presale) {
        address hackToken = vm.envAddress("HACK_TOKEN_ADDRESS");
        uint256 presaleCap = vm.envUint("PRESALE_CAP");
        address presaleAdmin = vm.envAddress("PRESALE_ADMIN_ADDRESS");

        if (hackToken == address(0) || presaleAdmin == address(0) || presaleCap == 0) {
            revert InvalidDeploymentConfiguration();
        }

        vm.startBroadcast();
        presale = address(new PresaleAllocation(hackToken, presaleCap, presaleAdmin));
        vm.stopBroadcast();
    }
}
