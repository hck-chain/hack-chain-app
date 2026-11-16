// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity 0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title PresaleAllocation
 * @author HackChain- Julian Ruiz
 * @notice Administrative allocation ledger and vesting/claim contract for the
 * public HACK presale. Covers tasks 1 to 11 of the Blockchain layer in
 * "Tareas por capa — HACK".
 * @dev This contract does NOT sell tokens. The purchase itself happens off-chain
 * (buyer transfers the payment asset directly to the treasury address; the
 * backend validates the on-chain payment by transaction hash — see
 * `BE-04`..`BE-09` in the requirements doc). Once the sale window closes, the
 * backend exports the buyer -> amount ledger and the presale multisig writes
 * it here via {allocate}/{allocateBatch}. From that point on this contract is
 * the sole source of truth for what each buyer is owed and when.
 *
 * Custody model: the full `presaleCap` is minted to this contract's address
 * before any allocation is written (an escrow-prefunded design), so every
 * allocation accepted by {allocate}/{allocateBatch} is backed by tokens this
 * contract already holds — it never needs `MINTER_ROLE` on the HACK token.
 *
 * Vesting schedule (whitepaper, confirmed 1:1 with `INFORME_IMPLEMENTACION.md`):
 * a {CLIFF_DURATION} of 30 days starting at {finalizePresale}, then
 * {RELEASE_PERIODS} equal monthly tranches. The last tranche always releases
 * the exact remainder of the allocation (not a third, rounded) so integer
 * division never leaves unclaimable dust behind.
 *
 * Claim window: buyers have until {CLAIM_DEADLINE} (180 days) after the close
 * to withdraw, extended by any time the contract spends paused in that window,
 * so an emergency pause never costs a buyer their right. Past that point
 * {claim} is closed for good and whatever is left in the contract is swept to
 * the treasury with {sweepUnclaimed}.
 *
 * Because the sale itself happens off-chain, this contract cannot re-verify
 * what it is told: an {allocate} call arrives as a bare buyer -> amount pair,
 * with no price, phase or payment attached. `presaleCap` is the only automatic
 * backstop, and it only catches errors large enough to overflow it. The agreed
 * design puts the second check in the process rather than in the code: the
 * delivery list is rebuilt independently by a second person before signing, and
 * {allocationListHash} freezes the approved list on-chain so the published
 * buyer registry can be audited against it afterwards.
 *
 * By decision of the team there is no per-address ceiling and no rescue
 * function. One consequence to be aware of: a foreign token sent to this
 * contract by mistake can never be recovered. HACK sent by mistake is recovered
 * only indirectly, by {sweepUnclaimed}, and only after the claim deadline.
 */
