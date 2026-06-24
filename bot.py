import os
import discord
from discord import app_commands
from discord.ext import tasks
from datetime import datetime, timezone, timedelta
import asyncio

# ===== CONFIGURAÇÃO VIA VARIÁVEIS DE AMBIENTE =====
TOKEN = os.getenv("TOKEN")
GUILD_ID = int(os.getenv("GUILD_ID", "0"))
CHECK_INTERVAL = int(os.getenv("CHECK_INTERVAL", "10"))  # segundos entre verificações
# ====================================================

intents = discord.Intents.default()
intents.members = True
intents.message_content = True

bot = discord.Client(intents=intents)
tree = app_commands.CommandTree(bot)

# Dados em memória: {user_id: duration_minutes}
alvos = {}
mutado_por_nos = set()  # IDs que foram mutados por esse bot (pra não remover timeout manual)

# ==================== POLLING ====================

@tasks.loop(seconds=CHECK_INTERVAL)
async def verificar_mutes():
    if not alvos:
        return

    for guild in bot.guilds:
        for user_id, duracao in list(alvos.items()):
            member = guild.get_member(user_id)
            if not member:
                continue

            agora = datetime.now(timezone.utc)
            timeout_fim = member.communication_disabled_until

            try:
                # Caso 1: Não tem mute
                if timeout_fim is None:
                    await aplicar_mute(member, duracao)
                
                # Caso 2: Mute prestes a expirar (menos de 60s)
                elif timeout_fim < agora + timedelta(seconds=60):
                    await aplicar_mute(member, duracao)
                
                # Caso 3: Alguém removeu/reduziu manualmente
                elif user_id in mutado_por_nos and timeout_fim < agora + timedelta(minutes=duracao - 1):
                    await aplicar_mute(member, duracao)

            except Exception as e:
                print(f"[!] Erro com {member.name}: {e}")

async def aplicar_mute(member, duracao_minutos):
    try:
        timeout_fim = datetime.now(timezone.utc) + timedelta(minutes=duracao_minutos)
        await member.edit(
            communication_disabled_until=timeout_fim,
            reason="Mute infinito - Gerenciado por Slash Commands"
        )
        mutado_por_nos.add(member.id)
        print(f"[✓] Mute aplicado/renovado: {member.name} ({duracao_minutos} min)")
    except discord.Forbidden:
        print(f"[✗] Sem permissão para mutar {member.name}")
    except Exception as e:
        print(f"[✗] Erro ao mutar {member.name}: {e}")

# ==================== EVENTOS ====================

@bot.event
async def on_ready():
    print(f"[+] Logado como: {bot.user}")
    print(f"[+] Sincronizando comandos Slash...")
    await tree.sync()
    print(f"[+] Comandos sincronizados!")
    verificar_mutes.start()
    print(f"[+] Polling iniciado (a cada {CHECK_INTERVAL}s)")
    print(f"[+] Alvos ativos: {len(alvos)}")

@bot.event
async def on_member_update(before, after):
    """Caso especial: se alguém manualmente desmutar, reage rápido"""
    user_id = after.id
    if user_id not in alvos:
        return

    before_timeout = before.communication_disabled_until
    after_timeout = after.communication_disabled_until

    # Se foi desmutado (tinha mute e agora não tem)
    if before_timeout and not after_timeout:
        print(f"[!] DETECTADO: {after.name} foi desmutado manualmente!")
        await aplicar_mute(after, alvos[user_id])

# ==================== SLASH COMMANDS ====================

@tree.command(
    name="mutar",
    description="Ativa mute infinito em uma pessoa"
)
@app_commands.describe(
    usuario="Quem vai ficar mutado (ID ou @menção)",
    minutos="Duração de cada aplicação de mute (padrão: 10 min)"
)
async def mutar(interaction: discord.Interaction, usuario: str, minutos: int = 10):
    await interaction.response.defer(ephemeral=True)

    try:
        # Tenta interpretar como menção ou ID
        if usuario.startswith("<@"):
            user_id = int(usuario.strip("<@!>"))
        else:
            user_id = int(usuario)

        member = interaction.guild.get_member(user_id)
        if not member:
            await interaction.followup.send("❌ Usuário não encontrado neste servidor.", ephemeral=True)
            return

        if minutos < 1:
            await interaction.followup.send("❌ Duração mínima: 1 minuto.", ephemeral=True)
            return
        if minutos > 40320:
            await interaction.followup.send("❌ Duração máxima: 40320 minutos (28 dias).", ephemeral=True)
            return

        alvos[user_id] = minutos
        await aplicar_mute(member, minutos)
        
        embed = discord.Embed(
            title="✅ Mute Infinito Ativado",
            description=f"{member.mention} será mantido mutado permanentemente.",
            color=discord.Color.red()
        )
        embed.add_field(name="Duração por aplicação", value=f"{minutos} minutos")
        embed.add_field(name="Verificação", value=f"A cada {CHECK_INTERVAL} segundos")
        
        await interaction.followup.send(embed=embed, ephemeral=True)

    except ValueError:
        await interaction.followup.send("❌ Formato inválido. Use @menção ou o ID numérico.", ephemeral=True)
    except Exception as e:
        await interaction.followup.send(f"❌ Erro: {e}", ephemeral=True)


