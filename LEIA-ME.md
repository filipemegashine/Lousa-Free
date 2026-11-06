# Lousa Livre

Quadro branco colaborativo com tela infinita, tinta digital, notas adesivas, formas, mídia, componentes Loop e colaboração em tempo real. HTML/CSS/JS puro, sem dependências.

## Como abrir
- **Com colaboração entre dispositivos (recomendado):** clique duas vezes em `iniciar-servidor.cmd`. Ele abre `http://localhost:8080/` e mostra o endereço de rede (ex.: `http://192.168.0.10:8080/`) para outras pessoas na mesma rede.
  - Se aparecer só "neste computador", rode uma vez como administrador: `netsh http add urlacl url=http://+:8080/ user=Todos` (ou `user=Everyone`) e libere a porta no Firewall do Windows.
- **Sozinho:** abra `index.html` direto no navegador. Os quadros ficam salvos no navegador.

## Tela inicial
- **Explicações:** seus quadros e os compartilhados com você (abrir, criar, abrir arquivo, exportar, renomear, excluir). O botão Início no quadro volta para cá.
- **Questões:** quiz de Inglês no formato do ENEM, em três níveis (Fácil, Médio, Difícil). Uma questão por vez: escolha, toque em **Verificar** e veja se acertou, com explicação. Ao terminar ou tocar em **Parar quiz**, aparecem as certas e as erradas. Atalhos: 1–5 ou A–E para escolher, Enter para verificar/continuar.
- Fontes de questões (seletor no topo de *Questões*):
  - **Provas ENEM 2014–2025:** as 60 questões oficiais da opção Inglês (caderno Azul), com gabarito oficial do INEP, classificadas em 18 fáceis, 28 médias e 14 difíceis, cada uma com explicação. As imagens vêm do arquivo `Enem_Ingles_2014-2025.pdf`, que o app lê e guarda **só no aparelho**.
    - No servidor local, o PDF fica em `provas-local/enem.pdf` e é carregado sozinho.
    - Em outro aparelho (ou no GitHub Pages), toque em **Carregar PDF** uma vez. O PDF não vai para o pacote público, porque as provas contêm textos e imagens de terceiros.
    - O botão ⤢ abre a questão em tela cheia, no tamanho real (bom no celular).
  - **Questões extras:** 36 questões originais no mesmo formato, com tirinhas, cartazes e gráficos próprios.
  - **Todas:** as duas juntas.
- Também dá para importar outras questões em *Sobre as questões › Importar questões* (veja *Modelo de arquivo*).

## Usar no celular e trocar quadros entre aparelhos

**Abrir o app no celular**
- Com o PC ligado: rode `iniciar-servidor.cmd` e, no celular (mesmo Wi-Fi), abra o endereço “No celular” que aparece na janela. Em *Compartilhar*, o link já vem com esse endereço.
- Sem depender do PC: publique a pasta em qualquer hospedagem estática com https (GitHub Pages, Netlify, Cloudflare Pages). Com https, o celular pode **instalar** o app (“Adicionar à tela inicial”) e usá-lo **offline**.

**Levar um quadro do PC para o celular (e de volta)**
1. No PC: *Compartilhar › Baixar arquivo* (ou *Enviar…*). Sai um arquivo `Nome.lousa.json`.
2. Mande o arquivo como quiser (WhatsApp, e-mail, Drive, cabo).
3. No celular: *Quadros › Abrir arquivo* e escolha o arquivo › **Abrir**.
4. Edite no celular e use *Compartilhar › Enviar…* para devolver.
5. No PC: *Abrir arquivo* › **Mesclar alterações**. Itens novos entram, exclusões são aplicadas e, se o mesmo item foi editado nos dois aparelhos, fica a edição mais recente.

Notas:
- *Abrir como cópia* cria um quadro independente, sem vínculo com o original.
- Alguns celulares só enviam arquivos de texto pela folha de compartilhamento; nesse caso o app envia `Nome.lousa.txt`, que abre do mesmo jeito.
- Arquivos da primeira versão do app abrem normalmente. Itens criados por versões futuras aparecem como aviso e são preservados ao reexportar.
- Tudo que vem de arquivos e de colaboradores é validado: textos são limpos, e vídeos incorporados só vêm de YouTube, Vimeo ou Loom.
- No Chrome para Android, PDFs aparecem como um cartão com botão “Abrir PDF” (o navegador não mostra PDF dentro da página).

## Atalhos
| Ação | Atalho |
|---|---|
| Selecionar / Mão / Caneta / Marca-texto / Borracha | V / H / P / M / E |
| Nova nota / novo texto | N / T |
| Linha reta ao desenhar | segure **Shift** |
| Converter traço em forma (caneta/dedo) | desenhe e **segure** parado |
| Mover a tela | Espaço + arrastar, botão do meio, roda do mouse, dois dedos |
| Zoom | Ctrl + roda, pinça, Ctrl + / Ctrl − / Ctrl 0 (ajustar) |
| Desfazer / refazer | Ctrl+Z / Ctrl+Y |
| Copiar / colar / duplicar | Ctrl+C / Ctrl+V / Ctrl+D (cole imagens, links e textos direto) |
| Editar nota/texto/forma | clique de novo no item selecionado, ou Enter |
| Ignorar guias ao mover | segure Alt |

## Arquivos
- `index.html`, `css/style.css`, `js/*.js` — o app
- `server.ps1` — servidor de colaboração (PowerShell, já incluso no Windows); salva o estado das salas em `data/`
