// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * AgentLevy Treasury — Protocol Managed Wallet
 *
 * The trust and settlement layer for agent-to-agent commerce.
 *
 * Core guarantee:
 *   Agent A commits to a task spec hash at escrow time.
 *   Agent B knows exactly what they're being evaluated against before starting.
 *   The TEE verifies output against the COMMITTED spec — not whatever either party claims.
 *   PMW won't release funds without a valid attestation from a verified TEE.
 *   Levy routes at the moment of attestation — architectural, not enforced.
 *
 * Nobody controls this treasury.
 * The private key lives in a Flare TEE controlled by validator consensus.
 *
 * ETHGlobal Cannes 2026 — Built on Flare + XRPL
 */
contract Treasury {

    // ─── CONSTANTS ────────────────────────────────────────────────────────────

    uint256 public constant MAX_LEVY_BPS  = 500;  // 5% maximum levy
    uint256 public constant DISPUTE_WINDOW = 24 hours;

    // ─── STATE ────────────────────────────────────────────────────────────────

    address public owner;
    uint256 public levyBasisPoints = 50;   // 0.5% default
    uint256 public totalLevyCollected;
    uint256 public totalTasksSettled;
    uint256 public totalTaskVolume;

    // Registered TEE verifier addresses
    // In production: actual Flare TEE attestation addresses
    // For hackathon: deployer address as mock TEE
    mapping(address => bool) public verifiedTEEs;

    // ─── TASK SPEC REGISTRY ───────────────────────────────────────────────────
    mapping(bytes32 => bool)   public registeredSpecHashes;
    mapping(bytes32 => string) public specHashToServiceId;

    // ─── ESCROW ───────────────────────────────────────────────────────────────

    enum TaskStatus {
        NonExistent,
        Escrowed,
        Verified,
        Settled,
        Disputed,
        Refunded
    }

    struct EscrowRecord {
        address     agentA;
        address     agentB;
        uint256     totalAmount;
        uint256     levyAmount;
        uint256     taskFee;
        bytes32     taskSpecHash;
        string      serviceId;
        TaskStatus  status;
        uint256     escrowedAt;
        uint256     settledAt;
        bytes32     attestationHash;
    }

    mapping(bytes32 => EscrowRecord) public escrows;

    // ─── ATTESTATION RECORDS ──────────────────────────────────────────────────

    struct AttestationRecord {
        bytes32 taskId;
        bytes32 specHash;
        bytes32 outputHash;
        address verifiedBy;
        uint256 timestamp;
        bool    passed;
        string  score;
    }

    mapping(bytes32 => AttestationRecord) public attestations;

    // ─── LEVY HISTORY (for Taxai dashboard) ───────────────────────────────────

    struct LevyRecord {
        bytes32 taskId;
        address agentA;
        address agentB;
        uint256 taskFee;
        uint256 levyAmount;
        uint256 timestamp;
        bytes32 attestationHash;
    }

    LevyRecord[] public levyHistory;

    // ─── EVENTS ───────────────────────────────────────────────────────────────

    event TaskEscrowed(
        bytes32 indexed taskId,
        address indexed agentA,
        address indexed agentB,
        uint256 totalAmount,
        uint256 levyAmount,
        bytes32 taskSpecHash,
        string  serviceId
    );

    event AttestationSubmitted(
        bytes32 indexed taskId,
        address indexed verifier,
        bool    passed,
        string  score
    );

    event LevySettled(
        bytes32 indexed taskId,
        address indexed agentA,
        address indexed agentB,
        uint256 taskFee,
        uint256 levyAmount,
        string  serviceId,
        bytes32 attestationHash,
        uint256 timestamp
    );

    event TaskDisputed(bytes32 indexed taskId, address indexed disputedBy);
    event TaskRefunded(bytes32 indexed taskId, uint256 amount);
    event LevyRateUpdated(uint256 oldRate, uint256 newRate);
    event SpecRegistered(bytes32 indexed specHash, string serviceId);

    // ─── MODIFIERS ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Treasury: not owner");
        _;
    }

    modifier onlyVerifiedTEE() {
        require(verifiedTEEs[msg.sender], "Treasury: not a verified TEE");
        _;
    }

    // ─── CONSTRUCTOR ──────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        // For hackathon: deployer is mock TEE
        verifiedTEEs[msg.sender] = true;
    }

    // ─── SPEC REGISTRATION ───────────────────────────────────────────────────

    function registerSpec(bytes32 specHash, string calldata serviceId) external onlyOwner {
        registeredSpecHashes[specHash]    = true;
        specHashToServiceId[specHash]     = serviceId;
        emit SpecRegistered(specHash, serviceId);
    }

    // ─── ESCROW ───────────────────────────────────────────────────────────────

    function escrowPayment(
        bytes32       taskId,
        address       agentB,
        bytes32       taskSpecHash,
        string calldata serviceId
    ) external payable {
        require(msg.value > 0, "Treasury: payment required");
        require(escrows[taskId].status == TaskStatus.NonExistent, "Treasury: task already exists");
        require(agentB != address(0), "Treasury: invalid agent B address");
        require(agentB != msg.sender, "Treasury: agent A and B cannot be the same");
        require(bytes(serviceId).length > 0, "Treasury: service ID required");

        uint256 levy    = (msg.value * levyBasisPoints) / 10000;
        uint256 taskFee = msg.value - levy;

        escrows[taskId] = EscrowRecord({
            agentA:          msg.sender,
            agentB:          agentB,
            totalAmount:     msg.value,
            levyAmount:      levy,
            taskFee:         taskFee,
            taskSpecHash:    taskSpecHash,
            serviceId:       serviceId,
            status:          TaskStatus.Escrowed,
            escrowedAt:      block.timestamp,
            settledAt:       0,
            attestationHash: bytes32(0)
        });

        emit TaskEscrowed(taskId, msg.sender, agentB, msg.value, levy, taskSpecHash, serviceId);
    }

    // ─── CORE: TEE ATTESTATION + SETTLEMENT ───────────────────────────────────

    function submitAttestation(
        bytes32 taskId,
        bytes32 attestationHash,
        bytes32 outputHash,
        bool    passed,
        string calldata score
    ) external onlyVerifiedTEE {
        EscrowRecord storage escrow = escrows[taskId];
        require(escrow.status == TaskStatus.Escrowed, "Treasury: not in escrow");

        attestations[taskId] = AttestationRecord({
            taskId:     taskId,
            specHash:   escrow.taskSpecHash,
            outputHash: outputHash,
            verifiedBy: msg.sender,
            timestamp:  block.timestamp,
            passed:     passed,
            score:      score
        });

        escrow.attestationHash = attestationHash;
        escrow.status = TaskStatus.Verified;

        emit AttestationSubmitted(taskId, msg.sender, passed, score);

        // If passed, auto-settle
        if (passed) {
            _settle(taskId);
        }
    }

    function _settle(bytes32 taskId) internal {
        EscrowRecord storage escrow = escrows[taskId];
        require(escrow.status == TaskStatus.Verified, "Treasury: not verified");

        escrow.status    = TaskStatus.Settled;
        escrow.settledAt = block.timestamp;

        // Pay Agent B
        (bool sent, ) = escrow.agentB.call{value: escrow.taskFee}("");
        require(sent, "Treasury: payment to Agent B failed");

        // Levy stays in contract (PMW treasury)
        totalLevyCollected += escrow.levyAmount;
        totalTasksSettled  += 1;
        totalTaskVolume    += escrow.totalAmount;

        // Record for Taxai dashboard
        levyHistory.push(LevyRecord({
            taskId:          taskId,
            agentA:          escrow.agentA,
            agentB:          escrow.agentB,
            taskFee:         escrow.taskFee,
            levyAmount:      escrow.levyAmount,
            timestamp:       block.timestamp,
            attestationHash: escrow.attestationHash
        }));

        emit LevySettled(
            taskId,
            escrow.agentA,
            escrow.agentB,
            escrow.taskFee,
            escrow.levyAmount,
            escrow.serviceId,
            escrow.attestationHash,
            block.timestamp
        );
    }

    // ─── DISPUTE ──────────────────────────────────────────────────────────────

    function disputeTask(bytes32 taskId) external {
        EscrowRecord storage escrow = escrows[taskId];
        require(
            msg.sender == escrow.agentA || msg.sender == escrow.agentB,
            "Treasury: not a party to this task"
        );
        require(escrow.status == TaskStatus.Escrowed || escrow.status == TaskStatus.Verified,
            "Treasury: cannot dispute in current state");
        escrow.status = TaskStatus.Disputed;
        emit TaskDisputed(taskId, msg.sender);
    }

    // ─── GOVERNANCE ───────────────────────────────────────────────────────────

    function setLevyRate(uint256 newBasisPoints) external onlyOwner {
        require(newBasisPoints <= MAX_LEVY_BPS, "Treasury: max 5%");
        emit LevyRateUpdated(levyBasisPoints, newBasisPoints);
        levyBasisPoints = newBasisPoints;
    }

    function registerTEE(address teeAddress) external onlyOwner {
        verifiedTEEs[teeAddress] = true;
    }

    function revokeTEE(address teeAddress) external onlyOwner {
        verifiedTEEs[teeAddress] = false;
    }

    // ─── VIEWS (for Taxai dashboard) ─────────────────────────────────────────

    function getLevyHistoryCount() external view returns (uint256) {
        return levyHistory.length;
    }

    function getLevyRecord(uint256 index) external view returns (LevyRecord memory) {
        return levyHistory[index];
    }

    function getEscrow(bytes32 taskId) external view returns (EscrowRecord memory) {
        return escrows[taskId];
    }

    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Allow receiving ETH
    receive() external payable {}
}
