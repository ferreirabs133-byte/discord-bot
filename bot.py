"""
bot.py
Bot de Discord com o comando /logo, que gera um "logo" estilizado
(texto grande com contorno, sobre fundo abstrato/cor solida/imagem enviada),
em PNG estatico ou GIF animado.

Como rodar:
    1. pip install -r requirements.txt
    2. Defina a variavel de ambiente DISCORD_TOKEN com o token do bot
    3. python bot.py

Veja o README.md para instrucoes completas (criar o bot, convidar pro
servidor, permissoes necessarias, etc).
"""

import io
import os

import discord
from discord import app_commands
from discord.ext import commands

import image_gen

TOKEN = os.getenv("DISCORD_TOKEN")

intents = discord.Intents.default()
bot = commands.Bot(command_prefix="!", intents=intents)


@bot.event
async def on_ready():
    try:
        synced = await bot.tree.sync()
        print(f"Sincronizados {len(synced)} comandos.")
    except Exception as e:
        print(f"Erro ao sincronizar comandos: {e}")
    print(f"Bot online como {bot.user} (id {bot.user.id})")


@bot.tree.command(name="logo", description="Gera um logo estilizado (texto + fundo customizavel)")
@app_commands.describe(
    texto="Texto que vai aparecer no logo (ex: NATA)",
    cor="Cor do texto: nome (white, red...) ou hex (#00ffcc). Padrao: white",
    fundo="Cor de fundo: nome ou hex. Se nao enviar, usa o fundo abstrato roxo padrao",
    imagem="Envie uma imagem para usar como fundo (tem prioridade sobre 'fundo')",
    animado="Se True, gera um GIF animado em vez de PNG estatico",
)
async def logo(
    interaction: discord.Interaction,
    texto: str,
    cor: str = "white",
    fundo: str = None,
    imagem: discord.Attachment = None,
    animado: bool = False,
):
    await interaction.response.defer()

    if len(texto) > 20:
        await interaction.followup.send("Manda um texto mais curto (max. 20 caracteres) pra ficar bonito no logo.")
        return

    bg_bytes = None
    if imagem is not None:
        if not imagem.content_type or not imagem.content_type.startswith("image/"):
            await interaction.followup.send("Isso que voce enviou nao parece ser uma imagem valida.")
            return
        bg_bytes = await imagem.read()

    try:
        if animado:
            data = image_gen.generate_animated_logo(
                texto, text_color=cor, bg_color=fundo, bg_image_bytes=bg_bytes
            )
            filename = "logo.gif"
        else:
            data = image_gen.generate_static_logo(
                texto, text_color=cor, bg_color=fundo, bg_image_bytes=bg_bytes
            )
            filename = "logo.png"
    except Exception as e:
        await interaction.followup.send(f"Deu erro ao gerar o logo: `{e}`")
        return

    file = discord.File(io.BytesIO(data), filename=filename)
    await interaction.followup.send(
        content=f"Aqui está, {interaction.user.mention}:", file=file
    )


@bot.tree.command(name="ajuda_logo", description="Explica como usar o comando /logo")
async def ajuda_logo(interaction: discord.Interaction):
    texto = (
        "**/logo** — gera um logo estilizado\n\n"
        "Parametros:\n"
        "- `texto`: o que vai aparecer escrito (obrigatorio)\n"
        "- `cor`: cor do texto (ex: `white`, `red`, `#00ffcc`)\n"
        "- `fundo`: cor de fundo (ex: `#1a1a2e`). Se nao passar, usa o fundo roxo abstrato padrao\n"
        "- `imagem`: anexe uma imagem para usar como fundo (tem prioridade sobre `fundo`)\n"
        "- `animado`: `True` para gerar GIF animado, `False` (padrao) para PNG estatico\n\n"
        "Exemplos:\n"
        "`/logo texto:NATA`\n"
        "`/logo texto:NATA cor:#00ffcc fundo:#1a1a2e`\n"
        "`/logo texto:NATA animado:True`"
    )
    await interaction.response.send_message(texto, ephemeral=True)


if __name__ == "__main__":
    if not TOKEN:
        raise SystemExit(
            "Defina a variavel de ambiente DISCORD_TOKEN antes de rodar o bot."
        )
    bot.run(TOKEN)
  