contract PresaleAllocation is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Role allowed to allocate, finalize, withdraw the unsold cap and sweep after the deadline.
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Role allowed to pause/unpause allocation and claims in an emergency. Granted to admin_ at deploy;
    /// operationally it can be delegated to a separate, faster-to-react key without handing out ADMIN_ROLE.
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @notice Lock-up period after {finalizePresale} during which nothing is claimable.
    uint256 public constant CLIFF_DURATION = 30 days;

    /// @notice Length of each vesting release period after the cliff.
    uint256 public constant RELEASE_INTERVAL = 30 days;

    /// @notice Number of equal monthly tranches the allocation vests over.
    uint256 public constant RELEASE_PERIODS = 3;

    /// @notice How long after the close a buyer has to claim. Past this point {claim} is closed
    /// permanently and the remainder goes to the treasury via {sweepUnclaimed}.
    /// @dev 180 days leaves 90 days of margin after the last tranche unlocks at day +90. Any time
    /// the contract spends paused after the close is added on top — see {claimDeadline}.
    uint256 public constant CLAIM_DEADLINE = 180 days;

    /// @notice The HACK token distributed by this contract. Fixed at deploy time; never changes.
    IERC20 public immutable hackToken;

    /// @notice Maximum amount of `hackToken` this contract will ever allocate across all buyers.
    uint256 public immutable presaleCap;

    /// @notice Running total of everything ever allocated via {allocate}/{allocateBatch}. Never decreases.
    uint256 public totalAllocated;

    /// @notice Running total of everything ever paid out via {claim}.
    uint256 public totalClaimed;

    /// @notice Timestamp {finalizePresale} was called; the vesting clock's zero point. Zero until finalized.
    uint256 public vestingStart;

    /// @notice True once {finalizePresale} has run. Freezes new allocations and starts vesting.
    bool public finalized;

    /// @notice True once {withdrawUnallocated} has run. That function can only ever succeed once.
    bool public unallocatedWithdrawn;

    /// @notice True once {sweepUnclaimed} has run. That function can only ever succeed once.
    bool public unclaimedSwept;

    /// @notice Timestamp of the pause currently in force. Zero while the contract is not paused.
    uint256 public pausedAt;

    /// @notice Total time the contract has been paused since the close, in seconds. The claim
    /// deadline is pushed back by exactly this much, so a pause never costs a buyer their right.
    uint256 public pausedTimeAccrued;

    /// @notice Total HACK ever allocated to a beneficiary (across allocate/allocateBatch calls, cumulative).
    mapping(address => uint256) public allocations;

    /// @notice Total HACK a beneficiary has already withdrawn via {claim}.
    mapping(address => uint256) public claimed;

    /// @notice Number of distinct addresses that have received an allocation. Lets the backend serve
    /// "nº de compradores" without replaying every event.
    uint256 public beneficiaryCount;

    /// @notice One-time commitment to the delivery list the multisig signed off on. Zero until set.
    /// @dev Operationally this should be the hash of the exact buyer -> amount file exported by the
    /// backend (BE-12) and published in the public registry, recorded in the same multisig session as
    /// the final batch. Once written it can never change, so anyone holding the published file can
    /// prove on-chain that it is the list that was actually used.
    bytes32 public allocationListHash;

    error InvalidAddress();
    error AmountMustBeGreaterThanZero();
    error CapExceeded();
    error SaleFinalized();
    error SaleNotFinalized();
    error NothingToClaim();
    error NothingToWithdraw();
    error LengthMismatch();
    /// @notice {allocationListHash} is a one-time commitment and was already written.
    error ListHashAlreadySet();
    /// @notice The claim deadline has passed; {claim} is closed for good.
    error ClaimPeriodOver();
    /// @notice {sweepUnclaimed} was called before the claim deadline.
    error ClaimPeriodNotOver();
    /// @notice {sweepUnclaimed} already ran, or there is nothing left to sweep.
    error NothingToSweep();

    event AllocationAssigned(address indexed beneficiary, uint256 amount, uint256 totalAllocation);
    event Claimed(address indexed beneficiary, uint256 amount);
    event PresaleFinalized(uint256 totalAllocated, uint256 totalClaimed);
    event UnallocatedWithdrawn(address indexed recipient, uint256 amount);
    event AllocationListHashSet(bytes32 listHash);
    event UnclaimedSwept(address indexed recipient, uint256 amount);
    event ClaimDeadlineExtended(uint256 pausedSeconds, uint256 newDeadline);

    /// @notice Snapshot of a single beneficiary's position, for backend reads (requirement PV-16).
    struct VestingStatus {
        uint256 allocated;
        uint256 claimedAmount;
        uint256 vested;
        uint256 claimable;
        uint256 deadline;
    }

    /**
     * @notice Deploys the presale ledger and hands every administrative role to `admin_` directly.
     * @dev `admin_` is granted `DEFAULT_ADMIN_ROLE`, `ADMIN_ROLE` and `PAUSER_ROLE` here, in the
     * constructor — never to `msg.sender`/the deployer. This closes a centralization gap found in
     * the previous version of this contract, where the deployer kept every role unless a separate,
     * easy-to-forget revoke step ran afterwards (confirmed missing in `script/DeployCore.s.sol`).
     * `admin_` is expected to be the operational multisig (e.g. the 2-of-3 Safe), not an EOA.
     * @param hackToken_ Address of the HACK ERC20 token. Must already exist and be non-zero.
     * @param presaleCap_ Maximum HACK this contract will ever allocate. Must be greater than zero.
     * @param admin_ Address to receive all administrative roles. Must be non-zero.
     */
    constructor(address hackToken_, uint256 presaleCap_, address admin_) {
        if (hackToken_ == address(0)) revert InvalidAddress();
        if (admin_ == address(0)) revert InvalidAddress();
        if (presaleCap_ == 0) revert AmountMustBeGreaterThanZero();

        hackToken = IERC20(hackToken_);
        presaleCap = presaleCap_;

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(ADMIN_ROLE, admin_);
        _grantRole(PAUSER_ROLE, admin_);
    }

    /**
     * @notice Assigns (or adds to) a single beneficiary's allocation.
     * @dev Reverts if the sale is finalized or paused, so no allocation can be written after the
     * buyer-facing ledger is supposed to be frozen. See {_allocate} for the invariant checks.
     * @param beneficiary_ Address that will be able to {claim} this allocation.
     * @param amount_ HACK to add to `beneficiary_`'s existing allocation.
     */
    function allocate(address beneficiary_, uint256 amount_) external whenNotPaused onlyRole(ADMIN_ROLE) {
        _allocate(beneficiary_, amount_);
    }

    /**
     * @notice Assigns allocations to many beneficiaries in a single transaction.
     * @dev Same invariants as {allocate}, applied per entry. Intended for the batch export the
     * backend produces at close (`BE-12`) so the multisig only needs to sign once per chunk instead
     * of once per buyer.
     * @param beneficiaries_ Addresses to allocate to, same length and order as `amounts_`.
     * @param amounts_ HACK amount for each corresponding beneficiary.
     */
    function allocateBatch(address[] calldata beneficiaries_, uint256[] calldata amounts_)
        external
        whenNotPaused
        onlyRole(ADMIN_ROLE)
    {
        if (finalized) revert SaleFinalized();
        if (beneficiaries_.length != amounts_.length) revert LengthMismatch();

        for (uint256 i; i < beneficiaries_.length;) {
            _allocate(beneficiaries_[i], amounts_[i]);
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @notice Transfers the caller's currently-vested, not-yet-claimed HACK to the caller.
     * @dev Checks-effects-interactions: `claimed`/`totalClaimed` are updated before the external
     * `safeTransfer` call, and `nonReentrant` is a second, independent guard against reentrancy.
     * Reverts with {ClaimPeriodOver} once {CLAIM_DEADLINE} has passed, and with {NothingToClaim}
     * if nothing is currently claimable (before the cliff, in between tranches with nothing new
     * vested, or after everything owed has already been withdrawn).
     */
    function claim() external whenNotPaused nonReentrant {
        if (claimPeriodOver()) revert ClaimPeriodOver();

        uint256 claimable = claimableBalance(msg.sender);
        if (claimable == 0) revert NothingToClaim();

        claimed[msg.sender] += claimable;
        totalClaimed += claimable;

        hackToken.safeTransfer(msg.sender, claimable);

        emit Claimed(msg.sender, claimable);
    }

    /**
     * @notice HACK a beneficiary can withdraw right now via {claim}.
     * @dev Returns zero once the claim deadline has passed, so the frontend shows a real "nothing
     * available" instead of a figure the buyer can no longer withdraw. {vestedBalance} keeps
     * reporting the full vested amount, so what was forfeited is still auditable.
     * @param beneficiary_ Address to check.
     * @return The vested amount not yet claimed. Zero if nothing is currently claimable.
     */
    function claimableBalance(address beneficiary_) public view returns (uint256) {
        if (claimPeriodOver()) return 0;
        return vestedBalance(beneficiary_) - claimed[beneficiary_];
    }

    /**
     * @notice Timestamp after which no one can claim any more. Zero while the sale is still open.
     * @dev Equals the close plus {CLAIM_DEADLINE} plus every second the contract has spent paused
     * since the close, so an emergency pause can never eat into a buyer's claim window. While a
     * pause is in force the deadline keeps moving with it, second by second.
     */
    function claimDeadline() public view returns (uint256) {
        if (!finalized) return 0;
        return vestingStart + CLAIM_DEADLINE + pausedTime();
    }

    /**
     * @notice Total time the contract has been paused since the close, including a pause still in
     * force right now.
     * @dev Pauses that happen before {finalizePresale} are not counted: the claim clock has not
     * started yet, so there is nothing to compensate. A pause cannot straddle the close either,
     * because {finalizePresale} itself is blocked while paused.
     */
    function pausedTime() public view returns (uint256) {
        if (!finalized) return 0;
        if (paused() && pausedAt != 0) {
            return pausedTimeAccrued + (block.timestamp - pausedAt);
        }
        return pausedTimeAccrued;
    }

    /**
     * @notice True once the claim window has closed. Always false before {finalizePresale}.
     */
    function claimPeriodOver() public view returns (bool) {
        return finalized && block.timestamp > claimDeadline();
    }

    /**
     * @notice Total HACK vested for a beneficiary as of now, regardless of how much was already claimed.
     * @dev Zero before {finalizePresale} runs or before the cliff elapses. From the cliff onward, vests
     * in three equal monthly steps; the third step always returns the full `allocations[beneficiary_]`
     * (not a proportional third) so truncation from integer division never strands dust.
     * @param beneficiary_ Address to check.
     * @return The cumulative vested amount for `beneficiary_`.
     */
    function vestedBalance(address beneficiary_) public view returns (uint256) {
        if (!finalized || block.timestamp < vestingStart + CLIFF_DURATION) return 0;

        uint256 releasedPeriods = (block.timestamp - vestingStart) / RELEASE_INTERVAL;
        if (releasedPeriods >= RELEASE_PERIODS) return allocations[beneficiary_];

        return (allocations[beneficiary_] * releasedPeriods) / RELEASE_PERIODS;
    }

    /**
     * @notice One-call snapshot of a beneficiary's position, for backend reads (PV-16).
     * @param beneficiary_ Address to check.
     * @return status Struct with the total allocated, already claimed, currently vested and
     * currently claimable amounts for `beneficiary_`, plus the claim deadline.
     */
    function vestingStatus(address beneficiary_) external view returns (VestingStatus memory status) {
        status.allocated = allocations[beneficiary_];
        status.claimedAmount = claimed[beneficiary_];
        status.vested = vestedBalance(beneficiary_);
        status.claimable = claimableBalance(beneficiary_);
        status.deadline = claimDeadline();
    }

    /**
     * @notice Records, once and for all, the hash of the delivery list the multisig signed off on.
     * @dev Write-once: a second call reverts with {ListHashAlreadySet}. This is what makes the
     * off-chain list auditable — the buyer registry published on the site can be checked against this
     * commitment by anyone, and it cannot be quietly edited afterwards. Should be called in the same
     * multisig session as the final {allocateBatch}.
     * @param listHash_ Hash of the exported buyer -> amount file. Must be non-zero.
     */
    function setAllocationListHash(bytes32 listHash_) external onlyRole(ADMIN_ROLE) {
        if (allocationListHash != bytes32(0)) revert ListHashAlreadySet();
        if (listHash_ == bytes32(0)) revert AmountMustBeGreaterThanZero();

        allocationListHash = listHash_;

        emit AllocationListHashSet(listHash_);
    }

    /**
     * @notice Freezes new allocations and starts the vesting clock. Idempotent — calling it again
     * after the first time is a silent no-op, it never resets `vestingStart`.
     * @dev This is the single event that turns the buyer's off-chain "promise" into an on-chain,
     * time-locked right (see the plan doc's end-to-end diagram). Paused while the contract is
     * paused, so an incident can't be finalized into motion before it's resolved.
     */
    function finalizePresale() external whenNotPaused onlyRole(ADMIN_ROLE) {
        if (!finalized) {
            finalized = true;
            vestingStart = block.timestamp;
            emit PresaleFinalized(totalAllocated, totalClaimed);
        }
    }

    /**
     * @notice Returns the never-allocated part of the prefunded cap to `recipient_`. Can only
     * succeed once in the contract's lifetime.
     * @dev Only reachable after {finalizePresale}, once `totalAllocated` is frozen for good. Does
     * NOT touch tokens allocated to a buyer who has not claimed yet — those stay in the contract
     * until the claim deadline passes and {sweepUnclaimed} collects whatever is left.
     * @param recipient_ Address to receive the unsold HACK. Must be non-zero.
     */
    function withdrawUnallocated(address recipient_) external onlyRole(ADMIN_ROLE) nonReentrant {
        if (!finalized) revert SaleNotFinalized();
        if (recipient_ == address(0)) revert InvalidAddress();
        if (unallocatedWithdrawn) revert NothingToWithdraw();

        uint256 amount = presaleCap - totalAllocated;
        if (amount == 0) revert NothingToWithdraw();

        unallocatedWithdrawn = true;
        hackToken.safeTransfer(recipient_, amount);

        emit UnallocatedWithdrawn(recipient_, amount);
    }

    /**
     * @notice After the claim deadline, sends everything left in the contract to the treasury.
     * Can only succeed once in the contract's lifetime.
     * @dev Sweeps the contract's whole HACK balance, not just `totalAllocated - totalClaimed`. By
     * that point anything still here is either unsold cap that was never withdrawn, an allocation
     * nobody claimed in 180 days, or HACK someone sent here by mistake — all three belong to the
     * treasury and none of them should be left stranded. Buyers cannot be harmed by the timing:
     * {claim} is already permanently closed when this becomes callable.
     * @param recipient_ Treasury address to receive the remainder. Must be non-zero.
     */
    function sweepUnclaimed(address recipient_) external onlyRole(ADMIN_ROLE) nonReentrant {
        if (!finalized) revert SaleNotFinalized();
        if (!claimPeriodOver()) revert ClaimPeriodNotOver();
        if (recipient_ == address(0)) revert InvalidAddress();
        if (unclaimedSwept) revert NothingToSweep();

        uint256 amount = hackToken.balanceOf(address(this));
        if (amount == 0) revert NothingToSweep();

        unclaimedSwept = true;
        hackToken.safeTransfer(recipient_, amount);

        emit UnclaimedSwept(recipient_, amount);
    }

    /// @notice Pauses {allocate}, {allocateBatch}, {claim} and {finalizePresale}. Does not pause
    /// {withdrawUnallocated} or {sweepUnclaimed}, so the admin can still move funds to the treasury
    /// during an incident even while the buyer-facing surface is frozen.
    /// @dev Records when the pause started so {unpause} can push the claim deadline back by the
    /// same amount. A second {pause} call cannot overwrite the timestamp: OpenZeppelin's `_pause`
    /// already reverts while paused.
    function pause() external onlyRole(PAUSER_ROLE) {
        pausedAt = block.timestamp;
        _pause();
    }

    /// @notice Reverses {pause} and credits the elapsed time to the claim deadline.
    /// @dev Only pauses after the close move the deadline — before it the claim clock has not
    /// started, so there is nothing to compensate.
    function unpause() external onlyRole(PAUSER_ROLE) {
        if (finalized && pausedAt != 0 && block.timestamp > pausedAt) {
            uint256 elapsed = block.timestamp - pausedAt;
            pausedTimeAccrued += elapsed;
            emit ClaimDeadlineExtended(elapsed, vestingStart + CLAIM_DEADLINE + pausedTimeAccrued);
        }

        pausedAt = 0;
        _unpause();
    }

    /**
     * @dev Shared allocation invariants for {allocate} and {allocateBatch}: no zero address, no
     * zero amount, never over `presaleCap`, and never after {finalizePresale}. Entries accumulate,
     * so several rows for the same address across one or more batches are added together.
     * @param beneficiary_ Address to credit.
     * @param amount_ Amount to add to `beneficiary_`'s allocation.
     */
    function _allocate(address beneficiary_, uint256 amount_) internal {
        if (finalized) revert SaleFinalized();
        if (beneficiary_ == address(0)) revert InvalidAddress();
        if (amount_ == 0) revert AmountMustBeGreaterThanZero();
        if (totalAllocated + amount_ > presaleCap) revert CapExceeded();

        uint256 previousAllocation = allocations[beneficiary_];
        uint256 newAllocation = previousAllocation + amount_;

        if (previousAllocation == 0) {
            unchecked {
                ++beneficiaryCount;
            }
        }

        allocations[beneficiary_] = newAllocation;
        totalAllocated += amount_;

        emit AllocationAssigned(beneficiary_, amount_, newAllocation);
    }
}
