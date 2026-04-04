import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("Treasury", function () {
  async function deployTreasuryFixture() {
    const [owner, agentA, agentB, outsider, tee] = await ethers.getSigners();
    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy();
    await treasury.waitForDeployment();

    return { treasury, owner, agentA, agentB, outsider, tee };
  }

  function sampleTaskId(label: string) {
    return ethers.keccak256(ethers.toUtf8Bytes(label));
  }

  function sampleSpecHash(label: string) {
    return ethers.keccak256(ethers.toUtf8Bytes(`spec:${label}`));
  }

  async function registerSpec(
    treasury: Awaited<ReturnType<typeof deployTreasuryFixture>>["treasury"],
    owner: Awaited<ReturnType<typeof deployTreasuryFixture>>["owner"],
    serviceId: string,
  ) {
    const specHash = sampleSpecHash(serviceId);
    await treasury.connect(owner).registerSpec(specHash, serviceId);
    return specHash;
  }

  it("escrows a payment and records levy splits", async function () {
    const { treasury, owner, agentA, agentB } = await loadFixture(deployTreasuryFixture);
    const taskId = sampleTaskId("task-escrow");
    const specHash = await registerSpec(treasury, owner, "sentiment-analysis");
    const value = ethers.parseEther("1");

    await expect(
      treasury
        .connect(agentA)
        .escrowPayment(taskId, agentB.address, specHash, "sentiment-analysis", {
          value,
        })
    )
      .to.emit(treasury, "TaskEscrowed")
      .withArgs(
        taskId,
        agentA.address,
        agentB.address,
        value,
        ethers.parseEther("0.005"),
        specHash,
        "sentiment-analysis"
      );

    const escrow = await treasury.getEscrow(taskId);
    expect(escrow.agentA).to.equal(agentA.address);
    expect(escrow.agentB).to.equal(agentB.address);
    expect(escrow.totalAmount).to.equal(value);
    expect(escrow.levyAmount).to.equal(ethers.parseEther("0.005"));
    expect(escrow.taskFee).to.equal(ethers.parseEther("0.995"));
    expect(escrow.status).to.equal(1n);
  });

  it("rejects unregistered or mismatched spec hashes", async function () {
    const { treasury, owner, agentA, agentB } = await loadFixture(deployTreasuryFixture);
    const taskId = sampleTaskId("task-bad-spec");
    const registeredSpecHash = await registerSpec(treasury, owner, "translation");

    await expect(
      treasury
        .connect(agentA)
        .escrowPayment(taskId, agentB.address, ethers.ZeroHash, "translation", {
          value: ethers.parseEther("1"),
        })
    ).to.be.revertedWith("Treasury: task spec hash required");

    await expect(
      treasury
        .connect(agentA)
        .escrowPayment(taskId, agentB.address, sampleSpecHash("unregistered"), "translation", {
          value: ethers.parseEther("1"),
        })
    ).to.be.revertedWith("Treasury: unregistered spec hash");

    await expect(
      treasury
        .connect(agentA)
        .escrowPayment(taskId, agentB.address, registeredSpecHash, "code-review", {
          value: ethers.parseEther("1"),
        })
    ).to.be.revertedWith("Treasury: service ID does not match spec hash");
  });

  it("only allows a verified TEE to submit an attestation", async function () {
    const { treasury, owner, agentA, agentB, outsider } = await loadFixture(deployTreasuryFixture);
    const taskId = sampleTaskId("task-tee");
    const specHash = await registerSpec(treasury, owner, "code-review");

    await treasury
      .connect(agentA)
      .escrowPayment(taskId, agentB.address, specHash, "code-review", {
        value: ethers.parseEther("1"),
      });

    await expect(
      treasury
        .connect(outsider)
        .submitAttestation(taskId, ethers.ZeroHash, ethers.ZeroHash, true, "98")
    ).to.be.revertedWith("Treasury: not a verified TEE");
  });

  it("settles a passed attestation and transfers the task fee to Agent B", async function () {
    const { treasury, owner, agentA, agentB } = await loadFixture(deployTreasuryFixture);
    const taskId = sampleTaskId("task-pass");
    const specHash = await registerSpec(treasury, owner, "translation");
    const totalAmount = ethers.parseEther("2");
    const levyAmount = ethers.parseEther("0.01");
    const taskFee = ethers.parseEther("1.99");

    await treasury
      .connect(agentA)
      .escrowPayment(taskId, agentB.address, specHash, "translation", {
        value: totalAmount,
      });

    await expect(
      treasury
        .connect(owner)
        .submitAttestation(taskId, sampleTaskId("attestation"), sampleTaskId("output"), true, "100")
    )
      .to.emit(treasury, "WithdrawalQueued")
      .withArgs(agentB.address, taskFee);

    const escrow = await treasury.getEscrow(taskId);
    expect(escrow.status).to.equal(3n);
    expect(escrow.settledAt).to.be.greaterThan(0n);

    expect(await treasury.totalLevyCollected()).to.equal(levyAmount);
    expect(await treasury.totalTasksSettled()).to.equal(1n);
    expect(await treasury.totalTaskVolume()).to.equal(totalAmount);
    expect(await treasury.pendingWithdrawals(agentB.address)).to.equal(taskFee);
    expect(await treasury.totalPendingWithdrawals()).to.equal(taskFee);
    expect(await treasury.getTreasuryBalance()).to.equal(levyAmount);

    const levyRecord = await treasury.getLevyRecord(0);
    expect(levyRecord.taskId).to.equal(taskId);
    expect(levyRecord.agentA).to.equal(agentA.address);
    expect(levyRecord.agentB).to.equal(agentB.address);
    expect(levyRecord.taskFee).to.equal(taskFee);
    expect(levyRecord.levyAmount).to.equal(levyAmount);

    await expect(() => treasury.connect(agentB).withdraw())
      .to.changeEtherBalances([treasury, agentB], [-taskFee, taskFee]);
    expect(await treasury.pendingWithdrawals(agentB.address)).to.equal(0n);
    expect(await treasury.totalPendingWithdrawals()).to.equal(0n);
    expect(await treasury.getTreasuryBalance()).to.equal(levyAmount);
  });

  it("allows Agent A to refund a failed attestation", async function () {
    const { treasury, owner, agentA, agentB } = await loadFixture(deployTreasuryFixture);
    const taskId = sampleTaskId("task-fail");
    const specHash = await registerSpec(treasury, owner, "data-validation");
    const totalAmount = ethers.parseEther("1");

    await treasury
      .connect(agentA)
      .escrowPayment(taskId, agentB.address, specHash, "data-validation", {
        value: totalAmount,
      });

    await treasury
      .connect(owner)
      .submitAttestation(taskId, sampleTaskId("attestation-fail"), sampleTaskId("output-fail"), false, "41");

    const escrow = await treasury.getEscrow(taskId);
    const attestation = await treasury.attestations(taskId);

    expect(escrow.status).to.equal(2n);
    expect(await treasury.totalTasksSettled()).to.equal(0n);
    expect(await treasury.getTreasuryBalance()).to.equal(totalAmount);
    expect(attestation.passed).to.equal(false);

    await expect(treasury.connect(agentA).claimRefund(taskId))
      .to.emit(treasury, "TaskRefunded")
      .withArgs(taskId, totalAmount);

    expect(await treasury.pendingWithdrawals(agentA.address)).to.equal(totalAmount);
    expect(await treasury.totalPendingWithdrawals()).to.equal(totalAmount);
    expect(await treasury.getTreasuryBalance()).to.equal(0n);

    await expect(() => treasury.connect(agentA).withdraw())
      .to.changeEtherBalances([treasury, agentA], [-totalAmount, totalAmount]);

    const refundedEscrow = await treasury.getEscrow(taskId);
    expect(refundedEscrow.status).to.equal(5n);
  });

  it("allows either task party to dispute while escrowed", async function () {
    const { treasury, owner, agentA, agentB } = await loadFixture(deployTreasuryFixture);
    const taskId = sampleTaskId("task-dispute");
    const specHash = await registerSpec(treasury, owner, "data-extraction");

    await treasury
      .connect(agentA)
      .escrowPayment(taskId, agentB.address, specHash, "data-extraction", {
        value: ethers.parseEther("1"),
      });

    await expect(treasury.connect(agentB).disputeTask(taskId))
      .to.emit(treasury, "TaskDisputed")
      .withArgs(taskId, agentB.address);

    const escrow = await treasury.getEscrow(taskId);
    expect(escrow.status).to.equal(4n);
  });

  it("lets Agent A claim a refund after the dispute window", async function () {
    const { treasury, owner, agentA, agentB } = await loadFixture(deployTreasuryFixture);
    const taskId = sampleTaskId("task-dispute-refund");
    const specHash = await registerSpec(treasury, owner, "sentiment-analysis");
    const totalAmount = ethers.parseEther("1");

    await treasury
      .connect(agentA)
      .escrowPayment(taskId, agentB.address, specHash, "sentiment-analysis", {
        value: totalAmount,
      });

    await treasury.connect(agentB).disputeTask(taskId);
    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    await treasury.connect(agentA).claimRefund(taskId);
    expect(await treasury.pendingWithdrawals(agentA.address)).to.equal(totalAmount);
  });

  it("lets Agent A claim a timeout refund when no attestation arrives", async function () {
    const { treasury, owner, agentA, agentB } = await loadFixture(deployTreasuryFixture);
    const taskId = sampleTaskId("task-timeout-refund");
    const specHash = await registerSpec(treasury, owner, "code-review");
    const totalAmount = ethers.parseEther("1");

    await treasury
      .connect(agentA)
      .escrowPayment(taskId, agentB.address, specHash, "code-review", {
        value: totalAmount,
      });

    await expect(treasury.connect(agentA).claimTimeoutRefund(taskId))
      .to.be.revertedWith("Treasury: timeout window still active");

    await ethers.provider.send("evm_increaseTime", [24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    await expect(treasury.connect(agentA).claimTimeoutRefund(taskId))
      .to.emit(treasury, "TaskRefunded")
      .withArgs(taskId, totalAmount);

    expect(await treasury.pendingWithdrawals(agentA.address)).to.equal(totalAmount);
  });

  it("lets the owner resolve a disputed task with a refund", async function () {
    const { treasury, owner, agentA, agentB } = await loadFixture(deployTreasuryFixture);
    const taskId = sampleTaskId("task-owner-resolve");
    const specHash = await registerSpec(treasury, owner, "translation");
    const totalAmount = ethers.parseEther("1");

    await treasury
      .connect(agentA)
      .escrowPayment(taskId, agentB.address, specHash, "translation", {
        value: totalAmount,
      });

    await treasury.connect(agentB).disputeTask(taskId);
    await treasury.connect(owner).resolveDispute(taskId);

    const escrow = await treasury.getEscrow(taskId);
    expect(escrow.status).to.equal(5n);
    expect(await treasury.pendingWithdrawals(agentA.address)).to.equal(totalAmount);
  });

  it("lets the owner manage levy rate and TEE membership", async function () {
    const { treasury, owner, outsider, tee } = await loadFixture(deployTreasuryFixture);

    await expect(treasury.connect(owner).setLevyRate(125))
      .to.emit(treasury, "LevyRateUpdated")
      .withArgs(50, 125);
    expect(await treasury.levyBasisPoints()).to.equal(125n);

    await expect(treasury.connect(owner).registerTEE(tee.address))
      .to.emit(treasury, "TEERegistered")
      .withArgs(tee.address);
    expect(await treasury.verifiedTEEs(tee.address)).to.equal(true);

    await expect(treasury.connect(owner).revokeTEE(tee.address))
      .to.emit(treasury, "TEERevoked")
      .withArgs(tee.address);
    expect(await treasury.verifiedTEEs(tee.address)).to.equal(false);

    await expect(treasury.connect(outsider).setLevyRate(10)).to.be.revertedWith("Treasury: not owner");
  });

  it("supports two-step ownership transfer", async function () {
    const { treasury, owner, outsider, tee } = await loadFixture(deployTreasuryFixture);

    await expect(treasury.connect(owner).transferOwnership(tee.address))
      .to.emit(treasury, "OwnershipTransferStarted")
      .withArgs(owner.address, tee.address);
    expect(await treasury.pendingOwner()).to.equal(tee.address);

    await expect(treasury.connect(outsider).acceptOwnership())
      .to.be.revertedWith("Treasury: not pending owner");

    await expect(treasury.connect(tee).acceptOwnership())
      .to.emit(treasury, "OwnershipTransferred")
      .withArgs(owner.address, tee.address);

    expect(await treasury.owner()).to.equal(tee.address);
    expect(await treasury.pendingOwner()).to.equal(ethers.ZeroAddress);
  });
});
