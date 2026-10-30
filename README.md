# 🚀 PaoloOS 13

Um "sistema operacional" de aniversário que roda no navegador, no celular e no computador.
Feito com **HTML + CSS3 + JavaScript puro**: zero dependências, zero build.

🌐 Endereço: **https://paoloos.consuliam.com**

## Dois modos

- **Celular**: tela inicial com widgets e dock. Os apps abrem em telas empilhadas, e o voltar do celular fecha a tela do topo.
- **Computador**: área de trabalho com ícones, janelas que se arrastam, barra de tarefas e menu iniciar.

O modo é escolhido automaticamente. Para trocar na mão: menu iniciar → "📱 Versão celular", ou no fim da tela inicial → "🖥️ Ver versão desktop".

## Apps

| | App | O que faz |
|---|---|---|
| 🎂 | Carta | Mensagem digitada ao vivo, bolo com 13 velas (toque ou "sopre") e "Parabéns" tocado por código |
| ⏱️ | Paolômetro | Segundos de vida ao vivo, batidas do coração, km em volta do Sol, idade em Marte e Júpiter e próximos marcos |
| 🎉 | Festa! | Botão de confete, música e vibração |
| 🚀 | Rocket Lab | Monte o foguete (motor, nº de motores, combustível, estágios, carga) e lance. Dá pra chegar na Lua? |
| 🌙 | Eagle Lander | Pouse o módulo lunar com a gravidade real da Lua (1,62 m/s²) |
| 🔴 | Mars Rover | Dirija em Marte e colete amostras 💎 para recarregar a bateria |
| 🏎️ | Garagem | Monte o carro e dispute os 402 m contra o "GT do Iván", trocando de marcha |
| 🎮 | ESPBoy | Homenagem ao ESPBoy de verdade: Apollo 11, computador de bordo e nave 3D |
| 👾 | Pixel Maker | Sprites 16×16 na paleta PICO-8. Exporta em PNG ou como **código C RGB565** para telinhas TFT (TFT_eSPI) |
| ⌨️ | Terminal | Comandos (`help`, `parabens`, `idade`, `nasa`, `sudo`, `matrix`…) com atalhos tocáveis |
| 🎨 | Temas | 6 temas + 1 secreto |
| 🏆 | Conquistas | 20 conquistas e recordes salvos no aparelho |

🕹️ Segredo: o código Konami (⬆ ⬆ ⬇ ⬇ ⬅ ➡ ⬅ ➡ B A) desbloqueia o tema **Apollo Gold**. No celular ele é digitado no direcional do ESPBoy; no computador, no teclado.

## Personalizar

Tudo que é pessoal está no topo do `app.js`, no objeto `CONFIG`: nome, idade, data de nascimento (usada pelo Paolômetro), quem envia e a mensagem.

## Publicar no GitHub Pages com `paoloos.consuliam.com`

1. Envie **todos** os arquivos para a raiz da branch `main` de um repositório público:
   `index.html`, `style.css`, `app.js`, `manifest.webmanifest`, `icon.svg`, `CNAME`, `README.md`.
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `(root)` → Save**.
3. **Cloudflare → DNS → Add record**:

   | Type | Name | Target | Proxy |
   |---|---|---|---|
   | `CNAME` | `paoloos` | `SEU-USUARIO.github.io` | DNS only (nuvem cinza) |

4. O arquivo `CNAME` já contém `paoloos.consuliam.com`. Confira em **Settings → Pages → Custom domain** e espere o "DNS check successful".
5. Quando liberar, marque **Enforce HTTPS**. Depois disso, se quiser, pode ligar o proxy da Cloudflare (nuvem laranja) com SSL/TLS em **Full**.

## Testar localmente

```bash
python3 -m http.server 8000
# abra http://localhost:8000  (no celular: http://IP-DO-COMPUTADOR:8000, na mesma rede Wi-Fi)
```

---
Feito com 💙 para o Paolo, Mission Control Edition.
