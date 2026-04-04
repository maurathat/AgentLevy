import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { authorize, createEmbed } from "../security.js";
import { initializeAgentWallet } from "../../services/claw.js";
import { X402PaymentService } from "../../services/x402.js";
import { logToChannel } from "../setupServer.js";

export const data = new SlashCommandBuilder()
  .setName("pay")
  .setDescription("Triggers an autonomous x402 payment to a resource endpoint.")
  .addStringOption((option) =>
    option.setName("endpoint").setDescription("The API endpoint to pay for").setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await authorize(interaction, "x402-payments"))) return;

  await interaction.deferReply();

  const endpoint = interaction.options.getString("endpoint", true);

  try {
    const wallet = await initializeAgentWallet();
    const paymentService = new X402PaymentService(wallet);

    // Send a "processing" message first
    await interaction.editReply("📡 Connecting to endpoint... Server returned `402 Payment Required`. Initiating x402 payment...");

    const result = await paymentService.fetchWithAutonomousPayment(endpoint);

    const embed = createEmbed("x402 Payment Complete", "Autonomous payment settled on 0G network.")
      .addFields(
        { name: "🌐 Endpoint", value: `\`${endpoint}\``, inline: false },
        { name: "📊 Status", value: `\`${result.status}\``, inline: true },
        { name: "📦 Response", value: result.data, inline: true },
        { name: "💎 Cost", value: "0.01 0G", inline: true }
      );

    await interaction.editReply({ content: "", embeds: [embed] });

    if (interaction.guild) {
      await logToChannel(interaction.guild, `💸 x402 payment executed to \`${endpoint}\`. Status: ${result.status}`);
    }
  } catch (err) {
    await interaction.editReply(`❌ Payment failed: ${err}`);
  }
}
