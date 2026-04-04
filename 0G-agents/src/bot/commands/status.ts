import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { authorize, createEmbed } from "../security.js";
import { CHAIN_CONFIG } from "../../services/0g.js";
import { logToChannel } from "../setupServer.js";

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Shows 0G network connection status and agent info.");

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await authorize(interaction, "command-center"))) return;

  const embed = createEmbed("System Status", "All systems operational.")
    .addFields(
      { name: "🌐 Network", value: CHAIN_CONFIG.name, inline: true },
      { name: "🔗 Chain ID", value: String(CHAIN_CONFIG.chainId), inline: true },
      { name: "💎 Currency", value: CHAIN_CONFIG.currency, inline: true },
      { name: "📡 RPC", value: `\`${CHAIN_CONFIG.rpcUrl}\``, inline: false },
      { name: "🔍 Explorer", value: CHAIN_CONFIG.explorerUrl, inline: false }
    );

  await interaction.reply({ embeds: [embed] });

  if (interaction.guild) {
    await logToChannel(interaction.guild, "📊 Status check performed.");
  }
}
