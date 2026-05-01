# Etapa 2 — Modularização segura do app-crono-operador

## Objetivo

Preparar a separação do `index.html` em arquivos externos sem alterar a aparência nem a lógica funcional do app.

## Status atual confirmado

O app funcional ainda está concentrado no `index.html`.

Arquivos auxiliares existentes:

- `styles.css`: existe, mas ainda não representa o CSS real do app.
- `app.js`: existe, mas ainda está praticamente vazio.
- `pwa-ui.js`: contém splash e registro do service worker.
- `sw.js`: já usa cache `crono-operador-v3.0.0`.
- `manifest.json`: já está configurado para Cronoanálise Operador.

## Regra de segurança

Nesta etapa, a lógica funcional do app não deve ser alterada.

Devem ser preservadas as funções:

- iniciar medição
- pausar medição
- zerar medição
- registrar lap de pessoa
- registrar lap de máquina
- registrar lap de processo/espera
- editar etapa manual
- alterar VA / NVA / BNVA
- alterar setup interno / externo
- gerar Gantt
- exportar PDF
- exportar PNG
- exportar CSV
- enviar WhatsApp
- abrir e fechar modais
- alternar tema claro/escuro

## Plano técnico para a modularização real

### 1. CSS

Extrair todo o conteúdo entre:

```html
<style>
```

e:

```html
</style>
```

para:

```txt
styles.css
```

No `index.html`, substituir o bloco por:

```html
<link rel="stylesheet" href="styles.css?v=3.0.0">
```

### 2. JavaScript principal

Extrair todo o JavaScript inline principal do final do `index.html` para:

```txt
app.js
```

No `index.html`, carregar no final do `body`:

```html
<script src="app.js?v=3.0.0" defer></script>
```

### 3. Tema

Extrair a lógica do botão `#op-theme-btn` para:

```txt
theme-init.js
```

Carregar no `head`:

```html
<script src="theme-init.js?v=3.0.0"></script>
```

### 4. PWA

Manter `pwa-ui.js` separado e carregar no final:

```html
<script src="pwa-ui.js?v=3.0.0" defer></script>
```

### 5. Não alterar ainda

Nesta etapa, não alterar:

- layout visual
- classes CSS
- IDs do HTML
- nomes das funções
- cálculos
- estrutura dos botões
- lógica de exportação

## Checklist de aprovação da Etapa 2

Após a extração real, validar:

- app abre no celular
- tema funciona
- iniciar / pausar / zerar funcionam
- laps funcionam
- histórico atualiza
- edição manual funciona
- exportações funcionam
- WhatsApp funciona
- aparência permanece igual ao estado anterior

## Observação importante

A extração do `index.html` deve ser feita com o conteúdo completo do arquivo. Não deve ser feita a partir de conteúdo truncado para evitar perda de funções ou quebra do app.
