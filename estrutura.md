# Estrutura do Bot

O `src/index.js` agora serve apenas para ligar o bot. Toda regra foi separada por pasta para ficar facil de achar e editar no Visual Studio.

## Onde mexer

- `src/index.js`: entrada unica. Nao coloque comandos, botoes, embeds ou regras aqui.
- `src/aplicacao/iniciar-bot.js`: monta o bot, conecta os modulos e registra eventos.
- `src/comandos/slash-commands.js`: declara quais comandos aparecem no Discord.
- `src/comandos/executor-slash.js`: executa o que cada comando slash faz.
- `src/paineis/paineis-zend.js`: monta embeds, banners, botoes, selects e telas visuais.
- `src/interacoes/botoes.js`: cliques em botoes.
- `src/interacoes/menus.js`: menus/selects de texto, cargo e canal.
- `src/interacoes/modais.js`: formularios/modal enviados pelo Discord.
- `src/eventos/`: eventos do Discord, como bot pronto, entrada de membro e interacoes.
- `src/automacoes/estado-automacoes.js`: formato dos dados e migracao das automacoes antigas.
- `src/automacoes/paineis-mensagens.js`: telas de mensagens automaticas e botoes URL.
- `src/automacoes/paineis-limpeza.js`: telas das regras e horarios de limpeza.
- `src/automacoes/paineis-outras-automacoes.js`: telas de feedback, lock, restock e convites.
- `src/automacoes/interacoes-automacoes.js`: botoes, menus e modais de mensagens e limpeza.
- `src/automacoes/interacoes-outras-automacoes.js`: interacoes de feedback, lock, restock e convites.
- `src/automacoes/servico-automacoes.js`: execucao periodica, envio automatico, limpeza e restock.
- `src/eventos/automacoes.js`: monitor de feedbacks e rastreamento de convites.
- `src/loja/carrinho.js`: carrinho, pagamento, entrega e sincronizacao da mensagem de venda.
- `src/logs/vendas.js`: logs de pedido, pagamento, entrega, estoque e DM do comprador.
- `src/database/`: estado JSON, dados padrao e busca de produtos/campos.
- `src/configuracoes/`: token, assets, temas, emojis e canais automaticos.
- `src/discord/`: pequenos helpers para criar botoes, embeds, modais e emojis.
- `src/infraestrutura/`: envio/edicao de respostas do Discord sem duplicar mensagens.
- `src/utilidades/`: formatacoes reutilizadas, como moeda, cores e previews.

## Regras simples

- Nova tela geral entra em `src/paineis/paineis-zend.js`; telas de automacao ficam em `src/automacoes/`.
- Novo botao entra em `src/interacoes/botoes.js`.
- Novo menu entra em `src/interacoes/menus.js`.
- Novo modal entra em `src/interacoes/modais.js`.
- Novo comando precisa ser declarado em `slash-commands.js` e executado em `executor-slash.js`.
- Nova log de venda ou compra entra em `src/logs/vendas.js`.
- Nova regra de carrinho ou entrega entra em `src/loja/carrinho.js`.
- Nova automacao deve separar painel, interacao e servico nos arquivos de `src/automacoes/`.

Para validar sem ligar o bot:

```bash
npm run check
npm run test:paineis
```

Para ligar pelo Visual Studio ou terminal:

```bash
npm start
```

Os arquivos de emoji ficam em `discord-emojis/upload`. Com `SYNC_EMOJIS_ON_START=true`, o bot sincroniza esses arquivos como emojis da aplicacao ao iniciar, sem consumir os slots de emoji do servidor.
