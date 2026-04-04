import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { ChannelType } from "discord.js";

import { demoService } from "../demoService.js";
import { authorize } from "../security.js";
import { logToChannel, sendAgentMessage } from "../setupServer.js";

export const data = new SlashCommandBuilder()
  .setName("chat-steve")
  .setDescription("Sends a prompt to Steve_ZC on the 0G compute layer.")
  .addStringOption((option) =>
    option.setName("prompt").setDescription("The message for Steve_ZC").setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await authorize(interaction, "command-center"))) return;

  await interaction.deferReply({ ephemeral: true });

  const prompt = interaction.options.getString("prompt", true);

  try {
    const snapshot = await demoService.triggerInferenceForAgent("Steve_ZC", prompt);
    const inference = snapshot.inferenceByAgent.find((entry) => entry.agentName === "Steve_ZC");

    if (!inference) {
      throw new Error("Steve_ZC inference snapshot is unavailable.");
    }

    const channel = interaction.channel;
    const responseText = inference.lastResponse || inference.lastError || "No response returned.";
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error("Steve_ZC Discord chat requires a server text channel.");
    }

    await sendAgentMessage(
      channel,
      "Steve_ZC",
      [
        `Prompt from <@${interaction.user.id}>:`,
        `> ${prompt}`,
        "",
        responseText,
      ].join("\n"),
    );

    await interaction.editReply("Steve_ZC posted a response in this channel.");

    if (interaction.guild) {
      await logToChannel(interaction.guild, `💬 Steve_ZC replied to Discord prompt: "${prompt.slice(0, 60)}"`);
    }
  } catch (error) {
    await interaction.editReply(`❌ Steve_ZC chat failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
