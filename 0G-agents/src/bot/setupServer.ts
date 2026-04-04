import {
  Guild,
  ChannelType,
  PermissionsBitField,
  TextChannel,
  CategoryChannel,
} from "discord.js";

const CATEGORY_NAME = "⚡ ZEROCLAW";

export const CHANNELS = {
  commandCenter: "🔒-command-center",
  walletOps: "💰-wallet-ops",
  x402Payments: "📡-x402-payments",
  agentReputation: "🏆-agent-reputation",
  systemLogs: "📋-system-logs",
} as const;

/**
 * Auto-creates the ZeroClaw channel structure inside the guild.
 * All channels are private (hidden from @everyone), visible only to the bot and the owner.
 */
export async function setupZeroClawServer(
  guild: Guild,
  ownerId: string
): Promise<{ created: string[]; existing: string[] }> {
  const created: string[] = [];
  const existing: string[] = [];

  // Find or create the category
  let category = guild.channels.cache.find(
    (ch) => ch.name === CATEGORY_NAME && ch.type === ChannelType.GuildCategory
  ) as CategoryChannel | undefined;

  if (!category) {
    category = await guild.channels.create({
      name: CATEGORY_NAME,
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.id, // @everyone
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: guild.client.user!.id, // bot
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ManageChannels,
          ],
        },
        {
          id: ownerId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
          ],
        },
      ],
    });
    created.push(CATEGORY_NAME);
  } else {
    existing.push(CATEGORY_NAME);
  }

  // Create each channel under the category
  for (const [, channelName] of Object.entries(CHANNELS)) {
    const existingChannel = guild.channels.cache.find(
      (ch) => ch.name === channelName && ch.parentId === category!.id
    );

    if (existingChannel) {
      existing.push(`#${channelName}`);
      continue;
    }

    const isLogChannel = channelName === CHANNELS.systemLogs;

    const ownerOverwrite = isLogChannel
      ? {
          id: ownerId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory,
          ],
          deny: [PermissionsBitField.Flags.SendMessages],
        }
      : {
          id: ownerId,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.SendMessages,
          ],
        };

    await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.id, // @everyone
          deny: [PermissionsBitField.Flags.ViewChannel],
        },
        {
          id: guild.client.user!.id, // bot
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ManageChannels,
          ],
        },
        ownerOverwrite,
      ],
    });

    created.push(`#${channelName}`);
  }

  return { created, existing };
}

/**
 * Finds the system-logs channel and posts a log message.
 */
export async function logToChannel(guild: Guild, message: string): Promise<void> {
  try {
    const logChannel = guild.channels.cache.find(
      (ch) => ch.name === CHANNELS.systemLogs && ch.type === ChannelType.GuildText
    ) as TextChannel | undefined;

    if (logChannel) {
      await logChannel.send(`\`[${new Date().toLocaleTimeString()}]\` ${message}`);
    }
  } catch {
    // Silently ignore logging failures — don't break the command
  }
}
