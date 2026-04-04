import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Collection,
  ChatInputCommandInteraction,
} from "discord.js";
import type { SharedSlashCommand } from "discord.js";

// Import all commands
import * as setupCmd from "./commands/setup.js";
import * as statusCmd from "./commands/status.js";
import * as walletInfoCmd from "./commands/walletInfo.js";
import * as walletSignCmd from "./commands/walletSign.js";
import * as payCmd from "./commands/pay.js";
import * as reputationCmd from "./commands/reputation.js";
import * as submitProofCmd from "./commands/submitProof.js";

// ─── Types ───────────────────────────────────────────────
interface Command {
  data: SharedSlashCommand;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

// ─── Client Setup ────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ─── Command Registry ────────────────────────────────────
const commands = new Collection<string, Command>();

const allCommands: Command[] = [
  setupCmd,
  statusCmd,
  walletInfoCmd,
  walletSignCmd,
  payCmd,
  reputationCmd,
  submitProofCmd,
];

for (const cmd of allCommands) {
  commands.set(cmd.data.name, cmd);
}

// ─── Register Slash Commands with Discord API ────────────
async function registerCommands() {
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error("❌ DISCORD_TOKEN is not set in .env");
    process.exit(1);
  }

  const rest = new REST({ version: "10" }).setToken(token);

  const commandData = allCommands.map((cmd) => cmd.data.toJSON());

  try {
    console.log(`🔄 Registering ${commandData.length} slash commands...`);
    await rest.put(Routes.applicationCommands(client.user!.id), {
      body: commandData,
    });
    console.log(`✅ Successfully registered ${commandData.length} slash commands.`);
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
}

// ─── Event Handlers ──────────────────────────────────────
client.once("ready", async () => {
  console.log("─────────────────────────────────────────────");
  console.log("  ⚡ ZeroClaw OS - Discord Command Center");
  console.log(`  🤖 Logged in as ${client.user?.tag}`);
  console.log(`  🌐 Connected to ${client.guilds.cache.size} server(s)`);
  console.log("─────────────────────────────────────────────");

  await registerCommands();
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply({
      content: "❌ Unknown command.",
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error executing /${interaction.commandName}:`, err);

    const errorMsg = "❌ An error occurred while executing this command.";
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMsg, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    }
  }
});

// ─── Login ───────────────────────────────────────────────
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("❌ DISCORD_TOKEN is not set in .env. Please configure it.");
  console.error("   See .env.example for the required variables.");
  process.exit(1);
}

client.login(token);
