import os
import discord
from discord import app_commands
from discord.ext import commands

TOKEN = os.getenv("DISCORD_TOKEN")

CANAL_PADRAO_ID = int(os.getenv("CANAL_PADRAO_ID", "0"))

TITULO = "Encaminhada"
TEXTO = "Clique no botÃ£o abaixo para se desmutar automaticamente."
BANNER_URL = os.getenv("BANNER_URL", "")

intents = discord.Intents.default()
intents.members = True
intents.voice_states = True
bot = commands.Bot(command_prefix="!", intents=intents)

class UnmuteButton(discord.ui.Button):
    def __init__(self):
        super().__init__(
            label="unmute",
            style=discord.ButtonStyle.secondary,
            custom_id="unmute_button",
        )

    async def callback(self, interaction: discord.Interaction):
        member = interaction.user

        if member.voice is None or member.voice.channel is None:
            await interaction.response.send_message(
                "VocÃª precisa estar em um canal de voz para usar esse botÃ£o.",
                ephemeral=True,
            )
            return

        if not member.voice.mute:
            await interaction.response.send_message(
                "VocÃª jÃ¡ estÃ¡ desmutado! NÃ£o preciso fazer nada. ðŸ”Š",
                ephemeral=True,
            )
            return

        try:
            await member.edit(mute=False, reason="Desmutado via botÃ£o do painel")
            await interaction.response.send_message(
                "ðŸ”Š VocÃª foi desmutado com sucesso!", ephemeral=True
            )
        except discord.Forbidden:
            await interaction.response.send_message(
                "NÃ£o consegui desmutar vocÃª. Verifique se o bot tem a permissÃ£o "
                "**Silenciar Membros** e um cargo acima do seu.",
                ephemeral=True,
            )
        except discord.HTTPException:
            await interaction.response.send_message(
                "Ocorreu um erro ao tentar desmutar vocÃª. Tente novamente.",
                ephemeral=True,
            )

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
        row.add_item(UnmuteButton())
        container.add_item(row)

        self.add_item(container)

@bot.tree.command(name="enviar-painel-unmute", description="Envia o painel fixo com o botÃ£o de desmutar em um canal")
@app_commands.describe(canal="Canal onde o painel serÃ¡ enviado (opcional)")
@app_commands.checks.has_permissions(manage_guild=True)
async def enviar_painel_unmute(interaction: discord.Interaction, canal: discord.TextChannel = None):
    canal_final = canal or bot.get_channel(CANAL_PADRAO_ID)

    if canal_final is None:
        await interaction.response.send_message(
            "Canal invÃ¡lido. Informe um canal ou configure CANAL_PADRAO_ID.",
            ephemeral=True,
        )
        return

    try:
        await canal_final.send(view=UnmuteLayout())
    except Exception as e:
        print(f"[ERRO ao enviar painel] {type(e).__name__}: {e}")
        await interaction.response.send_message(
            f"âŒ Erro ao enviar o painel: `{type(e).__name__}: {e}`",
            ephemeral=True,
        )
        return

    await interaction.response.send_message(f"âœ… Painel enviado em {canal_final.mention}.", ephemeral=True)

@enviar_painel_unmute.error
async def enviar_painel_unmute_error(interaction: discord.Interaction, error: app_commands.AppCommandError):
    if isinstance(error, app_commands.MissingPermissions):
        await interaction.response.send_message(
            "VocÃª nÃ£o tem permissÃ£o para usar esse comando.", ephemeral=True
        )

@bot.event
async def on_ready():
    bot.add_view(UnmuteLayout())
    await bot.tree.sync()
    print(f"Bot online como {bot.user}")

if __name__ == "__main__":
    if not TOKEN:
        raise RuntimeError("Defina a variÃ¡vel de ambiente DISCORD_TOKEN")
    bot.run(TOKEN)
