# Bot em Python usando discord.py 2.6+ (Components V2)
# Painel fixo com botão de "unmute" automático + texto e banner customizáveis
#
# Requisitos:
#   discord.py >= 2.6  (Components V2 só existe a partir dessa versão)
#
# Permissões do bot: Silenciar Membros (Mute Members)
# Intents necessários: Guilds, Members, Voice States (ativar no Discord Developer Portal)

import os
import discord
from discord import app_commands
from discord.ext import commands

TOKEN = os.getenv("DISCORD_TOKEN")  # defina essa variável de ambiente na Railway

# ID fixo opcional, caso você não passe o parâmetro "canal" no comando
CANAL_PADRAO_ID = int(os.getenv("CANAL_PADRAO_ID", "0"))

# Textos e banner do painel (troque à vontade)
TITULO = "Encaminhada"
TEXTO = "Clique no botão abaixo para se desmutar automaticamente."
BANNER_URL = "https://exemplo.com/banner.png"  # troque pela URL da sua imagem


intents = discord.Intents.default()
intents.members = True
intents.voice_states = True

bot = commands.Bot(command_prefix="!", intents=intents)


# ------------------------------------------------------------------
# View (Components V2) com o botão de unmute
# custom_id fixo -> permite que o botão continue funcionando mesmo
# depois de reiniciar o bot (view persistente)
# ------------------------------------------------------------------
class UnmuteLayout(discord.ui.LayoutView):
    def __init__(self):
        super().__init__(timeout=None)

        container = discord.ui.Container(accent_color=discord.Color.blurple())

        if BANNER_URL:
            container.add_item(
                discord.ui.MediaGallery(discord.MediaGalleryItem(media=BANNER_URL))
            )

        container.add_item(
            discord.ui.TextDisplay(content=f"**{TITULO}**\n{TEXTO}")
        )

        container.add_item(discord.ui.Separator())

        row = discord.ui.ActionRow()

        @row.button(label="unmute", style=discord.ButtonStyle.secondary, custom_id="unmute_button")
        async def unmute_callback(interaction: discord.Interaction, button: discord.ui.Button):
            member = interaction.user

            if member.voice is None or member.voice.channel is None:
                await interaction.response.send_message(
                    "Você precisa estar em um canal de voz para usar esse botão.",
                    ephemeral=True,
                )
                return

            try:
                await member.edit(mute=False, reason="Desmutado via botão do painel")
                await interaction.response.send_message(
                    "🔊 Você foi desmutado com sucesso!", ephemeral=True
                )
            except discord.Forbidden:
                await interaction.response.send_message(
                    "Não consegui desmutar você. Verifique se o bot tem a permissão "
                    "**Silenciar Membros** e um cargo acima do seu.",
                    ephemeral=True,
                )
            except discord.HTTPException:
                await interaction.response.send_message(
                    "Ocorreu um erro ao tentar desmutar você. Tente novamente.",
                    ephemeral=True,
                )

        container.add_item(row)
        self.add_item(container)


# ------------------------------------------------------------------
# Comando /enviar-painel-unmute
# ------------------------------------------------------------------
@bot.tree.command(name="enviar-painel-unmute", description="Envia o painel fixo com o botão de desmutar em um canal")
@app_commands.describe(canal="Canal onde o painel será enviado (opcional)")
@app_commands.checks.has_permissions(manage_guild=True)
async def enviar_painel_unmute(interaction: discord.Interaction, canal: discord.TextChannel = None):
    canal_final = canal or bot.get_channel(CANAL_PADRAO_ID)

    if canal_final is None:
        await interaction.response.send_message(
            "Canal inválido. Informe um canal ou configure CANAL_PADRAO_ID.",
            ephemeral=True,
        )
        return

    await canal_final.send(view=UnmuteLayout())
    await interaction.response.send_message(f" Painel enviado em {canal_final.mention}.", ephemeral=True)


@enviar_painel_unmute.error
async def enviar_painel_unmute_error(interaction: discord.Interaction, error: app_commands.AppCommandError):
    if isinstance(error, app_commands.MissingPermissions):
        await interaction.response.send_message(
            "Você não tem permissão para usar esse comando.", ephemeral=True
        )


# ------------------------------------------------------------------
# Inicialização
# ------------------------------------------------------------------
@bot.event
async def on_ready():
    # Registra a view como persistente (funciona depois de reiniciar o bot)
    bot.add_view(UnmuteLayout())
    await bot.tree.sync()
    print(f"Bot online como {bot.user}")


if __name__ == "__main__":
    if not TOKEN:
        raise RuntimeError("Defina a variável de ambiente DISCORD_TOKEN")
    bot.run(TOKEN)
