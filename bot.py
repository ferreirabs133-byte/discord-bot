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
reverse_mute_targets: dict[int, int] = {}
elevator_targets: dict[int, dict] = {}
elevator_index: dict[int, int] = {}
user_perms: dict[int, dict[int, set]] = {}


# ─────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────
def tem_perm(guild_id: int, user_id: int, funcao: str) -> bool:
    return funcao in user_perms.get(guild_id, {}).get(user_id, set())

def servidores_do_usuario(user_id: int):
    """Retorna servidores onde o bot E o usuário estão."""
    return [g for g in bot.guilds if g.get_member(user_id)]


# ─────────────────────────────────────────
#  EVENTOS
# ─────────────────────────────────────────
@bot.event
async def on_ready():
    await bot.tree.sync()
    print(f"✅ Bot online como {bot.user}")
    print(f"📡 Servidores: {', '.join(g.name for g in bot.guilds)}")


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
                            except discord.Forbidden:
                                pass
                        break
        except Exception as e:
            print(f"Erro audit log: {e}")


# ─────────────────────────────────────────
#  TAREFA: ELEVADOR
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
        canais_voz = [c for c in guild.channels if isinstance(c, discord.VoiceChannel)]
        if len(canais_voz) < 2:
            continue
        idx = elevator_index.get(guild_id, 0)
        idx = (idx + 1) % len(canais_voz)
        elevator_index[guild_id] = idx
        proximo = canais_voz[idx]
        if proximo.id != member.voice.channel.id:
            try:
                await member.move_to(proximo, reason="Elevador ativo")
            except Exception as e:
                print(f"Erro elevador: {e}")


# ═══════════════════════════════════════════
#  MENU INTERATIVO
# ═══════════════════════════════════════════

# ── Selecionar servidor (paginado) ──
class ServidorSelect(discord.ui.Select):
    def __init__(self, guilds: list, pagina: int, total_paginas: int, proxima_view_cls):
        self.proxima_view_cls = proxima_view_cls
        opcoes = [
            discord.SelectOption(label=g.name[:100], value=str(g.id))
            for g in guilds
        ]
        super().__init__(placeholder="Selecione um servidor", min_values=1, max_values=1, options=opcoes)

    async def callback(self, interaction: discord.Interaction):
        guild_id = int(self.values[0])
        guild = bot.get_guild(guild_id)
        view = self.proxima_view_cls(guild, interaction.user)
        embed = discord.Embed(
            title="⚙️ Menu do Bot",
            description=f"**Servidor:** {guild.name}\nEscolha uma opção:",
            color=discord.Color.blurple()
        )
        await interaction.response.edit_message(embed=embed, view=view)


