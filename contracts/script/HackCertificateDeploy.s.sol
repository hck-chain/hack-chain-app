// License
// SPDX-License-Identifier: UNLICENSED

// Solidity version compiler
pragma solidity 0.8.24;

// Libraries
import {Script} from "forge-std/Script.sol";
import {HackCertificate} from "../src/HackCertificate.sol";

// Contract
contract deployCertificate is Script{

    function run() external returns(HackCertificate){
        uint256 deployerPrivateKey = uint256 (vm.envUint("PRIVATE_KEY_POLYGON"));
        vm.startBroadcast(deployerPrivateKey);
      //  string memory tokenUri = "ipfs://bafkreif5ucabsvsh4mcudi3pfo6i6j3hxuz2t2tjzdvw6myw5ouuuddmsm" ;
        HackCertificate createCertificate = new HackCertificate();
        vm.stopBroadcast();
        return createCertificate;
    }

}