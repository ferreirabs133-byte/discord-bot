import discord
from discord import app_commands
from discord.ext import commands, tasks
import asyncio
import os

# ─────────────────────────────────────────
#  CONFIGURAÇÃO
# ─────────────────────────────────────────
TOKEN = os.environ.get("TOKEN")

intents = discord.Intents.all()
bot = commands.Bot(command_prefix="!", intents=intents)

# ─────────────────────────────────────────
#  ESTADO GLOBAL
# ─────────────────────────────────────────
reverse_mute_targets: dict[int, int] = {}   # guild_id -> user_id
elevator_targets: dict[int, dict] = {}       # guild_id -> {"user_id", "canais"}
elevator_index: dict[int, int] = {}          # guild_id -> índice atual do canal

# Permissões: guild_id -> {user_id: set("elevador", "mutereverse")}
user_perms: dict[int, dict[int, set]] = {}


# ─────────────────────────────────────────
#  HELPERS DE PERMISSÃO
# ─────────────────────────────────────────
def tem_perm(guild_id: int, user_id: int, funcao: str) -> bool:
    return funcao in user_perms.get(guild_id, {}).get(user_id, set())


# ─────────────────────────────────────────
#  AUTOCOMPLETE — servidores que o usuário está
# ─────────────────────────────────────────
async def autocomplete_servidores(interaction: discord.Interaction, current: str):
    resultados = []
    for g in bot.guilds:
        # Só mostra servidores onde o usuário é membro
        member = g.get_member(interaction.user.id)
        if member and (current.lower() in g.name.lower()):
            resultados.append(app_commands.Choice(name=g.name, value=str(g.id)))
    return resultados[:25]


# ─────────────────────────────────────────
#  EVENTOS
# ─────────────────────────────────────────
@bot.event
async def on_ready():
    await bot.tree.sync()
    servidores = [g.name for g in bot.guilds]
    print(f"✅ Bot online como {bot.user}")
    print(f"📡 Servidores: {', '.join(servidores)}")


@bot.event
async def on_voice_state_update(member: discord.Member, before: discord.VoiceState, after: discord.VoiceState):
    guild_id = member.guild.id
    protected_id = reverse_mute_targets.get(guild_id)
    if protected_id is None:
        return

    if member.id == protected_id and after.mute and not before.mute:
        await asyncio.sleep(0.5)
        try:
            await member.edit(mute=False, reason="Mute reverso ativo")
        except discord.Forbidden:
            pass

        await asyncio.sleep(0.5)
        try:
            async for entry in member.guild.audit_logs(limit=5, action=discord.AuditLogAction.member_update):
                if entry.target.id == protected_id:
                    if hasattr(entry.after, "mute") and entry.after.mute:
                        agressor = entry.user
                        if agressor and agressor.id != bot.user.id:
                            try:
                                await agressor.edit(mute=True, reason="Mute reverso")
                                print(f"🔇 Mute reverso em {agressor.name}")
                            except discord.Forbidden:
                                print(f"⚠️ Sem permissão para mutar {agressor.name}")
                        break
        except Exception as e:
            print(f"Erro no audit log: {e}")


# ─────────────────────────────────────────
#  TAREFA: ELEVADOR (todos os canais de voz)
# ─────────────────────────────────────────
@tasks.loop(seconds=2)
async def elevador_loop():
    for guild_id, config in list(elevator_targets.items()):
        guild = bot.get_guild(guild_id)
        if not guild:
            continue

        member = guild.get_member(config["user_id"])
        if not member or not member.voice:
            continue

        # Pega todos os canais de voz do servidor
        canais_voz = [c for c in guild.channels if isinstance(c, discord.VoiceChannel)]
        if len(canais_voz) < 2:
            continue

        # Avança para o próximo canal
        idx = elevator_index.get(guild_id, 0)
        idx = (idx + 1) % len(canais_voz)
        elevator_index[guild_id] = idx

        proximo = canais_voz[idx]
        if proximo.id != member.voice.channel.id:
            try:
                await member.move_to(proximo, reason="Elevador ativo")
            except Exception as e:
                print(f"Erro elevador: {e}")


# ─────────────────────────────────────────
#  MENU DE PERMISSÕES
# ─────────────────────────────────────────
class PermSelect(discord.ui.Select):
    def __init__(self, membro: discord.Member):
        self.membro = membro
        guild_id = membro.guild.id
        perms_atuais = user_perms.get(guild_id, {}).get(membro.id, set())

        opcoes = [
            discord.SelectOption(
                label="🛗 Elevador",
                value="elevador",
                description="Permite usar o elevador neste servidor",
                default="elevador" in perms_atuais
            ),
            discord.SelectOption(
                label="🛡️ Mute Reverso",
                value="mutereverse",
                description="Permite usar o mute reverso neste servidor",
                default="mutereverse" in perms_atuais
            ),
        ]
        super().__init__(
            placeholder="Selecione as permissões...",
            min_values=0,
            max_values=2,
            options=opcoes
        )

    async def callback(self, interaction: discord.Interaction):
        guild_id = self.membro.guild.id
        uid = self.membro.id

        if guild_id not in user_perms:
            user_perms[guild_id] = {}

        selecionadas = set(self.values)
        user_perms[guild_id][uid] = selecionadas

        nomes = {"elevador": "🛗 Elevador", "mutereverse": "🛡️ Mute Reverso"}

        if selecionadas:
            lista = ", ".join(nomes[p] for p in selecionadas)
            msg = f"✅ Permissões de **{self.membro.display_name}** atualizadas: {lista}"
        else:
            msg = f"🚫 Todas as permissões de **{self.membro.display_name}** foram removidas."

        await interaction.response.send_message(msg, ephemeral=True)


