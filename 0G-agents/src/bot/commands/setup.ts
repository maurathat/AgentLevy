import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { authorize, createEmbed } from "../security.js";
import { setupZeroClawServer, logToChannel } from "../setupServer.js";

export const data = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Creates the ZeroClaw channel structure in this server.");

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!(await authorize(interaction))) return;

  await interaction.deferReply();

  const guild = interaction.guild;
  if (!guild) {
    await interaction.editReply("❌ This command must be used in a server.");
    return;
  }

  const ownerId = process.env.DISCORD_OWNER_ID ?? interaction.user.id;

  try {
    const result = await setupZeroClawServer(guild, ownerId);

    const embed = createEmbed("Server Setup Complete")
      .addFields(
        {
          name: "✅ Created",
          value: result.created.length > 0 ? result.created.join("\n") : "None (all existed)",
          inline: true,
        },
        {
          name: "📌 Already Existed",
          value: result.existing.length > 0 ? result.existing.join("\n") : "None",
          inline: true,
        }
      );

    await interaction.editReply({ embeds: [embed] });
    await logToChannel(guild, "🚀 ZeroClaw server setup completed.");
  } catch (err) {
    await interaction.editReply(`❌ Setup failed: ${err}`);
  }
}
