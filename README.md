# UFRGS - Vestibular Scraper

Scraper para buscar todos os calouros do vestibular da UFRGS.

Este código foi testado para funcionar no "Listão" da UFRGS das edições de 2022 a 2025.
Não há garantias de que funcionará em edições futuras, pois é apenas um scraper e depende do layout do site, que pode ser alterado pela UFRGS a qualquer momento.

> **NOTA:** Uma versão anterior desse script funcionava para os anos entre 2016 e 2021, mas essa versão deixou de funcionar quando a UFRGS atualizou o formato do site.
> Você pode verificá-la olhando commits anteriores.

## Instalação

### Opção 1: Baixar executável (recomendado)

> **Requisito:** O executável precisa do Google Chrome ou Chromium instalado no sistema.

#### Linux

```bash
curl -L -o ufrgs-scraper https://github.com/rafaeelaudibert/UFRGS_scraper.js/releases/latest/download/ufrgs-scraper-linux
chmod +x ufrgs-scraper
./ufrgs-scraper --help
```

#### Windows (PowerShell)

```powershell
Invoke-WebRequest -Uri "https://github.com/rafaeelaudibert/UFRGS_scraper.js/releases/latest/download/ufrgs-scraper-windows.exe" -OutFile "ufrgs-scraper.exe"
.\ufrgs-scraper.exe --help
```

Ou baixe manualmente na [página de releases](https://github.com/rafaeelaudibert/UFRGS_scraper.js/releases/latest).

### Opção 2: Rodar via código-fonte

Você precisa ter o [Bun](https://bun.sh) instalado:

```bash
curl -fsSL https://bun.sh/install | bash
```

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/rafaeelaudibert/UFRGS_scraper.js.git
cd UFRGS_scraper.js
bun install
```

## Executando

### Via executável

```bash
./ufrgs-scraper --ano 2025       # Linux
.\ufrgs-scraper.exe --ano 2025   # Windows
```

### Via código-fonte

```bash
bun rodar --ano 2025
```

### Opções

| Flag        | Descrição                           |
| ----------- | ----------------------------------- |
| `--ano`     | Ano para buscar (padrão: ano atual) |
| `-s, --sim` | Pular confirmação                   |

### Exemplos

```bash
# Buscar ano atual (interativo)
./ufrgs-scraper

# Buscar ano específico
./ufrgs-scraper --ano 2024

# Pular confirmação (útil para CI/scripts)
./ufrgs-scraper --ano 2025 --sim
./ufrgs-scraper -s
```

**Apenas 2022 e posteriores são suportados** — o scraper falhará para qualquer ano anterior a 2022.

> 💡 **Anos anteriores:** Para anos entre 2016 e 2021, verifique commits anteriores neste repositório.

> ⚠️ **Aviso:** O código apagará qualquer pasta chamada `./json` na raiz do projeto. Certifique-se de não ter dados importantes lá antes de executar.

## Entendendo os dados

Os dados gerados pelo código são bem fáceis de entender. Será gerada uma árvore de pastas assim:

```
./json
  |
  \- curso1
      |
      \- calouros.json
      \- calouros.txt
  |- curso2
  |- curso3
  |- curso4
```

\
Cada curso terá sua própria pasta contendo 2 arquivos: `calouros.json` e `calouros.txt`. O primeiro tem a seguinte estrutura:

```json
[
    {
        "name": "Nome do primeiro calouro",
        "semester": "Semestre do primeiro calouro (1º ou 2º)",
    },
    {
        "name": "Nome do segundo calouro",
        "semester": "Semestre do segundo calouro (1º ou 2º)",
    },
    {
        ...
    },
    ...
]
```

O segundo é um arquivo de texto simples contendo um nome de calouro por linha, _sem o semestre_, da seguinte forma:

```text
    Nome do primeiro calouro
    Nome do segundo calouro
    Nome do terceiro calouro
    ...
```

## Aviso Legal

Este programa não está associado à Universidade Federal do Rio Grande do Sul de nenhuma forma, e foi criado apenas para facilitar a busca dos calouros através do popular Listão do Vestibular.