class PermView(discord.ui.View):
    def __init__(self, membro: discord.Member):
        super().__init__(timeout=60)
        self.add_item(PermSelect(membro))


# ─────────────────────────────────────────
#  SLASH COMMAND — /perm
# ─────────────────────────────────────────
@bot.tree.command(name="perm", description="Dá ou remove permissões do bot para um membro")
@app_commands.describe(membro="Membro que vai receber ou perder permissões")
async def perm(interaction: discord.Interaction, membro: discord.Member):
    guild_id = interaction.guild_id
    perms_atuais = user_perms.get(guild_id, {}).get(membro.id, set())
    nomes = {"elevador": "🛗 Elevador", "mutereverse": "🛡️ Mute Reverso"}

    status = ", ".join(nomes[p] for p in perms_atuais) if perms_atuais else "nenhuma"

    embed = discord.Embed(
        title="⚙️ Gerenciar Permissões",
        description=f"**Membro:** {membro.mention}\n**Permissões atuais:** {status}\n\nSelecione abaixo o que este membro pode usar:",
        color=discord.Color.blurple()
    )

    await interaction.response.send_message(embed=embed, view=PermView(membro), ephemeral=True)


# ─────────────────────────────────────────
#  SLASH COMMANDS — MUTE REVERSO
# ─────────────────────────────────────────
@bot.tree.command(name="mutereverse_ativar", description="Ativa mute reverso em um usuário num servidor escolhido")
@app_commands.describe(servidor="Servidor onde ativar", user_id="ID do usuário a proteger")
@app_commands.autocomplete(servidor=autocomplete_servidores)
async def mutereverse_ativar(interaction: discord.Interaction, servidor: str, user_id: str):
    if not tem_perm(interaction.guild_id, interaction.user.id, "mutereverse"):
        return await interaction.response.send_message("❌ Você não tem permissão para usar o mute reverso.", ephemeral=True)

    guild = bot.get_guild(int(servidor))
    if not guild:
        return await interaction.response.send_message("❌ Servidor não encontrado.", ephemeral=True)

    try:
        uid = int(user_id)
    except ValueError:
        return await interaction.response.send_message("❌ ID inválido.", ephemeral=True)

    member = guild.get_member(uid)
    nome = member.display_name if member else f"ID {uid}"
    reverse_mute_targets[guild.id] = uid
    await interaction.response.send_message(
        f"🛡️ Mute reverso ativado para **{nome}** no servidor **{guild.name}**.", ephemeral=True
    )


@bot.tree.command(name="mutereverse_desativar", description="Desativa o mute reverso num servidor escolhido")
@app_commands.describe(servidor="Servidor onde desativar")
@app_commands.autocomplete(servidor=autocomplete_servidores)
async def mutereverse_desativar(interaction: discord.Interaction, servidor: str):
    if not tem_perm(interaction.guild_id, interaction.user.id, "mutereverse"):
        return await interaction.response.send_message("❌ Você não tem permissão para usar o mute reverso.", ephemeral=True)

    guild = bot.get_guild(int(servidor))
    if not guild:
        return await interaction.response.send_message("❌ Servidor não encontrado.", ephemeral=True)

    reverse_mute_targets.pop(guild.id, None)
    await interaction.response.send_message(f"✅ Mute reverso desativado em **{guild.name}**.", ephemeral=True)


@bot.tree.command(name="mutereverse_status", description="Mostra status do mute reverso num servidor")
@app_commands.describe(servidor="Servidor para verificar")
@app_commands.autocomplete(servidor=autocomplete_servidores)
async def mutereverse_status(interaction: discord.Interaction, servidor: str):
    if not tem_perm(interaction.guild_id, interaction.user.id, "mutereverse"):
        return await interaction.response.send_message("❌ Você não tem permissão para usar o mute reverso.", ephemeral=True)

    guild = bot.get_guild(int(servidor))
    if not guild:
        return await interaction.response.send_message("❌ Servidor não encontrado.", ephemeral=True)

    uid = reverse_mute_targets.get(guild.id)
    if uid:
        member = guild.get_member(uid)
        nome = member.display_name if member else f"ID {uid}"
        await interaction.response.send_message(f"🛡️ Mute reverso ativo para **{nome}** em **{guild.name}**.", ephemeral=True)
    else:
        await interaction.response.send_message(f"❌ Nenhum mute reverso ativo em **{guild.name}**.", ephemeral=True)


