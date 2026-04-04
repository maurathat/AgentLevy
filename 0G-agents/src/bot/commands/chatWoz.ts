import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { ChannelType } from "discord.js";

import { demoService } from "../demoService.js";
import { authorize } from "../security.js";
import { logToChannel, sendAgentMessage } from "../setupServer.js";

export const data = new SlashCommandBuilder()
  .setName("chat-woz")
  .setDescription("Sends a prompt to Woz_ZC on the 0G compute layer.")
  .addStringOption((option) =>
    option.setName("prompt").setDescription("The message for Woz_ZC").setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await authorize(interaction, "command-center"))) return;

  await interaction.deferReply({ ephemeral: true });

  const prompt = interaction.options.getString("prompt", true);

  try {
    const snapshot = await demoService.triggerInferenceForAgent("Woz_ZC", prompt);
    const inference = snapshot.inferenceByAgent.find((entry) => entry.agentName === "Woz_ZC");

    if (!inference) {
      throw new Error("Woz_ZC inference snapshot is unavailable.");
    }

    const channel = interaction.channel;
    const responseText = inference.lastResponse || inference.lastError || "No response returned.";
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error("Woz_ZC Discord chat requires a server text channel.");
    }

    await sendAgentMessage(
      channel,
      "Woz_ZC",
      [
        `Prompt from <@${interaction.user.id}>:`,
        `> ${prompt}`,
        "",
        responseText,
      ].join("\n"),
    );

    await interaction.editReply("Woz_ZC posted a response in this channel.");

    if (interaction.guild) {
      await logToChannel(interaction.guild, `💬 Woz_ZC replied to Discord prompt: "${prompt.slice(0, 60)}"`);
    }
  } catch (error) {
    await interaction.editReply(`❌ Woz_ZC chat failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
