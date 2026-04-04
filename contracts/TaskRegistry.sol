// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * AgentLevy TaskRegistry + Verifier
 *
 * Implements the exact ABI expected by agents/shared/contracts.ts.
 * Deploy once — use the same address for both TASK_REGISTRY_ADDRESS and VERIFIER_ADDRESS.
 *
 * Flow:
 *   1. Agent A calls postTask() → locks USDT0, emits TaskPosted
 *   2. Agent B calls claimTask() → records executor + deadline, emits TaskClaimed
 *   3. Agent B calls submitProof() → verifies hash, auto-settles, emits TaskSettled
 */
contract TaskRegistry {

    // ─── Task state enum (uint8, matches getTaskState return) ────────────────
    // 0 = POSTED, 1 = CLAIMED, 2 = VERIFIED_PASS, 3 = VERIFIED_FAIL, 4 = SETTLED, 5 = REFUNDED

    uint8 public constant STATE_POSTED        = 0;
    uint8 public constant STATE_CLAIMED       = 1;
    uint8 public constant STATE_VERIFIED_PASS = 2;
    uint8 public constant STATE_VERIFIED_FAIL = 3;
    uint8 public constant STATE_SETTLED       = 4;
    uint8 public constant STATE_REFUNDED      = 5;

    // ─── Storage ──────────────────────────────────────────────────────────────

    struct Task {
        address poster;
        address executor;
        address token;
        uint256 amount;
        bytes32 specHash;
        uint256 deadline;
        uint8   state;
        bytes32 resultHash;
        bool    verified;
        bool    passed;
    }

    mapping(bytes32 => Task) public tasks;

    // ─── Events (must match ABI in agents/shared/contracts.ts exactly) ────────

    event TaskPosted(
        bytes32 indexed taskId,
        address indexed poster,
        bytes32         specHash,
        uint256         amount,
        uint256         deadline
    );

    event TaskClaimed(
        bytes32 indexed taskId,
        address indexed executor,
        uint256         deadline
    );

    event TaskSettled(
        bytes32 indexed taskId,
        address indexed recipient,
        uint256         amount,
        bool            passed
    );

    // ─── postTask ─────────────────────────────────────────────────────────────
    // Agent A locks USDT0 into this contract.
    // taskId = keccak256(poster, specHash, block.number) — unique per post.

    function postTask(
        bytes32 specHash,
        uint256 amount,
        address token,
        uint256 timeoutSeconds
    ) external returns (bytes32 taskId) {
        require(amount > 0,        "TaskRegistry: amount must be > 0");
        require(token  != address(0), "TaskRegistry: invalid token");

        taskId = keccak256(abi.encodePacked(msg.sender, specHash, block.number));
        require(tasks[taskId].poster == address(0), "TaskRegistry: taskId collision");

        // Pull USDT0 from Agent A (requires prior approve)
        bool ok = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(ok, "TaskRegistry: USDT0 transfer failed");

        uint256 deadline = block.timestamp + timeoutSeconds;

        tasks[taskId] = Task({
            poster:     msg.sender,
            executor:   address(0),
            token:      token,
            amount:     amount,
            specHash:   specHash,
            deadline:   deadline,
            state:      STATE_POSTED,
            resultHash: bytes32(0),
            verified:   false,
            passed:     false
        });

        emit TaskPosted(taskId, msg.sender, specHash, amount, deadline);
    }

    // ─── claimTask ────────────────────────────────────────────────────────────
    // Agent B locks in as executor. Can only claim POSTED tasks before deadline.

    function claimTask(bytes32 taskId) external {
        Task storage t = tasks[taskId];
        require(t.poster    != address(0),     "TaskRegistry: task does not exist");
        require(t.state     == STATE_POSTED,   "TaskRegistry: task not in POSTED state");
        require(block.timestamp < t.deadline,  "TaskRegistry: deadline passed");
        require(msg.sender  != t.poster,       "TaskRegistry: poster cannot claim own task");

        t.executor = msg.sender;
        t.state    = STATE_CLAIMED;

        emit TaskClaimed(taskId, msg.sender, t.deadline);
    }

    // ─── submitProof ──────────────────────────────────────────────────────────
    // Agent B submits the keccak256 hash of its result.
    // For Phase 1: any non-zero hash from the executor passes.
    // For Phase 3: replace the hash-check with TEE attestation verification.

    function submitProof(
        bytes32 taskId,
        bytes32 resultHash,
        bytes   calldata /* attestation */ // reserved for Phase 3 TEE
    ) external returns (bool passed) {
        Task storage t = tasks[taskId];
        require(t.poster   != address(0),    "TaskRegistry: task does not exist");
        require(t.state    == STATE_CLAIMED, "TaskRegistry: task not in CLAIMED state");
        require(msg.sender == t.executor,    "TaskRegistry: only executor can submit proof");
        require(resultHash != bytes32(0),    "TaskRegistry: empty result hash");

        t.resultHash = resultHash;
        t.verified   = true;

        // Phase 1: non-zero hash = pass. Phase 3: verify TEE attestation here.
        passed   = true;
        t.passed = passed;
        t.state  = STATE_SETTLED;

        // Pay executor
        bool ok = IERC20(t.token).transfer(t.executor, t.amount);
        require(ok, "TaskRegistry: payment to executor failed");

        emit TaskSettled(taskId, t.executor, t.amount, true);
    }

    // ─── refundExpired ────────────────────────────────────────────────────────
    // Anyone can trigger a refund once the deadline passes with no proof.

    function refundExpired(bytes32 taskId) external {
        Task storage t = tasks[taskId];
        require(t.poster != address(0),   "TaskRegistry: task does not exist");
        require(
            t.state == STATE_POSTED || t.state == STATE_CLAIMED,
            "TaskRegistry: task already resolved"
        );
        require(block.timestamp >= t.deadline, "TaskRegistry: deadline not yet passed");

        t.state = STATE_REFUNDED;

        bool ok = IERC20(t.token).transfer(t.poster, t.amount);
        require(ok, "TaskRegistry: refund transfer failed");

        emit TaskSettled(taskId, t.poster, t.amount, false);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getTaskState(bytes32 taskId) external view returns (uint8) {
        return tasks[taskId].state;
    }

    function getVerificationResult(bytes32 taskId) external view returns (bool verified, bool passed) {
        Task storage t = tasks[taskId];
        return (t.verified, t.passed);
    }
}
