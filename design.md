# Design System Document: CRM Simple

## 1. Visao Geral

**North Star: "Operacao Clara, Humana e Direta"**

O design atual do projeto combina uma base editorial leve com uma interface operacional de CRM. A aplicacao evita a estetica generica de dashboard cinza e adota:

- fundos com gradiente suave e sensacao de papel ou tela iluminada no tema claro
- superficies escuras mais frias no tema dark
- acento principal em verde-petroleo ou ciano
- contraste funcional, sem exagero visual
- componentes compactos e legiveis, com foco em uso diario

O resultado nao e um produto "luxury editorial" nem um SaaS ultraminimalista. E um CRM utilitario com acabamento visual mais cuidadoso, especialmente no header, nos cards, nos formularios e no kanban.

## 2. Principios de Design

### 2.1 Clareza operacional

A interface deve priorizar leitura rapida de status, acoes e contexto. O usuario precisa entender:

- onde esta
- o que pode fazer
- o que esta ativo
- qual item esta sendo manipulado

### 2.2 Camadas suaves, nao planas

A hierarquia visual nasce da combinacao de:

- superficies com opacidade leve
- gradientes discretos
- bordas translucidas
- sombras difusas e curtas

Nao e um sistema flat. Tambem nao e glassmorphism pesado. A aparencia correta e de camadas leves, macias e estaveis.

### 2.3 Tom humano com disciplina visual

Os titulos e labels usam caixa alta e tracking amplo em pontos estrategicos, mas o restante da UI mantem tom sobrio. Evite interfaces gritadas ou excessivamente decoradas.

### 2.4 Consistencia funcional primeiro

Estados de hover, foco, drag, selecao e modal precisam ser mais consistentes que chamativos. O feedback visual deve ser claro, curto e previsivel.

## 3. Tipografia

### Fontes oficiais

- **UI primaria:** `Manrope`
- **Monoespacada ou tecnica:** `JetBrains Mono`

### Uso recomendado

- `Manrope` deve ser usada em toda a interface principal
- `JetBrains Mono` deve ser reservada para contextos tecnicos, IDs, blocos utilitarios ou futuras areas de sistema

### Hierarquia de texto

- Titulos principais: peso `600`, tracking apertado ou neutro
- Labels e eyebrow: caixa alta com tracking amplo
- Texto auxiliar: `muted-foreground`
- Metadados e contadores: tamanhos `xs` e `sm`, com contraste moderado

### Exemplos do projeto

- Header com `CRM` em caixa alta e tracking alto
- nome da empresa no topo secundario do board
- Titulos de auth em escala maior, mas sem serifas

## 4. Cores e Tokens

O projeto trabalha com dois eixos visuais:

- tema global claro ou escuro
- tokens especificos do kanban

### 4.1 Tema claro

- `--background`: `#f4f1ea`
- `--foreground`: `#13232e`
- `--card`: `#fffdf8`
- `--header-surface`: `linear-gradient(180deg, #fffdf9 0%, #f4efe5 100%)`
- `--panel-surface`: `rgba(255, 255, 255, 0.9)`
- `--panel-accent-surface`: gradiente claro com brilho sutil em verde-petroleo
- `--subtle-surface`: `rgba(248, 250, 252, 0.75)`
- `--input-surface`: `rgba(255, 255, 255, 0.95)`
- `--muted-foreground`: `#5f6b64`
- `--border`: `rgba(19, 35, 46, 0.12)`
- `--ring`: `rgba(20, 94, 99, 0.36)`
- `--primary`: `#145e63`
- `--primary-foreground`: `#f5fbfb`
- `--secondary`: `#e7efe8`
- `--secondary-foreground`: `#25464b`
- `--danger`: `#b9382f`

### 4.2 Tema dark

- `--background`: `#0f1720`
- `--foreground`: `#e6edf3`
- `--card`: `#1f2329`
- `--header-surface`: `#1f1f21`
- `--panel-surface`: `rgba(31, 35, 41, 0.94)`
- `--panel-accent-surface`: `linear-gradient(180deg, #23272d 0%, #1d2126 100%)`
- `--subtle-surface`: `rgba(47, 52, 59, 0.82)`
- `--input-surface`: `#22272b`
- `--muted-foreground`: `#9fb0bd`
- `--border`: `rgba(255, 255, 255, 0.08)`
- `--ring`: `rgba(87, 190, 197, 0.3)`
- `--primary`: `#57bec5`
- `--primary-foreground`: `#091218`
- `--secondary`: `#2f343b`
- `--secondary-foreground`: `#d5e1e7`
- `--danger`: `#e0645d`

