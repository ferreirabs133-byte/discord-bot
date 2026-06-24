import os
import discord
from discord.ext import commands

# ===================== CONFIGURAÇÕES =====================
# Pegue o token em https://discord.com/developers/applications
# No Railway, defina isso em Variables como TOKEN (não cole o token aqui!)
TOKEN = os.getenv("TOKEN")

# Texto que aparece como nome da atividade (ex: "Farm 24/7 - Meu Bot 💜")
ACTIVITY_NAME = "Farm 24/7 - Meu Bot 💜"

# URL precisa ser de twitch.tv ou youtube.com para o Discord aceitar
# como "Transmitindo" (Streaming) de verdade
STREAM_URL = "https://twitch.tv/seucanal"

# Status: discord.Status.online / idle / dnd / invisible
STATUS = discord.Status.online
# ===========================================================

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)


@bot.event
async def on_ready():
    print(f"✅ Bot conectado como {bot.user} (ID: {bot.user.id})")

    activity = discord.Streaming(
        name=ACTIVITY_NAME,
        url=STREAM_URL,
    )

    await bot.change_presence(status=STATUS, activity=activity)
    print(f"🎮 Rich Presence definida: {ACTIVITY_NAME}")

    synced = await bot.tree.sync()
    print(f"🔄 {len(synced)} comando(s) slash sincronizado(s)")


@bot.command()
async def ping(ctx):
    await ctx.send(f"🏓 Pong! {round(bot.latency * 1000)}ms")


@bot.tree.command(name="presence", description="Ativa/atualiza a Rich Presence do bot")
@discord.app_commands.describe(
    nome="Texto principal da atividade",
    url="Link da Twitch ou YouTube (necessário para aparecer como Transmitindo)",
)
async def presence(
    interaction: discord.Interaction,
    nome: str = ACTIVITY_NAME,
    url: str = STREAM_URL,
):
    activity = discord.Streaming(name=nome, url=url)
    await bot.change_presence(status=STATUS, activity=activity)
    await interaction.response.send_message(
        f"✅ Rich Presence ativada!\n**Nome:** {nome}\n**URL:** {url}",
        ephemeral=True,
    )


@bot.tree.command(name="presence_off", description="Desativa a Rich Presence do bot")
async def presence_off(interaction: discord.Interaction):
    await bot.change_presence(status=STATUS, activity=None)
    await interaction.response.send_message("✅ Rich Presence desativada.", ephemeral=True)


if __name__ == "__main__":
    if not TOKEN:
        raise ValueError(
            "TOKEN não encontrado! Defina a variável de ambiente TOKEN no Railway."
        )
    bot.run(TOKEN)
    
