# NoMetro 🚇🇵🇹

> Aplicação web em tempo real do **Metro de Lisboa**, desenvolvida com foco em experiência mobile-first estilo iOS, tempos de espera em tempo real e visualização esquemática da rede.

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/project/89054694-c20d-4366-a3ab-a4c33528e4a4)
[![Online](https://img.shields.io/badge/Status-Online-success)](https://nometro-production.up.railway.app)

---

## 🌟 Funcionalidades

- ⏱ **Tempos de Espera em Tempo Real**: Dados em tempo real sincronizados com a API oficial do Metropolitano de Lisboa.
- 🎨 **Design Apple iOS & Fluent UI**: Interface limpa, cantos arredondados, tipografia de alta legibilidade e suporte dinâmico a modo escuro/claro.
- 📍 **Geolocalização Inteligente**: Encontra automaticamente a estação de metro mais próxima de si com cálculo de distância em metros/quilómetros.
- 🗺 **Rede Integrada**: Visualização esquemática e diagramas das 4 linhas (Azul, Amarela, Verde e Vermelha), com correspondências diretas para CP (Sintra, Cascais, Azambuja), Fertagus, Transtejo Soflusa e Carris.
- 🌐 **Bilingue**: Alternância instantânea entre Português e Inglês.
- 📱 **PWA Ready**: Instale diretamente no seu iPhone ou Android como um aplicativo nativo.

---

## 🚀 Como Executar Localmente

### 1. Clonar o repositório
```bash
git clone git@github.com:guilhermeurbn/NoMetro.git
cd NoMetro
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie um ficheiro `.env` baseado no `.env.example`:
```env
PORT=3000
METRO_API_TOKEN=seu_token_aqui
METRO_API_BASE=https://api.metrolisboa.pt:8243/estadoServicoML/1.0.1
```

### 4. Iniciar o servidor
```bash
npm start
```
Acesse em `http://localhost:3000`.

---

## 🌐 Produção

- **Railway App**: [https://nometro-production.up.railway.app](https://nometro-production.up.railway.app)
- **Domínio Oficial**: `https://nometro.pt`

---

## 📄 Licença
Distribuído sob a licença ISC.