### 4.3 Tokens do kanban

- `--board-background`
- `--board-column-surface`
- `--board-card-surface`
- `--board-topbar-surface`
- `--board-dialog-surface`
- `--board-dialog-section-surface`
- `--board-dialog-input-surface`
- `--board-dialog-border`

No tema dark, o board usa uma identidade propria:

- fundo verde profundo: `linear-gradient(180deg, #23461f 0%, #1b3918 100%)`
- colunas quase pretas: `#101204`
- cards em cinza escuro: `#242528`
- topo com veu escuro translucido
- dialogs em carvao neutro, sem caixas internas pesadas

### 4.4 Cor de feedback de drag

- destaque de drag no kanban: `#669DF1`

Essa cor tambem pode aparecer em CTAs principais dentro do fluxo do kanban, como `Criar contato`, `Salvar contato` e `Registrar observacao`.

Regra:

- use `#669DF1` para drag e acoes principais do board
- nao transforme esse azul na cor principal global do produto

## 5. Bordas, Raios e Sombras

### Raios

Os tokens base atuais sao:

- `--radius-sm`: `3px`
- `--radius-md`: `3px`
- `--radius-lg`: `3px`

Na pratica, o projeto hoje convive com dois comportamentos:

- controles e elementos utilitarios usam raio curto ou moderado
- alguns shells legados usam cantos maiores (`0.5rem`, `0.75rem`, `1.5rem`, `2rem`)

### Regra para trabalho novo

- prefira raios curtos em controles
- botoes e acoes do board hoje usam com frequencia `0.55rem` a `0.65rem`
- use `0.5rem` a `0.75rem` para cards e blocos do kanban
- use raios maiores apenas em shells amplos ja alinhados com telas legadas, como auth e alguns paineis administrativos

### Bordas

O sistema usa bordas finas e translucidas:

- padrao: `border-[var(--border)]`
- hover contextual no card do kanban: borda branca
- card do kanban em repouso: borda transparente para parecer chapado
- drag no kanban: borda azul `#669DF1` aplicada na coluna

### Sombras

A sombra padrao do projeto e `surface-shadow`:

```css
box-shadow:
  0 1px 1px rgba(15, 23, 42, 0.03),
  0 20px 40px -24px var(--shadow-color);
```

Ela existe para separar camadas com delicadeza. Nao use sombras densas ou com espalhamento pesado como linguagem principal.

## 6. Superficies e Backgrounds

### Pagina

O `body` usa `--page-background`, nao uma cor solida. O fundo deve parecer construido por:

- gradientes lineares suaves
- brilhos radiais discretos
- leve sensacao de profundidade

### Header

O header principal usa:

- `surface-shadow`
- `border-[var(--border)]`
- `background: var(--header-surface)`

Visualmente ele deve parecer uma faixa refinada e contida, nao uma navbar pesada.

### Paineis

Os paineis principais usam:

- `var(--panel-surface)` para blocos padrao
- `var(--panel-accent-surface)` quando o topo da area pede mais presenca visual
- `var(--card)` para modais e cartoes de conteudo

## 7. Componentes

### 7.1 Buttons

Base:

- altura padrao: `h-11`
- peso: `font-semibold`
- raio frequente: `0.6rem`
- foco com `ring-2`

Variantes atuais:

- `default`: fundo `primary`, texto `primary-foreground`
- `secondary`: fundo `secondary`
- `outline`: borda `border`, fundo `input-surface`
- `ghost`: transparente com hover em `subtle-surface`
- `danger`: fundo `danger`

No board, existe uma convencao adicional:

- CTA principal de modal pode usar azul `#669DF1`
- `outline` e `secondary` devem permanecer neutros, sem azul excessivo

Regra:

- CTA principal deve usar `default`
- acoes secundarias de barra ou filtro devem usar `outline` ou `secondary`
- acoes destrutivas devem ficar isoladas e obvias

### 7.2 Inputs

O input atual e solido e limpo:

- fundo `input-surface`
- borda `border`
- texto `foreground`
- placeholder em `muted-foreground`
- foco com `ring-2` em `ring`

Evite underlines, efeitos glow exagerados ou campos com contraste baixo.

### 7.3 Dialogs

Os modais usam:

- overlay escuro com blur leve
- container centralizado
- fundo `card`
- borda clara translucida
- raio medio
- botao de fechar pequeno, quadrado e discreto no topo direito

O modal deve parecer solido e legivel. Nao usar vidro forte, transparencia excessiva ou motion chamativo.