@tree.command(
    name="desmutar",
    description="Remove o mute infinito de uma pessoa (libera ela)"
)
@app_commands.describe(
    usuario="Quem vai ser liberado (ID ou @menção)"
)
async def desmutar(interaction: discord.Interaction, usuario: str):
    await interaction.response.defer(ephemeral=True)

    try:
        if usuario.startswith("<@"):
            user_id = int(usuario.strip("<@!>"))
        else:
            user_id = int(usuario)

        if user_id not in alvos:
            await interaction.followup.send("❌ Essa pessoa não está sendo monitorada.", ephemeral=True)
            return

        member = interaction.guild.get_member(user_id)
        del alvos[user_id]
        mutado_por_nos.discard(user_id)

        # Remove o timeout se existir
        if member and member.communication_disabled_until:
            try:
                await member.edit(
                    communication_disabled_until=None,
                    reason="Mute infinito removido por comando"
                )
            except:
                pass

        embed = discord.Embed(
            title="✅ Mute Infinito Removido",
            description=f"{member.mention if member else user_id} foi liberado.",
            color=discord.Color.green()
        )
        await interaction.followup.send(embed=embed, ephemeral=True)

    except ValueError:
        await interaction.followup.send("❌ Formato inválido. Use @menção ou o ID numérico.", ephemeral=True)
    except Exception as e:
        await interaction.followup.send(f"❌ Erro: {e}", ephemeral=True)


@tree.command(
    name="listar",
    description="Mostra todos os alvos do mute infinito"
)
async def listar(interaction: discord.Interaction):
    await interaction.response.defer(ephemeral=True)

    if not alvos:
        await interaction.followup.send("📭 Nenhuma pessoa está sendo monitorada.", ephemeral=True)
        return

    embed = discord.Embed(
        title="📋 Alvos do Mute Infinito",
        color=discord.Color.blue()
    )

    for user_id, minutos in alvos.items():
        member = interaction.guild.get_member(user_id)
        nome = member.mention if member else f"Desconhecido ({user_id})"
        status = "🔴 Mutado" if (member and member.communication_disabled_until) else "🟡 Aguardando"
        embed.add_field(
            name=nome,
            value=f"`{status}` | Duração: {minutos} min",
            inline=False
        )

    await interaction.followup.send(embed=embed, ephemeral=True)


@tree.command(
    name="mutar_tempo",
    description="Altera o tempo de mute de um alvo já cadastrado"
)
@app_commands.describe(
    usuario="Quem está na lista",
    minutos="Nova duração em minutos"
)
async def mutar_tempo(interaction: discord.Interaction, usuario: str, minutos: int):
    await interaction.response.defer(ephemeral=True)

    try:
        if usuario.startswith("<@"):
            user_id = int(usuario.strip("<@!>"))
        else:
            user_id = int(usuario)

        if user_id not in alvos:
            await interaction.followup.send("❌ Essa pessoa não está na lista.", ephemeral=True)
            return

        alvos[user_id] = minutos
        member = interaction.guild.get_member(user_id)
        
        embed = discord.Embed(
            title="⏱️ Duração Alterada",
            description=f"{member.mention if member else user_id} agora recebe mute de {minutos} minutos.",
            color=discord.Color.orange()
        )
        await interaction.followup.send(embed=embed, ephemeral=True)

    except ValueError:
        await interaction.followup.send("❌ Formato inválido.", ephemeral=True)
    except Exception as e:
        await interaction.followup.send(f"❌ Erro: {e}", ephemeral=True)


@tree.command(
    name="limpar",
    description="Remove TODOS os alvos e libera todo mundo"
)
async def limpar(interaction: discord.Interaction):
    await interaction.response.defer(ephemeral=True)

    if not alvos:
        await interaction.followup.send("📭 Lista já está vazia.", ephemeral=True)
        return

    count = len(alvos)
    
    # Remove timeout de todos
    for guild in bot.guilds:
        for user_id in list(alvos.keys()):
            member = guild.get_member(user_id)
            if member and member.communication_disabled_until:
                try:
                    await member.edit(communication_disabled_until=None)
                except:
                    pass

    alvos.clear()
    mutado_por_nos.clear()

    embed = discord.Embed(
        title="🧹 Lista Limpa",
        description=f"{count} alvo(s) removido(s) e liberado(s).",
        color=discord.Color.green()
    )
    await interaction.followup.send(embed=embed, ephemeral=True)

# ==================== RODAR ====================

if __name__ == "__main__":
    if not TOKEN:
        print("[✗] ERRO: Token não definido nas variáveis de ambiente!")
        exit(1)
    if GUILD_ID == 0:
        print("[!] AVISO: GUILD_ID não definido. O bot funcionará em qualquer servidor.")
    
    bot.run(TOKEN)
