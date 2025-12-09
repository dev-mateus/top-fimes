# 🎬 Top Filmes

Uma aplicação web para buscar filmes usando a API OMDb, construída com **HTML, CSS e JavaScript puro** (sem frameworks).

## ✨ Características

- 🔍 Busca de filmes em tempo real
- 🎯 Filmes populares na landing page
- 📱 Design responsivo e mobile-first
- ♿ Acessível (WCAG 2.1 AA)
- ⚡ Performance otimizada (Lighthouse 95+)
- 🔒 Service Worker para offline
- 📲 Instalável como app

## 🚀 Como Usar

### 1. Obter API Key

1. Visite [omdbapi.com](https://www.omdbapi.com/apikey.aspx)
2. Solicite uma chave gratuita
3. Você receberá um email com sua chave

### 2. Configurar Localmente

```bash
# 1. Edite scripts/config.js
# Substitua 'YOUR_API_KEY_HERE' por sua chave

# 2. Inicie um servidor local
python -m http.server 8000

# 3. Abra no navegador
# http://localhost:8000
```

### 3. Deploy no GitHub Pages

```bash
# 1. Configure git
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/top-fimes.git
git push -u origin main

# 2. No GitHub: Settings > Pages > Source: main branch
# Pronto! Seu site estará em: https://seu-usuario.github.io/top-fimes
```

## 📁 Estrutura

```
top-fimes/
├── index.html              # Página principal
├── styles/styles.css       # Estilos CSS
├── scripts/
│   ├── main.js            # App principal
│   ├── config.js          # Configurações
│   ├── api.js             # OMDb API
│   ├── ui.js              # Componentes UI
│   ├── modal.js           # Modal acessível
│   └── utils.js           # Utilitários
├── sw.js                  # Service Worker
├── manifest.json          # PWA manifest
└── assets/                # Imagens
```

## 🎮 Funcionalidades

✅ Busca de filmes  
✅ Paginação de resultados  
✅ Detalhes do filme em modal  
✅ Link para trailer (YouTube)  
✅ Cache inteligente (3 camadas)  
✅ Navegação por teclado  
✅ Dark mode  
✅ Offline com Service Worker  

## ⌨️ Teclado

- `Tab` - Navegar
- `Enter` - Buscar / Abrir detalhes
- `Esc` - Fechar modal

## 🔧 Tecnologias

- HTML5 Semântico
- CSS3 Mobile-first
- JavaScript ES Modules
- Fetch API
- Service Workers
- LocalStorage

## 📊 Performance

- Lighthouse Score: **95+** em todas categorias
- Tamanho: ~50KB (gzipped)
- Sem dependências externas
- Zero frameworks

## 🔐 Segurança

⚠️ **Importante:** Sua API key ficará visível no código. Para produção, considere:

1. Usar um backend para fazer proxy das requisições
2. Implementar rate limiting
3. Monitorar uso da chave

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+

## 📄 Licença

MIT

## 🤝 Contribuições

Sinta-se livre para fazer fork e enviar PRs!

---

**Desenvolvido com ❤️**
