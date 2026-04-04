import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { authorize, createEmbed } from "../security.js";
import { checkAgentReputation } from "../../services/erc8004.js";
import { initializeAgentWallet } from "../../services/claw.js";
import { logToChannel } from "../setupServer.js";

export const data = new SlashCommandBuilder()
  .setName("reputation")
  .setDescription("Queries the ERC-8004 Reputation Registry for the agent.");

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await authorize(interaction, "agent-reputation"))) return;

  await interaction.deferReply();

  try {
    const wallet = await initializeAgentWallet();
    const rep = await checkAgentReputation(wallet.address);

    // Visual reputation bar
    const filled = Math.round(rep.reputationScore / 10);
    const bar = "🟩".repeat(filled) + "⬛".repeat(10 - filled);

    const embed = createEmbed("ERC-8004 Agent Reputation")
      .addFields(
        { name: "🆔 Identity", value: `\`${rep.identityId}\``, inline: false },
        { name: "⭐ Reputation Score", value: `**${rep.reputationScore}/100**\n${bar}`, inline: false },
        { name: "✅ Total Validations", value: String(rep.totalValidations), inline: true },
        { name: "📍 Agent Address", value: `\`${wallet.address}\``, inline: true }
      );

    await interaction.editReply({ embeds: [embed] });

    if (interaction.guild) {
      await logToChannel(interaction.guild, `🏆 Reputation check: Score ${rep.reputationScore}/100, ${rep.totalValidations} validations.`);
    }
  } catch (err) {
    await interaction.editReply(`❌ Reputation query failed: ${err}`);
  }
}
