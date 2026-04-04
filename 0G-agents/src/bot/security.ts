import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

/**
 * Security middleware for ZeroClaw Discord bot.
 * Ensures only the owner can execute commands, with channel enforcement and rate limiting.
 */

const OWNER_ID = process.env.DISCORD_OWNER_ID ?? "";

// Rate limiting: track last command timestamp per user
const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 2000; // 2 second cooldown between commands

/**
 * Checks if the interaction is from the bot owner.
 * Returns true if authorized, false if rejected (and sends ephemeral reply).
 */
export async function checkOwner(interaction: ChatInputCommandInteraction): Promise<boolean> {
  if (!OWNER_ID) {
    await interaction.reply({
      content: "⚠️ `DISCORD_OWNER_ID` is not configured in `.env`. Bot is locked down.",
      ephemeral: true,
    });
    return false;
  }

  if (interaction.user.id !== OWNER_ID) {
    await interaction.reply({
      content: "🔒 Access denied. You are not authorized to control ZeroClaw.",
      ephemeral: true,
    });
    return false;
  }

  return true;
}

/**
 * Checks if the command is being used in the correct channel.
 * Pass null to allow any channel.
 */
export async function checkChannel(
  interaction: ChatInputCommandInteraction,
  requiredChannelName: string | null
): Promise<boolean> {
  if (!requiredChannelName) return true;

  const channel = interaction.channel;
  if (!channel || !("name" in channel)) return true; // DM or unknown, allow

  const channelName = ("name" in channel ? channel.name : null) ?? "";
  const normalized = channelName.replace(/^[^\w]+/, "").trim();
  const requiredNormalized = requiredChannelName.replace(/^[^\w]+/, "").trim();

  if (normalized !== requiredNormalized) {
    await interaction.reply({
      content: `⚠️ This command can only be used in **#${requiredChannelName}**.`,
      ephemeral: true,
    });
    return false;
  }

  return true;
}

/**
 * Simple rate limiter. Returns true if the user can proceed, false if on cooldown.
 */
export async function checkRateLimit(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const now = Date.now();
  const lastUsed = cooldowns.get(interaction.user.id) ?? 0;

  if (now - lastUsed < COOLDOWN_MS) {
    await interaction.reply({
      content: "⏳ Slow down. Please wait a moment between commands.",
      ephemeral: true,
    });
    return false;
  }

  cooldowns.set(interaction.user.id, now);
  return true;
}

/**
 * Full security pipeline: owner check → rate limit → channel check.
 */
export async function authorize(
  interaction: ChatInputCommandInteraction,
  requiredChannel: string | null = null
): Promise<boolean> {
  if (!(await checkOwner(interaction))) return false;
  if (!(await checkRateLimit(interaction))) return false;
  if (!(await checkChannel(interaction, requiredChannel))) return false;
  return true;
}

/**
 * Creates a styled embed with the ZeroClaw brand.
 */
export function createEmbed(title: string, description?: string): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(0x00f0ff) // neon blue
    .setTitle(`⚡ ${title}`)
    .setTimestamp()
    .setFooter({ text: "ZeroClaw OS • ETHGlobal Cannes" });

  if (description) {
    embed.setDescription(description);
  }

  return embed;
}
