import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { authorize, createEmbed } from "../security.js";
import { initializeAgentWallet } from "../../services/claw.js";
import { logToChannel } from "../setupServer.js";

export const data = new SlashCommandBuilder()
  .setName("wallet-sign")
  .setDescription("Signs arbitrary data with the agent's ClawWallet.")
  .addStringOption((option) =>
    option.setName("data").setDescription("The data payload to sign").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await authorize(interaction, "wallet-ops"))) return;

  await interaction.deferReply();

  const payload = interaction.options.getString("data", true);

  try {
    const wallet = await initializeAgentWallet();
    const signature = await wallet.signTransaction({ data: payload });

    const embed = createEmbed("Transaction Signed")
      .addFields(
        { name: "📝 Payload", value: `\`\`\`${payload.slice(0, 200)}\`\`\``, inline: false },
        { name: "✍️ Signature", value: `\`${signature}\``, inline: false },
        { name: "📍 Signer", value: `\`${wallet.address}\``, inline: false }
      );

    await interaction.editReply({ embeds: [embed] });

    if (interaction.guild) {
      await logToChannel(interaction.guild, `✍️ Data signed via ClawWallet. Payload: "${payload.slice(0, 30)}..."`);
    }
  } catch (err) {
    await interaction.editReply(`❌ Signing failed: ${err}`);
  }
}
