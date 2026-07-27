require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  Events,
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // ID da aplicação (necessário para registrar slash commands)
const CANAL_PADRAO_ID = process.env.CANAL_PADRAO_ID || "0";

const TITULO = "Encaminhada";
const TEXTO = "Clique no botão abaixo para se desmutar automaticamente.";
const BANNER_URL = process.env.BANNER_URL || "";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// ---------- Monta o painel (embed + botão) ----------
function criarPainel() {
  const embed = new EmbedBuilder()
    .setTitle(TITULO)
    .setDescription(TEXTO)
    .setColor(0x5865f2); // blurple

  if (BANNER_URL) {
    embed.setImage(BANNER_URL);
  }

  const botao = new ButtonBuilder()
    .setCustomId("unmute_button")
    .setLabel("unmute")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(botao);

  return { embeds: [embed], components: [row] };
}

// ---------- Registro do slash command ----------
const commands = [
  new SlashCommandBuilder()
    .setName("enviar-painel-unmute")
    .setDescription("Envia o painel fixo com o botão de desmutar em um canal")
    .addChannelOption((option) =>
      option
        .setName("canal")
        .setDescription("Canal onde o painel será enviado (opcional)")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
].map((command) => command.toJSON());

async function registrarComandos() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log("Slash commands registrados com sucesso.");
  } catch (error) {
    console.error("Erro ao registrar slash commands:", error);
  }
}

// ---------- Eventos ----------
client.once(Events.ClientReady, async () => {
  await registrarComandos();
  console.log(`Bot online como ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  // Slash command
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "enviar-painel-unmute") {
      await handleEnviarPainelUnmute(interaction);
    }
    return;
  }

  // Botão de unmute
  if (interaction.isButton() && interaction.customId === "unmute_button") {
    await handleUnmuteButton(interaction);
  }
});

async function handleEnviarPainelUnmute(interaction) {
  // Verificação de permissão (checagem extra além do setDefaultMemberPermissions)
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: "Você não tem permissão para usar esse comando.",
      ephemeral: true,
    });
    return;
  }

  const canalOpcao = interaction.options.getChannel("canal");
  const canalFinal =
    canalOpcao || (await interaction.guild.channels.fetch(CANAL_PADRAO_ID).catch(() => null));

  if (!canalFinal) {
    await interaction.reply({
      content: "Canal inválido. Informe um canal ou configure CANAL_PADRAO_ID.",
      ephemeral: true,
    });
    return;
  }

  try {
    await canalFinal.send(criarPainel());
  } catch (error) {
    console.error(`[ERRO ao enviar painel] ${error.name}: ${error.message}`);
    await interaction.reply({
      content: `❌ Erro ao enviar o painel: \`${error.name}: ${error.message}\``,
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    content: `Painel enviado em ${canalFinal}.`,
    ephemeral: true,
  });
}

async function handleUnmuteButton(interaction) {
  const member = interaction.member;

  if (!member.voice || !member.voice.channel) {
    await interaction.reply({
      content: "Você precisa estar em um canal de voz para usar esse botão.",
      ephemeral: true,
    });
    return;
  }

  if (!member.voice.mute && !member.voice.serverMute) {
    await interaction.reply({
      content: "Você já está desmutado! Não preciso fazer nada.",
      ephemeral: true,
    });
    return;
  }

  try {
    await member.voice.setMute(false, "Desmutado via botão do painel");
    await interaction.reply({
      content: "Você foi desmutado com sucesso!",
      ephemeral: true,
    });
  } catch (error) {
    if (error.code === 50013) {
      // Missing Permissions
      await interaction.reply({
        content:
          "Não consegui desmutar você. Verifique se o bot tem a permissão " +
          "**Silenciar Membros** e um cargo acima do seu.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "Ocorreu um erro ao tentar desmutar você. Tente novamente.",
        ephemeral: true,
      });
    }
  }
}

// ---------- Início ----------
if (!TOKEN) {
  throw new Error("Defina a variável de ambiente DISCORD_TOKEN");
}

client.login(TOKEN);
