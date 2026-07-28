# Zend Clone Bot

Clone funcional, em `discord.js`, do bot Zend/zenSallers observado no Discord.

> **Créditos / branding:** **Flow Vazamentos** · **`.gg/flowvazamentos`**  
> O crédito fica no núcleo (`src/infraestrutura/creditos.js`) e nos footers. Não remova.

## Como rodar

1. Instale dependencias:

```powershell
npm install
```

2. Copie `config.example.json` para `config.json` e preencha `token`, `clientId` e, se quiser comandos instantaneos em um servidor de teste, `guildId`.

```json
{
  "token": "SEU_TOKEN_DO_BOT",
  "clientId": "SEU_CLIENT_ID",
  "guildId": "ID_DO_SERVIDOR_OPCIONAL",
  "syncEmojisOnStart": true
}
```

3. Inicie:

```powershell
npm start
```

4. Para sincronizar os emojis de `discord-emojis/upload` como emojis da aplicação do bot, sem consumir o limite do servidor:

```powershell
npm run syncemojis
```

## Comandos

- Foram mapeados e registrados os slash commands visiveis do app Zend, incluindo `/panel`, `/manage_product`, `/manage_item`, `/manage_stock`, `/postproduto`, `/entregar`, `/sales`, `/zenwallet` e `/syncemojis`.

Os dados ficam em `data/state.json`. O clone inclui os fluxos observados: loja, produto, campos/estoque, emojis customizados, cupons, posicoes, saldo interno, condecoracoes, cargo temporario, OAuth2 de compras, postagem de venda, ticket, boas-vindas, automacoes, customizacao, extrato, giveaway, configuracoes, pagamentos, zenCloud e zenProtect.

## Estrutura de configuração

- `src/configuracoes/emojis-zend.js`: pasta e extensões dos emojis locais.
- `src/configuracoes/temas-zend.js`: cinco cores de estado e temas visuais.
- `src/configuracoes/canais-zend.js`: nomes usados na criação automática de canais.
- `src/infraestrutura/resposta-painel.js`: atualização da mesma mensagem durante a navegação.
