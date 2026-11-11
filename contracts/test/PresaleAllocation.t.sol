// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.24;

import { HackToken } from "../src/HackTokenERC20.sol";
import { PresaleAllocation } from "../src/PresaleAllocation.sol";
import { Vm } from "forge-std/Vm.sol";
import { IAccessControl } from "@openzeppelin/contracts/access/IAccessControl.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";

contract PresaleAllocationTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    HackToken private token;
    PresaleAllocation private presale;

    // `deployer` mirrors the DeployCore.s.sol broadcaster: it deploys the contracts and mints the
    // escrow, but must end up with NO administrative role on the presale contract. `admin` mirrors
    // PRESALE_ADMIN_ADDRESS, the operational multisig that actually runs the presale.
    address private deployer = address(0xD0D0);
    address private admin = address(0xA11CE);
    address private buyer = address(0xB0B);
    address private other = address(0xC0DE);
    address private treasury = address(0x7EEA);

    function setUp() public {
        vm.startPrank(deployer);
        token = new HackToken();
        presale = new PresaleAllocation(address(token), 1_000_000 ether, admin);
        token.mintTokens(address(presale), 1_000_000 ether);
        vm.stopPrank();
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    function testConstructorGrantsRolesToAdminNotDeployer() public {
        setUp();

        require(presale.hasRole(presale.DEFAULT_ADMIN_ROLE(), admin), "admin missing DEFAULT_ADMIN_ROLE");
        require(presale.hasRole(presale.ADMIN_ROLE(), admin), "admin missing ADMIN_ROLE");
        require(presale.hasRole(presale.PAUSER_ROLE(), admin), "admin missing PAUSER_ROLE");

        require(!presale.hasRole(presale.DEFAULT_ADMIN_ROLE(), deployer), "deployer kept DEFAULT_ADMIN_ROLE");
        require(!presale.hasRole(presale.ADMIN_ROLE(), deployer), "deployer kept ADMIN_ROLE");
        require(!presale.hasRole(presale.PAUSER_ROLE(), deployer), "deployer kept PAUSER_ROLE");
    }

    function testConstructorRevertsOnZeroToken() public {
        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.InvalidAddress.selector));
        new PresaleAllocation(address(0), 1_000_000 ether, admin);
    }

    function testConstructorRevertsOnZeroAdmin() public {
        setUp();
        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.InvalidAddress.selector));
        new PresaleAllocation(address(token), 1_000_000 ether, address(0));
    }

    function testConstructorRevertsOnZeroCap() public {
        setUp();
        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.AmountMustBeGreaterThanZero.selector));
        new PresaleAllocation(address(token), 0, admin);
    }

    // ---------------------------------------------------------------------
    // allocate / allocateBatch
    // ---------------------------------------------------------------------

    function testAllocateAndClaim() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 100 ether);

        vm.prank(admin);
        presale.finalizePresale();
        vm.warp(block.timestamp + 30 days);

        require(presale.claimableBalance(buyer) == uint256(100 ether) / 3, "claimable mismatch");

        uint256 beforeBalance = token.balanceOf(buyer);
        vm.prank(buyer);
        presale.claim();

        require(
            token.balanceOf(buyer) == beforeBalance + uint256(100 ether) / 3, "transfer mismatch"
        );
        require(presale.claimableBalance(buyer) == 0, "claimable not cleared");
        require(presale.totalClaimed() == uint256(100 ether) / 3, "total claimed mismatch");
    }

    function testAllocationIsCumulativeAcrossMultipleCalls() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 40 ether);
        vm.prank(admin);
        presale.allocate(buyer, 60 ether);

        require(presale.allocations(buyer) == 100 ether, "allocation not cumulative");
        require(presale.totalAllocated() == 100 ether, "totalAllocated not cumulative");
    }

    function testOnlyAdminCanAllocate() public {
        setUp();

        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                other,
                presale.ADMIN_ROLE()
            )
        );
        vm.prank(other);
        presale.allocate(buyer, 1 ether);
    }

    function testAllocateRevertsOnZeroBeneficiary() public {
        setUp();

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.InvalidAddress.selector));
        vm.prank(admin);
        presale.allocate(address(0), 1 ether);
    }

    function testAllocateRevertsOnZeroAmount() public {
        setUp();

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.AmountMustBeGreaterThanZero.selector));
        vm.prank(admin);
        presale.allocate(buyer, 0);
    }

    function testAllocateBatchLengthMismatchReverts() public {
        setUp();

        address[] memory beneficiaries = new address[](2);
        beneficiaries[0] = buyer;
        beneficiaries[1] = other;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1 ether;

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.LengthMismatch.selector));
        vm.prank(admin);
        presale.allocateBatch(beneficiaries, amounts);
    }

    function testAllocateBatchRevertsAfterFinalized() public {
        setUp();

        vm.prank(admin);
        presale.finalizePresale();

        address[] memory beneficiaries = new address[](1);
        beneficiaries[0] = buyer;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1 ether;

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.SaleFinalized.selector));
        vm.prank(admin);
        presale.allocateBatch(beneficiaries, amounts);
    }

    function testFinalizePreventsFurtherAllocation() public {
        setUp();

        vm.prank(admin);
        presale.finalizePresale();

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.SaleFinalized.selector));
        vm.prank(admin);
        presale.allocate(buyer, 1 ether);
    }

    function testCapPreventsOverAllocation() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 1_000_000 ether);

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.CapExceeded.selector));
        vm.prank(admin);
        presale.allocate(other, 1 ether);
    }

    // ---------------------------------------------------------------------
    // allocationListHash — compromiso con la lista de entrega
    // ---------------------------------------------------------------------

    function testAllocationListHashIsWriteOnce() public {
        setUp();

        bytes32 listHash = keccak256("direccion->monto, lista final firmada");

        vm.prank(admin);
        presale.setAllocationListHash(listHash);
        require(presale.allocationListHash() == listHash, "hash not stored");

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.ListHashAlreadySet.selector));
        vm.prank(admin);
        presale.setAllocationListHash(keccak256("otra lista"));

        require(presale.allocationListHash() == listHash, "hash must stay frozen");
    }

    function testAllocationListHashRejectsZero() public {
        setUp();

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.AmountMustBeGreaterThanZero.selector));
        vm.prank(admin);
        presale.setAllocationListHash(bytes32(0));
    }

    function testOnlyAdminCanSetAllocationListHash() public {
        setUp();

        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, other, presale.ADMIN_ROLE()
            )
        );
        vm.prank(other);
        presale.setAllocationListHash(keccak256("lista"));
    }

    // ---------------------------------------------------------------------
    // beneficiaryCount
    // ---------------------------------------------------------------------

    function testBeneficiaryCountCountsUniqueAddressesOnly() public {
        setUp();

        require(presale.beneficiaryCount() == 0, "should start at zero");

        vm.prank(admin);
        presale.allocate(buyer, 10 ether);
        require(presale.beneficiaryCount() == 1, "first buyer not counted");

        // Segunda compra del mismo comprador: no es un comprador nuevo.
        vm.prank(admin);
        presale.allocate(buyer, 10 ether);
        require(presale.beneficiaryCount() == 1, "same buyer counted twice");

        vm.prank(admin);
        presale.allocate(other, 10 ether);
        require(presale.beneficiaryCount() == 2, "second buyer not counted");
    }

    // ---------------------------------------------------------------------
    // finalizePresale
    // ---------------------------------------------------------------------

    function testOnlyAdminCanFinalize() public {
        setUp();

        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, other, presale.ADMIN_ROLE()
            )
        );
        vm.prank(other);
        presale.finalizePresale();
    }

    function testFinalizeIsIdempotent() public {
        setUp();

        vm.prank(admin);
        presale.finalizePresale();
        uint256 firstVestingStart = presale.vestingStart();

        vm.warp(block.timestamp + 10 days);
        vm.prank(admin);
        presale.finalizePresale();

        require(presale.vestingStart() == firstVestingStart, "vestingStart reset by second finalize");
    }

    // ---------------------------------------------------------------------
    // vestedBalance / claim — schedule and rounding
    // ---------------------------------------------------------------------

    function testVestingReleasesThreeMonthlyTranches() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 99 ether);
        vm.prank(admin);
        presale.finalizePresale();
        uint256 vestingStart = presale.vestingStart();

        vm.warp(vestingStart + 29 days);
        require(presale.claimableBalance(buyer) == 0, "cliff bypassed");

        vm.warp(vestingStart + 30 days);
        require(presale.claimableBalance(buyer) == 33 ether, "first tranche mismatch");
        vm.prank(buyer);
        presale.claim();

        vm.warp(vestingStart + 60 days);
        require(presale.claimableBalance(buyer) == 33 ether, "second tranche mismatch");
        vm.prank(buyer);
        presale.claim();

        vm.warp(vestingStart + 90 days);
        require(presale.claimableBalance(buyer) == 33 ether, "third tranche mismatch");
    }

    /// @dev 100 ether no se divide exacto entre 3, asi que este es el caso que realmente ejercita
    /// el truncamiento de la division entera. Ojo: el truncamiento ocurre a nivel de wei, no de
    /// ether — 100 ether / 3 son 33,333... ether, y el polvo que queda es de 1 wei. El ultimo tramo
    /// tiene que entregar ese wei de mas, porque `vestedBalance` devuelve `allocations[]` completo
    /// una vez que `releasedPeriods >= RELEASE_PERIODS` en vez de calcular `allocation * 3 / 3`.
    /// Si alguien "simplificara" esa rama, este test lo detecta.
    function testRoundingDustAbsorbedByFinalTranche() public {
        setUp();

        uint256 asignado = 100 ether;
        uint256 unTercio = asignado / 3;          // 33.333333333333333333
        uint256 dosTercios = (asignado * 2) / 3;  // 66.666666666666666666
        uint256 ultimoTramo = asignado - dosTercios;

        // El ultimo tramo es exactamente un wei mayor: ahi esta el polvo del redondeo.
        require(ultimoTramo == unTercio + 1, "el ultimo tramo debe llevarse el wei sobrante");

        vm.prank(admin);
        presale.allocate(buyer, asignado);
        vm.prank(admin);
        presale.finalizePresale();
        uint256 vestingStart = presale.vestingStart();

        vm.warp(vestingStart + 30 days);
        require(presale.claimableBalance(buyer) == unTercio, "primer tramo mal truncado");
        vm.prank(buyer);
        presale.claim();

        vm.warp(vestingStart + 60 days);
        require(presale.claimableBalance(buyer) == dosTercios - unTercio, "segundo tramo mal truncado");
        vm.prank(buyer);
        presale.claim();

        vm.warp(vestingStart + 90 days);
        require(presale.claimableBalance(buyer) == ultimoTramo, "el tercer tramo debe absorber el polvo");
        vm.prank(buyer);
        presale.claim();

        require(presale.claimed(buyer) == asignado, "no todo termino siendo reclamable");
        require(presale.claimableBalance(buyer) == 0, "quedo saldo despues de reclamar todo");
        require(token.balanceOf(buyer) == asignado, "el comprador no recibio el total exacto");
    }

    function testClaimRevertsWhenNotFinalized() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 100 ether);

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.NothingToClaim.selector));
        vm.prank(buyer);
        presale.claim();
    }

    function testClaimRevertsBeforeCliff() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 100 ether);
        vm.prank(admin);
        presale.finalizePresale();

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.NothingToClaim.selector));
        vm.prank(buyer);
        presale.claim();
    }

    /// @dev Directly answers "can a buyer withdraw twice?" — calls `claim()` immediately a second
    /// time in the same block and expects the exact same revert `claim()` uses when there is
    /// nothing new vested, proving the `claimed` bookkeeping (not just the passage of time) is what
    /// blocks a repeat withdrawal.
    function testDoubleClaimReverts() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 99 ether);
        vm.prank(admin);
        presale.finalizePresale();
        vm.warp(presale.vestingStart() + 30 days);

        vm.prank(buyer);
        presale.claim();

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.NothingToClaim.selector));
        vm.prank(buyer);
        presale.claim();
    }

    function testVestingStatusReturnsConsistentSnapshot() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 99 ether);
        vm.prank(admin);
        presale.finalizePresale();
        vm.warp(presale.vestingStart() + 30 days);

        PresaleAllocation.VestingStatus memory status = presale.vestingStatus(buyer);
        require(status.allocated == 99 ether, "status.allocated mismatch");
        require(status.claimedAmount == 0, "status.claimedAmount mismatch");
        require(status.vested == 33 ether, "status.vested mismatch");
        require(status.claimable == 33 ether, "status.claimable mismatch");

        vm.prank(buyer);
        presale.claim();

        status = presale.vestingStatus(buyer);
        require(status.claimedAmount == 33 ether, "status.claimedAmount after claim mismatch");
        require(status.claimable == 0, "status.claimable after claim mismatch");
    }

    /// @dev Property-style check standing in for the fuzz/invariant coverage the security checklist
    /// calls for (TS-13): for any allocation up to the cap and any point in time, a beneficiary can
    /// never claim more in total than was allocated to them.
    function testFuzz_ClaimNeverExceedsAllocation(uint256 amount, uint256 warpDays) public {
        setUp();

        amount = bound(amount, 1, 1_000_000 ether);
        warpDays = bound(warpDays, 0, 365);

        vm.prank(admin);
        presale.allocate(buyer, amount);
        vm.prank(admin);
        presale.finalizePresale();
        vm.warp(presale.vestingStart() + (warpDays * 1 days));

        uint256 vested = presale.vestedBalance(buyer);
        require(vested <= amount, "vested exceeds allocation");

        if (presale.claimableBalance(buyer) > 0) {
            vm.prank(buyer);
            presale.claim();
        }

        require(presale.claimed(buyer) <= amount, "claimed exceeds allocation");
        require(token.balanceOf(buyer) <= amount, "balance exceeds allocation");
    }

    function bound(uint256 value, uint256 min, uint256 max) private pure returns (uint256) {
        if (min == max) return min;
        return min + (value % (max - min + 1));
    }

    // ---------------------------------------------------------------------
    // withdrawUnallocated
    // ---------------------------------------------------------------------

    function testFinalizationReleasesOnlyUnsoldTokens() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 100 ether);
        vm.prank(admin);
        presale.finalizePresale();

        uint256 beforeBalance = token.balanceOf(admin);
        vm.prank(admin);
        presale.withdrawUnallocated(admin);

        require(token.balanceOf(admin) == beforeBalance + 999_900 ether, "unsold amount mismatch");
        require(token.balanceOf(address(presale)) == 100 ether, "allocated escrow changed");
    }

    function testUnallocatedWithdrawalCanOnlyRunOnce() public {
        setUp();

        vm.prank(admin);
        presale.finalizePresale();
        vm.prank(admin);
        presale.withdrawUnallocated(admin);

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.NothingToWithdraw.selector));
        vm.prank(admin);
        presale.withdrawUnallocated(admin);
    }

    function testWithdrawUnallocatedRevertsBeforeFinalize() public {
        setUp();

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.SaleNotFinalized.selector));
        vm.prank(admin);
        presale.withdrawUnallocated(admin);
    }

    function testWithdrawUnallocatedRevertsOnZeroRecipient() public {
        setUp();

        vm.prank(admin);
        presale.finalizePresale();

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.InvalidAddress.selector));
        vm.prank(admin);
        presale.withdrawUnallocated(address(0));
    }

    function testWithdrawUnallocatedRevertsWhenFullyAllocated() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 1_000_000 ether);
        vm.prank(admin);
        presale.finalizePresale();

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.NothingToWithdraw.selector));
        vm.prank(admin);
        presale.withdrawUnallocated(admin);
    }

    function testOnlyAdminCanWithdrawUnallocated() public {
        setUp();

        vm.prank(admin);
        presale.finalizePresale();

        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, other, presale.ADMIN_ROLE()
            )
        );
        vm.prank(other);
        presale.withdrawUnallocated(other);
    }

    // ---------------------------------------------------------------------
    // Pausable
    // ---------------------------------------------------------------------

    function testPauseBlocksAllocateClaimAndFinalize() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 99 ether);
        vm.prank(admin);
        presale.finalizePresale();
        vm.warp(presale.vestingStart() + 30 days);

        vm.prank(admin);
        presale.pause();

        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        vm.prank(admin);
        presale.allocate(other, 1 ether);

        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        vm.prank(buyer);
        presale.claim();

        vm.expectRevert(abi.encodeWithSelector(Pausable.EnforcedPause.selector));
        vm.prank(admin);
        presale.finalizePresale();
    }

    function testUnpauseRestoresClaim() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 99 ether);
        vm.prank(admin);
        presale.finalizePresale();
        vm.warp(presale.vestingStart() + 30 days);

        vm.prank(admin);
        presale.pause();
        vm.prank(admin);
        presale.unpause();

        vm.prank(buyer);
        presale.claim();
        require(presale.claimed(buyer) == 33 ether, "claim did not go through after unpause");
    }

    function testWithdrawUnallocatedWorksWhilePaused() public {
        setUp();

        vm.prank(admin);
        presale.finalizePresale();
        vm.prank(admin);
        presale.pause();

        vm.prank(admin);
        presale.withdrawUnallocated(admin);
        require(token.balanceOf(admin) == 1_000_000 ether, "admin should still recover unsold cap while paused");
    }

    function testOnlyPauserCanPause() public {
        setUp();

        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, other, presale.PAUSER_ROLE()
            )
        );
        vm.prank(other);
        presale.pause();
    }

    // ---------------------------------------------------------------------
    // Fecha límite de reclamo (día +180) y barrido a tesorería — tareas 10 y 11
    // ---------------------------------------------------------------------

    /// @dev Tarea 11, primera mitad: "el retiro el día +179 funciona y el +181 no".
    function testClaimWorksBeforeDeadlineAndFailsAfter() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 99 ether);
        vm.prank(admin);
        presale.finalizePresale();
        uint256 vestingStart = presale.vestingStart();

        vm.warp(vestingStart + 179 days);
        require(presale.claimableBalance(buyer) == 99 ether, "todo deberia estar disponible el dia 179");
        vm.prank(buyer);
        presale.claim();
        require(presale.claimed(buyer) == 99 ether, "el reclamo del dia 179 debio pasar");

        // Un segundo comprador que no alcanzó a reclamar.
        setUp();
        vm.prank(admin);
        presale.allocate(other, 99 ether);
        vm.prank(admin);
        presale.finalizePresale();
        vestingStart = presale.vestingStart();

        vm.warp(vestingStart + 181 days);
        require(presale.claimableBalance(other) == 0, "no debe quedar nada disponible pasado el plazo");

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.ClaimPeriodOver.selector));
        vm.prank(other);
        presale.claim();
    }

    /// @dev El día +180 exacto todavía cuenta como dentro del plazo ("hasta el día +180").
    function testClaimStillWorksExactlyOnDeadline() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 99 ether);
        vm.prank(admin);
        presale.finalizePresale();

        vm.warp(presale.vestingStart() + 180 days);
        require(!presale.claimPeriodOver(), "el dia 180 exacto aun esta dentro del plazo");
        vm.prank(buyer);
        presale.claim();
        require(presale.claimed(buyer) == 99 ether, "el reclamo del dia 180 debio pasar");
    }

    /// @dev Tarea 11, segunda mitad: "el envío a la tesorería solo ocurre una vez y tras el plazo".
    function testSweepOnlyAfterDeadlineAndOnlyOnce() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 100 ether);
        vm.prank(admin);
        presale.finalizePresale();
        uint256 vestingStart = presale.vestingStart();

        // Antes del plazo no se puede barrer, ni siquiera con todo vencido.
        vm.warp(vestingStart + 100 days);
        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.ClaimPeriodNotOver.selector));
        vm.prank(admin);
        presale.sweepUnclaimed(treasury);

        // Pasado el plazo, se barre todo lo que quede en el contrato.
        vm.warp(vestingStart + 181 days);
        uint256 enElContrato = token.balanceOf(address(presale));
        vm.prank(admin);
        presale.sweepUnclaimed(treasury);

        require(token.balanceOf(treasury) == enElContrato, "la tesoreria no recibio el remanente");
        require(token.balanceOf(address(presale)) == 0, "el contrato debio quedar vacio");

        // Y solo una vez.
        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.NothingToSweep.selector));
        vm.prank(admin);
        presale.sweepUnclaimed(treasury);
    }

    /// @dev Lo ya reclamado por un comprador no se puede barrer: solo se va lo que quedó sin retirar.
    function testSweepTakesOnlyWhatWasNotClaimed() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 99 ether);
        vm.prank(admin);
        presale.finalizePresale();
        uint256 vestingStart = presale.vestingStart();

        // El comprador reclama su primer tramo y luego se olvida.
        vm.warp(vestingStart + 30 days);
        vm.prank(buyer);
        presale.claim();
        require(token.balanceOf(buyer) == 33 ether, "primer tramo mal entregado");

        vm.warp(vestingStart + 181 days);
        vm.prank(admin);
        presale.sweepUnclaimed(treasury);

        require(token.balanceOf(buyer) == 33 ether, "lo ya reclamado no debe moverse");
        require(token.balanceOf(treasury) == 1_000_000 ether - 33 ether, "la tesoreria debe recibir el resto");
    }

    function testSweepRevertsBeforeFinalize() public {
        setUp();

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.SaleNotFinalized.selector));
        vm.prank(admin);
        presale.sweepUnclaimed(treasury);
    }

    function testSweepRevertsOnZeroRecipient() public {
        setUp();

        vm.prank(admin);
        presale.finalizePresale();
        vm.warp(presale.vestingStart() + 181 days);

        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.InvalidAddress.selector));
        vm.prank(admin);
        presale.sweepUnclaimed(address(0));
    }

    function testOnlyAdminCanSweep() public {
        setUp();

        vm.prank(admin);
        presale.finalizePresale();
        vm.warp(presale.vestingStart() + 181 days);

        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector, other, presale.ADMIN_ROLE()
            )
        );
        vm.prank(other);
        presale.sweepUnclaimed(treasury);
    }

    function testClaimDeadlineIsZeroUntilFinalized() public {
        setUp();

        require(presale.claimDeadline() == 0, "sin cierre no hay fecha limite");
        require(!presale.claimPeriodOver(), "sin cierre el plazo no puede estar vencido");

        vm.prank(admin);
        presale.finalizePresale();

        require(
            presale.claimDeadline() == presale.vestingStart() + 180 days,
            "la fecha limite debe ser el cierre + 180 dias"
        );
    }

    function testVestingStatusExposesDeadline() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 99 ether);
        vm.prank(admin);
        presale.finalizePresale();
        vm.warp(presale.vestingStart() + 30 days);

        PresaleAllocation.VestingStatus memory status = presale.vestingStatus(buyer);
        require(status.deadline == presale.vestingStart() + 180 days, "deadline mal expuesto");
        require(status.claimable == 33 ether, "claimable mal expuesto");
    }

    // ---------------------------------------------------------------------
    // La pausa corre la fecha limite (decision del equipo, oct 2026)
    // ---------------------------------------------------------------------

    /// @dev Si el contrato estuvo pausado 20 dias despues del cierre, el plazo se corre 20 dias,
    /// y un reclamo que con el plazo original habria fallado ahora funciona.
    function testPauseAfterCloseExtendsTheDeadline() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 99 ether);
        vm.prank(admin);
        presale.finalizePresale();
        uint256 vestingStart = presale.vestingStart();
        uint256 plazoOriginal = presale.claimDeadline();

        require(plazoOriginal == vestingStart + 180 days, "plazo inicial mal calculado");

        // Incidente: 20 dias pausado, bastante despues del cierre.
        vm.warp(vestingStart + 100 days);
        vm.prank(admin);
        presale.pause();
        vm.warp(vestingStart + 120 days);
        vm.prank(admin);
        presale.unpause();

        require(presale.pausedTime() == 20 days, "no acumulo los dias pausados");
        require(presale.claimDeadline() == plazoOriginal + 20 days, "el plazo no se corrio");

        // Dia +185: con el plazo original ya estaria cerrado; con la extension, no.
        vm.warp(vestingStart + 185 days);
        require(!presale.claimPeriodOver(), "el plazo deberia seguir abierto");
        vm.prank(buyer);
        presale.claim();
        require(presale.claimed(buyer) == 99 ether, "el reclamo del dia 185 debio pasar");

        // Dia +201: ya pasado incluso el plazo extendido.
        setUp();
        vm.prank(admin);
        presale.allocate(other, 99 ether);
        vm.prank(admin);
        presale.finalizePresale();
        vestingStart = presale.vestingStart();
        vm.warp(vestingStart + 100 days);
        vm.prank(admin);
        presale.pause();
        vm.warp(vestingStart + 120 days);
        vm.prank(admin);
        presale.unpause();

        vm.warp(vestingStart + 201 days);
        require(presale.claimPeriodOver(), "pasado el plazo extendido debe estar cerrado");
        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.ClaimPeriodOver.selector));
        vm.prank(other);
        presale.claim();
    }

    /// @dev Mientras la pausa sigue en curso, el plazo se mueve con ella segundo a segundo.
    function testDeadlineMovesWhilePauseIsStillOn() public {
        setUp();

        vm.prank(admin);
        presale.finalizePresale();
        uint256 vestingStart = presale.vestingStart();
        uint256 plazoOriginal = presale.claimDeadline();

        vm.warp(vestingStart + 50 days);
        vm.prank(admin);
        presale.pause();

        vm.warp(vestingStart + 57 days);
        require(presale.pausedTime() == 7 days, "la pausa en curso no se esta contando");
        require(presale.claimDeadline() == plazoOriginal + 7 days, "el plazo no se movio con la pausa");
    }

    /// @dev Una pausa anterior al cierre no corre nada: el reloj del reclamo todavia no arranco.
    function testPauseBeforeCloseDoesNotExtendTheDeadline() public {
        setUp();

        vm.prank(admin);
        presale.pause();
        vm.warp(block.timestamp + 15 days);
        vm.prank(admin);
        presale.unpause();

        require(presale.pausedTime() == 0, "antes del cierre no hay nada que compensar");

        vm.prank(admin);
        presale.finalizePresale();

        require(
            presale.claimDeadline() == presale.vestingStart() + 180 days,
            "una pausa previa al cierre no debe correr el plazo"
        );
    }

    /// @dev Varias pausas se suman.
    function testSeveralPausesAccumulate() public {
        setUp();

        vm.prank(admin);
        presale.finalizePresale();
        uint256 vestingStart = presale.vestingStart();

        vm.warp(vestingStart + 40 days);
        vm.prank(admin);
        presale.pause();
        vm.warp(vestingStart + 45 days);
        vm.prank(admin);
        presale.unpause();

        vm.warp(vestingStart + 90 days);
        vm.prank(admin);
        presale.pause();
        vm.warp(vestingStart + 93 days);
        vm.prank(admin);
        presale.unpause();

        require(presale.pausedTime() == 8 days, "las pausas deben sumarse");
        require(
            presale.claimDeadline() == vestingStart + 188 days,
            "el plazo debe correrse la suma de ambas pausas"
        );
    }

    /// @dev El barrido tambien respeta el plazo extendido: no se puede adelantar pausando.
    function testSweepRespectsTheExtendedDeadline() public {
        setUp();

        vm.prank(admin);
        presale.allocate(buyer, 100 ether);
        vm.prank(admin);
        presale.finalizePresale();
        uint256 vestingStart = presale.vestingStart();

        vm.warp(vestingStart + 100 days);
        vm.prank(admin);
        presale.pause();
        vm.warp(vestingStart + 120 days);
        vm.prank(admin);
        presale.unpause();

        // Dia +185: pasado el plazo original, dentro del extendido. No se puede barrer todavia.
        vm.warp(vestingStart + 185 days);
        vm.expectRevert(abi.encodeWithSelector(PresaleAllocation.ClaimPeriodNotOver.selector));
        vm.prank(admin);
        presale.sweepUnclaimed(treasury);

        // Dia +201: ya pasado el extendido.
        vm.warp(vestingStart + 201 days);
        vm.prank(admin);
        presale.sweepUnclaimed(treasury);
        require(token.balanceOf(treasury) > 0, "el barrido debio ejecutarse tras el plazo extendido");
    }
}
