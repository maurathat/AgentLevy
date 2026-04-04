import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { authorize, createEmbed } from "../security.js";
import { initializeAgentWallet } from "../../services/claw.js";
import { logToChannel } from "../setupServer.js";

export const data = new SlashCommandBuilder()
  .setName("wallet-info")
  .setDescription("Displays the ClawWallet agent address and simulated balance.");

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await authorize(interaction, "wallet-ops"))) return;

  await interaction.deferReply();

  try {
    const wallet = await initializeAgentWallet();

    const embed = createEmbed("ClawWallet Info")
      .addFields(
        { name: "📍 Address", value: `\`${wallet.address}\``, inline: false },
        { name: "💰 Balance (sim)", value: "1,250.00 0G", inline: true },
        { name: "🔐 Security", value: "TEE-Sharded", inline: true },
        { name: "🌐 Network", value: "0G Mainnet", inline: true }
      );

    await interaction.editReply({ embeds: [embed] });

    if (interaction.guild) {
      await logToChannel(interaction.guild, `👛 Wallet info queried. Address: ${wallet.address.slice(0, 10)}...`);
    }
  } catch (err: unknown) {
    const detail =
      typeof err === "object" &&
      err !== null &&
      "rawError" in err &&
      typeof err.rawError === "object" &&
      err.rawError !== null &&
      "errors" in err.rawError
        ? JSON.stringify(err.rawError.errors, null, 2)
        : String(err);
    console.error("wallet-info error:", err);
    await interaction.editReply(`❌ Failed to initialize wallet: ${detail}`);
  }
}