Nos modais do board:

- use `--board-dialog-surface`, `--board-dialog-input-surface` e `--board-dialog-border`
- evite caixas internas desnecessarias envolvendo o formulario
- priorize divisorias simples e campos diretos

### 7.4 Auth Card

A area de autenticacao segue uma linguagem um pouco mais hero:

- card central largo, com cantos grandes
- grid pattern no fundo
- glow radial superior
- olho editorial mais macio que o restante do sistema

Isso e intencional. A tela de auth pode ser mais acolhedora que o miolo operacional.

### 7.5 App Header

O header usa:

- marca curta `CRM`
- busca opcional no proprio header, integrada ao bloco da direita
- papel do usuario em texto curto
- avatar circular com iniciais
- menu compacto de conta e acoes
- tipografia pequena, precisa e com tracking alto na marca

O objetivo e parecer um cabecalho de aplicacao madura, nao de landing page.

## 8. Kanban

O kanban e a area com identidade mais especifica do produto.

### Estrutura

- header principal com busca integrada
- barra secundaria curta com nome da empresa a esquerda e `Configurar etapas` a direita
- colunas compactas
- cards funcionais, com informacao direta
- bastante espaco vertical livre no board

### Colunas

- fundo controlado por `--board-column-surface`
- borda discreta
- estado de arraste com borda ou ring azul `#669DF1`
- contador pequeno no header da coluna
- acao `Adicionar contato` inline no fim da coluna, discreta e sem cara de botao pesado

### Cards

- fundo controlado por `--board-card-surface`
- borda padrao igual ao fundo no repouso, para parecer invisivel
- hover com borda branca
- conteudo com nome, telefone, badges e acoes rapidas neutras

### Drag and drop

Comportamento visual correto:

- ao passar o mouse no card: borda branca
- ao iniciar o drag: o card deve responder quase de imediato, sem exigir espera perceptivel
- ao segurar e arrastar: o card original some da coluna
- a coluna sob o drag recebe destaque azul
- o preview arrastado mantem o layout do proprio card
- o preview arrastado inclina levemente em torno de `5deg`, em vez de virar um bloco simplificado
- a reordenacao deve funcionar tanto dentro da mesma coluna quanto ao trazer um card de outra coluna para entre cards existentes

### Criacao e edicao de contato

- `Adicionar contato` abre o modal ja com a etapa da coluna preselecionada
- o usuario ainda pode trocar a etapa manualmente antes de salvar
- o modal de novo contato e o modal de contato aberto devem compartilhar a mesma linguagem visual do board

### Motion

O projeto usa motion curto e funcional. No kanban, a animacao customizada atual e:

- `kanban-card-tilt`

Ela deve ser breve e servir so para reforcar a sensacao de arraste.

## 9. Espacamento e Densidade

O sistema nao e ultra-compacto, mas tambem nao e espacoso como marketing site.

Padrao atual:

- controles: densidade media
- cards: padding enxuto
- paineis: respiro consistente
- headers e labels: compactos

Regras:

- use `gap-2`, `gap-3`, `gap-4` como base
- reserve espacamentos grandes para shells e telas de auth
- no kanban, priorize leitura rapida e alinhamento limpo

## 10. Do's e Don'ts

### Do

- use os tokens CSS existentes antes de criar novas cores
- preserve o contraste calmo do tema claro
- preserve o fundo mais imersivo do board no tema dark
- mantenha labels curtas, caixa alta e tracking quando fizer sentido
- use hover, foco e drag como estados funcionais, nao decorativos

### Don't

- nao volte para o modelo editorial preto ou dourado do documento antigo
- nao use roxo como acento principal
- nao use glassmorphism pesado
- nao use bordas grossas ou outlines agressivos fora de drag ou focus
- nao simplifique demais o card arrastado no kanban
- nao misture estilos de botao sem necessidade

## 11. Nota sobre o estado atual do projeto

O design do projeto ja tem uma base tokenizada consistente, mas ainda convive com partes legadas:

- alguns shells usam raios grandes
- alguns paineis antigos ainda usam `border-white/60`
- o kanban ja esta mais alinhado ao sistema novo de tokens
- a tela de usuarios ja usa o mesmo header e o mesmo fundo do board no contexto atual

Ao evoluir o produto:

- trate `globals.css` como fonte de verdade dos tokens
- alinhe componentes novos ao padrao tokenizado
- use o kanban, o header e os componentes `ui/` como referencia principal
- quando houver duvida entre azul neutro global e azul de board, preserve o azul `#669DF1` apenas no fluxo do kanban