class ServidorView(discord.ui.View):
    def __init__(self, user_id: int, pagina: int = 0, proxima_view_cls=None):
        super().__init__(timeout=60)
        self.user_id = user_id
        self.pagina = pagina
        self.proxima_view_cls = proxima_view_cls

        guilds = servidores_do_usuario(user_id)
        por_pagina = 20
        total = len(guilds)
        self.total_paginas = max(1, (total + por_pagina - 1) // por_pagina)
        fatia = guilds[pagina * por_pagina:(pagina + 1) * por_pagina]

        if fatia:
            self.add_item(ServidorSelect(fatia, pagina, self.total_paginas, proxima_view_cls))

        if pagina > 0:
            btn_ant = discord.ui.Button(label="Anterior", style=discord.ButtonStyle.secondary)
            btn_ant.callback = self.anterior
            self.add_item(btn_ant)

        if (pagina + 1) * por_pagina < total:
            btn_prox = discord.ui.Button(label="Próximo", style=discord.ButtonStyle.secondary)
            btn_prox.callback = self.proximo
            self.add_item(btn_prox)

    async def anterior(self, interaction: discord.Interaction):
        view = ServidorView(self.user_id, self.pagina - 1, self.proxima_view_cls)
        await interaction.response.edit_message(view=view)

    async def proximo(self, interaction: discord.Interaction):
        view = ServidorView(self.user_id, self.pagina + 1, self.proxima_view_cls)
        await interaction.response.edit_message(view=view)


# ── Menu de ações após escolher servidor ──
class MenuAcoesView(discord.ui.View):
    def __init__(self, guild: discord.Guild, user: discord.User):
        super().__init__(timeout=60)
        self.guild = guild
        self.user = user

    @discord.ui.button(label="🛗 Elevador", style=discord.ButtonStyle.primary)
    async def elevador(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not tem_perm(self.guild.id, interaction.user.id, "elevador"):
            return await interaction.response.send_message("❌ Você não tem permissão para usar o elevador.", ephemeral=True)
        view = ElevadorView(self.guild, interaction.user)
        embed = discord.Embed(title="🛗 Elevador", description=f"**Servidor:** {self.guild.name}", color=discord.Color.green())
        await interaction.response.edit_message(embed=embed, view=view)

    @discord.ui.button(label="🛡️ Mute Reverso", style=discord.ButtonStyle.danger)
    async def mute_reverso(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not tem_perm(self.guild.id, interaction.user.id, "mutereverse"):
            return await interaction.response.send_message("❌ Você não tem permissão para usar o mute reverso.", ephemeral=True)
        view = MuteReversoView(self.guild, interaction.user)
        embed = discord.Embed(title="🛡️ Mute Reverso", description=f"**Servidor:** {self.guild.name}", color=discord.Color.red())
        await interaction.response.edit_message(embed=embed, view=view)

    @discord.ui.button(label="↩️ Voltar", style=discord.ButtonStyle.secondary)
    async def voltar(self, interaction: discord.Interaction, button: discord.ui.Button):
        view = ServidorView(interaction.user.id, 0, MenuAcoesView)
        embed = discord.Embed(title="⚙️ Menu do Bot", description="Selecione um servidor:", color=discord.Color.blurple())
        await interaction.response.edit_message(embed=embed, view=view)


# ── Menu Elevador ──
class ElevadorUserSelect(discord.ui.Select):
    def __init__(self, guild: discord.Guild):
        self.guild = guild
        membros = [m for m in guild.members if not m.bot][:25]
        opcoes = [discord.SelectOption(label=m.display_name[:100], value=str(m.id)) for m in membros]
        super().__init__(placeholder="Selecione o usuário para mover", min_values=1, max_values=1, options=opcoes)

    async def callback(self, interaction: discord.Interaction):
        uid = int(self.values[0])
        member = self.guild.get_member(uid)

        canais_voz = [c for c in self.guild.channels if isinstance(c, discord.VoiceChannel)]
        if len(canais_voz) < 2:
            return await interaction.response.send_message("❌ Servidor precisa ter pelo menos 2 canais de voz.", ephemeral=True)

        elevator_targets[self.guild.id] = {"user_id": uid}
        elevator_index[self.guild.id] = 0
        if not elevador_loop.is_running():
            elevador_loop.start()

        embed = discord.Embed(
            title="🛗 Elevador Ativado",
            description=f"Movendo **{member.display_name}** entre {len(canais_voz)} canais de voz em **{self.guild.name}**.",
            color=discord.Color.green()
        )
        await interaction.response.edit_message(embed=embed, view=ElevadorControleView(self.guild, interaction.user))


class ElevadorView(discord.ui.View):
    def __init__(self, guild: discord.Guild, user):
        super().__init__(timeout=60)
        self.guild = guild
        self.add_item(ElevadorUserSelect(guild))

    @discord.ui.button(label="⏹️ Parar Elevador", style=discord.ButtonStyle.danger, row=1)
    async def parar(self, interaction: discord.Interaction, button: discord.ui.Button):
        elevator_targets.pop(self.guild.id, None)
        elevator_index.pop(self.guild.id, None)
        if not elevator_targets:
            elevador_loop.cancel()
        embed = discord.Embed(title="⏹️ Elevador Parado", description=f"Elevador parado em **{self.guild.name}**.", color=discord.Color.red())
        await interaction.response.edit_message(embed=embed, view=None)

    @discord.ui.button(label="↩️ Voltar", style=discord.ButtonStyle.secondary, row=1)
    async def voltar(self, interaction: discord.Interaction, button: discord.ui.Button):
        view = MenuAcoesView(self.guild, interaction.user)
        embed = discord.Embed(title="⚙️ Menu do Bot", description=f"**Servidor:** {self.guild.name}\nEscolha uma opção:", color=discord.Color.blurple())
        await interaction.response.edit_message(embed=embed, view=view)


class ElevadorControleView(discord.ui.View):
    def __init__(self, guild: discord.Guild, user):
        super().__init__(timeout=60)
        self.guild = guild

    @discord.ui.button(label="⏹️ Parar Elevador", style=discord.ButtonStyle.danger)
    async def parar(self, interaction: discord.Interaction, button: discord.ui.Button):
        elevator_targets.pop(self.guild.id, None)
        elevator_index.pop(self.guild.id, None)
        if not elevator_targets:
            elevador_loop.cancel()
        embed = discord.Embed(title="⏹️ Elevador Parado", color=discord.Color.red())
        await interaction.response.edit_message(embed=embed, view=None)


# ── Menu Mute Reverso ──
class MuteReversoUserSelect(discord.ui.Select):
    def __init__(self, guild: discord.Guild):
        self.guild = guild
        membros = [m for m in guild.members if not m.bot][:25]
        opcoes = [discord.SelectOption(label=m.display_name[:100], value=str(m.id)) for m in membros]
        super().__init__(placeholder="Selecione o usuário a proteger", min_values=1, max_values=1, options=opcoes)

    async def callback(self, interaction: discord.Interaction):
        uid = int(self.values[0])
        member = self.guild.get_member(uid)
        reverse_mute_targets[self.guild.id] = uid
        embed = discord.Embed(
            title="🛡️ Mute Reverso Ativado",
            description=f"**{member.display_name}** está protegido em **{self.guild.name}**.\nQuem tentar mutá-lo será mutado no lugar.",
            color=discord.Color.red()
        )
        await interaction.response.edit_message(embed=embed, view=MuteReversoControleView(self.guild, interaction.user))


class MuteReversoView(discord.ui.View):
    def __init__(self, guild: discord.Guild, user):
        super().__init__(timeout=60)
        self.guild = guild
        self.add_item(MuteReversoUserSelect(guild))

    @discord.ui.button(label="❌ Desativar Mute Reverso", style=discord.ButtonStyle.danger, row=1)
    async def desativar(self, interaction: discord.Interaction, button: discord.ui.Button):
        reverse_mute_targets.pop(self.guild.id, None)
        embed = discord.Embed(title="❌ Mute Reverso Desativado", description=f"Desativado em **{self.guild.name}**.", color=discord.Color.greyple())
        await interaction.response.edit_message(embed=embed, view=None)

    @discord.ui.button(label="↩️ Voltar", style=discord.ButtonStyle.secondary, row=1)
    async def voltar(self, interaction: discord.Interaction, button: discord.ui.Button):
        view = MenuAcoesView(self.guild, interaction.user)
        embed = discord.Embed(title="⚙️ Menu do Bot", description=f"**Servidor:** {self.guild.name}\nEscolha uma opção:", color=discord.Color.blurple())
        await interaction.response.edit_message(embed=embed, view=view)


class MuteReversoControleView(discord.ui.View):
    def __init__(self, guild: discord.Guild, user):
        super().__init__(timeout=60)
        self.guild = guild

    @discord.ui.button(label="❌ Desativar", style=discord.ButtonStyle.danger)
    async def desativar(self, interaction: discord.Interaction, button: discord.ui.Button):
        reverse_mute_targets.pop(self.guild.id, None)
        embed = discord.Embed(title="❌ Mute Reverso Desativado", color=discord.Color.greyple())
        await interaction.response.edit_message(embed=embed, view=None)


# ─────────────────────────────────────────
#  SLASH COMMANDS
# ─────────────────────────────────────────
@bot.tree.command(name="menu", description="Abre o menu do bot")
async def menu(interaction: discord.Interaction):
    guilds = servidores_do_usuario(interaction.user.id)
    if not guilds:
        return await interaction.response.send_message("❌ Não encontrei nenhum servidor em comum.", ephemeral=True)

    view = ServidorView(interaction.user.id, 0, MenuAcoesView)
    embed = discord.Embed(
        title="⚙️ Menu do Bot",
        description="Selecione um servidor:",
        color=discord.Color.blurple()
    )
    await interaction.response.send_message(embed=embed, view=view, ephemeral=True)


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

    class PermSelect(discord.ui.Select):
        def __init__(self_inner):
            opcoes = [
                discord.SelectOption(label="🛗 Elevador", value="elevador", default="elevador" in perms_atuais),
                discord.SelectOption(label="🛡️ Mute Reverso", value="mutereverse", default="mutereverse" in perms_atuais),
            ]
            super().__init__(placeholder="Selecione as permissões...", min_values=0, max_values=2, options=opcoes)

        async def callback(self_inner, inter: discord.Interaction):
            if guild_id not in user_perms:
                user_perms[guild_id] = {}
            selecionadas = set(self_inner.values)
            user_perms[guild_id][membro.id] = selecionadas
            if selecionadas:
                lista = ", ".join(nomes[p] for p in selecionadas)
                msg = f"✅ Permissões de **{membro.display_name}** atualizadas: {lista}"
            else:
                msg = f"🚫 Todas as permissões de **{membro.display_name}** foram removidas."
            await inter.response.send_message(msg, ephemeral=True)

    class PermView(discord.ui.View):
        def __init__(self_inner):
            super().__init__(timeout=60)
            self_inner.add_item(PermSelect())

    await interaction.response.send_message(embed=embed, view=PermView(), ephemeral=True)


@bot.command(name="sync")
async def sync_guild(ctx):
    bot.tree.copy_global_to(guild=ctx.guild)
    await bot.tree.sync(guild=ctx.guild)
    await ctx.send(f"✅ Slash commands sincronizados em **{ctx.guild.name}**!")


@bot.tree.error
async def on_app_command_error(interaction: discord.Interaction, error: app_commands.AppCommandError):
    await interaction.response.send_message(f"❌ Erro: {error}", ephemeral=True)


bot.run(TOKEN)
    