# ─────────────────────────────────────────
#  SLASH COMMANDS — ELEVADOR
# ─────────────────────────────────────────
@bot.tree.command(name="elevador_iniciar", description="Fica movendo um usuário entre todos os canais de voz do servidor")
@app_commands.describe(
    servidor="Servidor onde ativar (apenas servidores que você está)",
    user_id="ID do usuário a mover"
)
@app_commands.autocomplete(servidor=autocomplete_servidores)
async def elevador_iniciar(interaction: discord.Interaction, servidor: str, user_id: str):
    if not tem_perm(interaction.guild_id, interaction.user.id, "elevador"):
        return await interaction.response.send_message("❌ Você não tem permissão para usar o elevador.", ephemeral=True)

    guild = bot.get_guild(int(servidor))
    if not guild:
        return await interaction.response.send_message("❌ Servidor não encontrado.", ephemeral=True)

    try:
        uid = int(user_id)
    except ValueError:
        return await interaction.response.send_message("❌ ID inválido.", ephemeral=True)

    member = guild.get_member(uid)
    if not member:
        return await interaction.response.send_message("❌ Usuário não encontrado no servidor.", ephemeral=True)

    canais_voz = [c for c in guild.channels if isinstance(c, discord.VoiceChannel)]
    if len(canais_voz) < 2:
        return await interaction.response.send_message("❌ O servidor precisa ter pelo menos 2 canais de voz.", ephemeral=True)

    elevator_targets[guild.id] = {"user_id": uid}
    elevator_index[guild.id] = 0

    if not elevador_loop.is_running():
        elevador_loop.start()

    await interaction.response.send_message(
        f"🛗 Elevador iniciado para **{member.display_name}** em **{guild.name}** — movendo entre {len(canais_voz)} canais de voz.",
        ephemeral=True
    )


@bot.tree.command(name="elevador_parar", description="Para o elevador num servidor escolhido")
@app_commands.describe(servidor="Servidor onde parar")
@app_commands.autocomplete(servidor=autocomplete_servidores)
async def elevador_parar(interaction: discord.Interaction, servidor: str):
    if not tem_perm(interaction.guild_id, interaction.user.id, "elevador"):
        return await interaction.response.send_message("❌ Você não tem permissão para usar o elevador.", ephemeral=True)

    guild = bot.get_guild(int(servidor))
    if not guild:
        return await interaction.response.send_message("❌ Servidor não encontrado.", ephemeral=True)

    elevator_targets.pop(guild.id, None)
    elevator_index.pop(guild.id, None)
    if not elevator_targets:
        elevador_loop.cancel()
    await interaction.response.send_message(f"✅ Elevador parado em **{guild.name}**.", ephemeral=True)


@bot.tree.command(name="elevador_status", description="Mostra status do elevador num servidor")
@app_commands.describe(servidor="Servidor para verificar")
@app_commands.autocomplete(servidor=autocomplete_servidores)
async def elevador_status(interaction: discord.Interaction, servidor: str):
    if not tem_perm(interaction.guild_id, interaction.user.id, "elevador"):
        return await interaction.response.send_message("❌ Você não tem permissão para usar o elevador.", ephemeral=True)

    guild = bot.get_guild(int(servidor))
    if not guild:
        return await interaction.response.send_message("❌ Servidor não encontrado.", ephemeral=True)

    config = elevator_targets.get(guild.id)
    if config:
        member = guild.get_member(config["user_id"])
        nome = member.display_name if member else f"ID {config['user_id']}"
        canais_voz = [c for c in guild.channels if isinstance(c, discord.VoiceChannel)]
        await interaction.response.send_message(
            f"🛗 Elevador ativo para **{nome}** em **{guild.name}** ({len(canais_voz)} canais de voz).", ephemeral=True
        )
    else:
        await interaction.response.send_message(f"❌ Nenhum elevador ativo em **{guild.name}**.", ephemeral=True)


# ─────────────────────────────────────────
#  SYNC
# ─────────────────────────────────────────
@bot.command(name="sync")
async def sync_guild(ctx):
    bot.tree.copy_global_to(guild=ctx.guild)
    await bot.tree.sync(guild=ctx.guild)
    await ctx.send(f"✅ Slash commands sincronizados em **{ctx.guild.name}**!")


# ─────────────────────────────────────────
#  ERRO PADRÃO
# ─────────────────────────────────────────
@bot.tree.error
async def on_app_command_error(interaction: discord.Interaction, error: app_commands.AppCommandError):
    await interaction.response.send_message(f"❌ Erro: {error}", ephemeral=True)


# ─────────────────────────────────────────
#  INICIAR
# ─────────────────────────────────────────
bot.run(TOKEN)

