import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { authorize, createEmbed } from "../security.js";
import { initializeAgentWallet } from "../../services/claw.js";
import { submitWorkProof } from "../../services/erc8004.js";
import { logToChannel } from "../setupServer.js";

export const data = new SlashCommandBuilder()
  .setName("submit-proof")
  .setDescription("Submits a work proof to the ERC-8004 Validation Registry.")
  .addStringOption((option) =>
    option.setName("hash").setDescription("The task hash to submit as proof").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await authorize(interaction, "agent-reputation"))) return;

  await interaction.deferReply();

  const taskHash = interaction.options.getString("hash", true);

  try {
    const wallet = await initializeAgentWallet();
    const success = await submitWorkProof(wallet.address, taskHash);

    const embed = createEmbed(
      success ? "Proof Submitted ✅" : "Proof Rejected ❌",
      success
        ? "Work proof has been recorded in the Validation Registry."
        : "The Validation Registry rejected the proof."
    ).addFields(
      { name: "📝 Task Hash", value: `\`${taskHash}\``, inline: false },
      { name: "📍 Agent", value: `\`${wallet.address}\``, inline: true },
      { name: "📊 Status", value: success ? "Validated" : "Rejected", inline: true }
    );

    await interaction.editReply({ embeds: [embed] });

    if (interaction.guild) {
      await logToChannel(interaction.guild, `📝 Work proof submitted. Hash: \`${taskHash.slice(0, 16)}...\` Status: ${success ? "✅" : "❌"}`);
    }
  } catch (err) {
    await interaction.editReply(`❌ Proof submission failed: ${err}`);
  }
}
