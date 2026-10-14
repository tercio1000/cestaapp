// ============================================
// CATEGORIAS
// ============================================
const CATEGORIAS = {
  frutas:     "🍎",
  verduras:   "🥬",
  carnes:     "🥩",
  laticinios: "🧀",
  padaria:    "🥖",
  bebidas:    "🥤",
  limpeza:    "🧼",
  higiene:    "🧴",
  outros:     "📦"
};

// ============================================
// CONSTANTES DE TEMA
// ============================================
const TEMA_CLARO  = "claro";
const TEMA_ESCURO = "escuro";

// ============================================
// ESTADO
// ============================================
let lista     = carregarLista();
let filtro    = "todos";
let temaAtual = localStorage.getItem("tema") || TEMA_CLARO;

// ============================================
// ELEMENTOS
// ============================================
const input           = document.getElementById("itemInput");
const selectCategoria = document.getElementById("categoriaSelect");
const listaEl         = document.getElementById("lista");
const vazioEl         = document.getElementById("vazio");
const tituloApp       = document.getElementById("tituloApp");

const badgeTotal     = document.getElementById("badgeTotal");
const badgeComprados = document.getElementById("badgeComprados");
const badgePendentes = document.getElementById("badgePendentes");

const btnAdicionar = document.getElementById("btnAdicionar");
const btnTodos     = document.getElementById("btnTodos");
const btnComprados = document.getElementById("btnComprados");
const btnPendentes = document.getElementById("btnPendentes");
const btnLimpar    = document.getElementById("btnLimpar");
const btnGravar    = document.getElementById("btnGravar");
const btnTema      = document.getElementById("btnTema");
const btnExportar  = document.getElementById("btnExportar");

// ============================================
// PERSISTÊNCIA
// ============================================
function carregarLista() {
  try {
    const dados = localStorage.getItem("listaCompras");
    return dados ? JSON.parse(dados) : [];
  } catch (e) {
    console.warn("Erro ao carregar lista:", e);
    return [];
  }
}

function salvarLista() {
  try {
    localStorage.setItem("listaCompras", JSON.stringify(lista));
  } catch (e) {
    console.warn("Não foi possível salvar:", e);
  }
}

// ============================================
// TEMA
// ============================================
function aplicarTema(tema) {
  document.documentElement.setAttribute("data-theme", tema);
  const icone = tema === TEMA_ESCURO ? "☀️" : "🌙";
  btnTema.querySelector(".icone-tema").textContent = icone;
  localStorage.setItem("tema", tema);
}

function alternarTema() {
  temaAtual = temaAtual === TEMA_ESCURO ? TEMA_CLARO : TEMA_ESCURO;
  aplicarTema(temaAtual);
}

if (!localStorage.getItem("tema")) {
  const prefereEscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
  temaAtual = prefereEscuro ? TEMA_ESCURO : TEMA_CLARO;
}
aplicarTema(temaAtual);

// ============================================
// TÍTULO DINÂMICO
// ============================================
function atualizarTitulo() {
  const total     = lista.length;
  const comprados = lista.filter(i => i.comprado).length;

  if (total > 0 && comprados === total) {
    tituloApp.textContent = "🎉 Tudo comprado!";
  } else {
    tituloApp.textContent = "🛒 Lista de Compras";
  }
}
// ============================================
// CONTADOR + PROGRESSO
// ============================================
function atualizarContador() {
  const total     = lista.length;
  const comprados = lista.filter(i => i.comprado).length;
  const pendentes = total - comprados;

  badgeTotal.textContent     = `${total} total`;
  badgeComprados.textContent = `${comprados} comprado${comprados === 1 ? "" : "s"}`;
  badgePendentes.textContent = `${pendentes} pendente${pendentes === 1 ? "" : "s"}`;

  const pct = total === 0 ? 0 : Math.round((comprados / total) * 100);
  document.getElementById("progressoBarra").style.width = pct + "%";
  document.getElementById("progresso").setAttribute("aria-valuenow", pct);

  atualizarTitulo();
}

// ============================================
// RENDERIZAÇÃO
// ============================================
function renderizarLista() {
  listaEl.innerHTML = "";

  let itensFiltrados = lista;
  if (filtro === "comprados") {
    itensFiltrados = lista.filter(i => i.comprado);
  } else if (filtro === "pendentes") {
    itensFiltrados = lista.filter(i => !i.comprado);
  }

  vazioEl.classList.toggle("visivel", itensFiltrados.length === 0);

  itensFiltrados.forEach(item => {
    listaEl.appendChild(criarElementoItem(item));
  });

  atualizarContador();
}

function criarElementoItem(item) {
  const li = document.createElement("li");
  li.dataset.id = item.id;
  li.draggable = true;

  const handle = document.createElement("span");
  handle.className = "handle";
  handle.textContent = "⋮⋮";
  handle.setAttribute("aria-hidden", "true");

  const emoji = document.createElement("span");
  emoji.className = "categoria-emoji";
  emoji.textContent = CATEGORIAS[item.categoria] || "📦";
  emoji.setAttribute("aria-hidden", "true");

  const texto = document.createElement("span");
  texto.className = "texto-item";
  if (item.comprado) texto.classList.add("comprado");
  texto.textContent = item.nome;
  texto.contentEditable = "false";
  texto.spellcheck = false;

  const acoes = document.createElement("div");
  acoes.className = "acoes";

  const btnEditar = document.createElement("button");
  btnEditar.className = "btn-editar";
  btnEditar.textContent = "✏️";
  btnEditar.title = "Editar";
  btnEditar.setAttribute("aria-label", "Editar item");
  btnEditar.addEventListener("click", () => ativarEdicao(texto, item));

  const btnComprado = document.createElement("button");
  btnComprado.className = "btn-comprado";
  btnComprado.setAttribute(
    "aria-label",
    item.comprado ? "Desmarcar item" : "Marcar como comprado"
  );
  btnComprado.textContent = item.comprado ? "↩" : "✓";
  btnComprado.title = item.comprado ? "Desmarcar" : "Marcar como comprado";
  btnComprado.addEventListener("click", () => alternarComprado(item.id));

  const btnRemover = document.createElement("button");
  btnRemover.className = "btn-remover";
  btnRemover.setAttribute("aria-label", "Remover item");
  btnRemover.textContent = "🗑";
  btnRemover.title = "Remover";
  btnRemover.addEventListener("click", () => removerItem(item.id));

  acoes.append(btnEditar, btnComprado, btnRemover);
  li.append(handle, emoji, texto, acoes);

  configurarDragAndDrop(li, item);

  return li;
}

// ============================================
// DRAG AND DROP
// ============================================
let idArrastando = null;

function configurarDragAndDrop(li, item) {
  li.addEventListener("dragstart", (e) => {
    idArrastando = item.id;
    li.classList.add("arrastando");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", item.id);
  });

  li.addEventListener("dragend", () => {
    li.classList.remove("arrastando");
    document.querySelectorAll(".sobre-drop")
      .forEach(el => el.classList.remove("sobre-drop"));
    idArrastando = null;
  });

  li.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (item.id === idArrastando) return;
    li.classList.add("sobre-drop");
  });

  li.addEventListener("dragleave", () => {
    li.classList.remove("sobre-drop");
  });

  li.addEventListener("drop", (e) => {
    e.preventDefault();
    li.classList.remove("sobre-drop");

    if (!idArrastando || idArrastando === item.id) return;

    const idxOrigem  = lista.findIndex(i => i.id === idArrastando);
    const idxDestino = lista.findIndex(i => i.id === item.id);
    if (idxOrigem === -1 || idxDestino === -1) return;

    const [movido] = lista.splice(idxOrigem, 1);
    lista.splice(idxDestino, 0, movido);

    salvarLista();
    renderizarLista();
  });
}
// ============================================
// EDIÇÃO INLINE
// ============================================
function ativarEdicao(textoEl, item) {
  if (textoEl.contentEditable === "true") return;

  textoEl.contentEditable = "true";
  textoEl.classList.add("editando");
  textoEl.focus();

  const range = document.createRange();
  range.selectNodeContents(textoEl);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  function finalizarEdicao(salvar = true) {
    textoEl.contentEditable = "false";
    textoEl.classList.remove("editando");

    const novoNome = textoEl.textContent.trim();

    if (salvar && novoNome && novoNome !== item.nome) {
      item.nome = novoNome;
      salvarLista();
    }

    renderizarLista();
  }

  textoEl.addEventListener("blur", () => finalizarEdicao(true), { once: true });

  textoEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      textoEl.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      textoEl.textContent = item.nome;
      textoEl.blur();
    }
  });
}

// ============================================
// AÇÕES
// ============================================
function adicionarItem() {
  const nome = input.value.trim();
  if (!nome) {
    input.focus();
    return;
  }

  const categoria = selectCategoria.value || "outros";

  lista.push({
    id: crypto.randomUUID(),
    nome,
    categoria,
    comprado: false
  });

  input.value = "";
  input.focus();
  salvarLista();

  if (filtro === "comprados") definirFiltro("todos");
  else renderizarLista();
}

function alternarComprado(id) {
  const item = lista.find(i => i.id === id);
  if (!item) return;

  item.comprado = !item.comprado;
  salvarLista();
  renderizarLista();

  if (item.comprado) {
    const li = listaEl.querySelector(`li[data-id="${id}"]`);
    if (li) {
      li.classList.add("recem-comprado");
      setTimeout(() => li.classList.remove("recem-comprado"), 400);
    }
    lancarConfete();
  }
}

function removerItem(id) {
  const li = listaEl.querySelector(`li[data-id="${id}"]`);
  if (!li) {
    lista = lista.filter(i => i.id !== id);
    salvarLista();
    renderizarLista();
    return;
  }

  li.classList.add("removendo");
  setTimeout(() => {
    lista = lista.filter(i => i.id !== id);
    salvarLista();
    renderizarLista();
  }, 500);
}

function limparComprados() {
  const restantes = lista.filter(i => !i.comprado);
  if (restantes.length === lista.length) return;
  lista = restantes;
  salvarLista();
  renderizarLista();
}

// ============================================
// FILTROS
// ============================================
function definirFiltro(novoFiltro) {
  filtro = novoFiltro;

  const mapaBotoes = {
    todos:     btnTodos,
    comprados: btnComprados,
    pendentes: btnPendentes
  };

  Object.entries(mapaBotoes).forEach(([nome, botao]) => {
    const ativo = nome === novoFiltro;
    botao.classList.toggle("ativo", ativo);
    botao.setAttribute("aria-selected", ativo ? "true" : "false");
  });

  renderizarLista();
}
// ============================================
// RECONHECIMENTO DE VOZ
// ============================================
let recognition;

function iniciarGravacaoVoz() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Seu navegador não suporta reconhecimento de voz 😢");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "pt-BR";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => btnGravar.classList.add("gravando");
  recognition.onend   = () => btnGravar.classList.remove("gravando");
  recognition.onerror = () => btnGravar.classList.remove("gravando");

  recognition.onresult = (event) => {
    const texto = event.results[0][0].transcript;
    input.value = texto;
    input.focus();
  };

  recognition.start();
}

// ============================================
// EXPORTAR LISTA
// ============================================
function exportarLista() {
  if (lista.length === 0) {
    alert("A lista está vazia — nada para exportar!");
    return;
  }

  const linhas = lista.map(item => {
    const emoji = CATEGORIAS[item.categoria] || "📦";
    const check = item.comprado ? "[x]" : "[ ]";
    return `${check} ${emoji} ${item.nome}`;
  });

  const total     = lista.length;
  const comprados = lista.filter(i => i.comprado).length;

  const conteudo =
    `🛒 LISTA DE COMPRAS\n` +
    `Gerada em: ${new Date().toLocaleString("pt-BR")}\n` +
    `─────────────────────────────\n\n` +
    linhas.join("\n") +
    `\n\n─────────────────────────────\n` +
    `Total: ${total} | Comprados: ${comprados} | Pendentes: ${total - comprados}\n`;

  const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
  const url  = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `lista-compras-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// CONFETES
// ============================================
const canvas = document.getElementById("confete");
const ctx    = canvas.getContext("2d");
let particulas    = [];
let animacaoAtiva = false;

function ajustarCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
ajustarCanvas();
window.addEventListener("resize", ajustarCanvas);

function lancarConfete() {
  const cores = ["#6366f1", "#10b981", "#fbbf24", "#ef4444", "#ec4899"];
  const origens = [
    { x: 0, y: window.innerHeight, dir: 1 },
    { x: window.innerWidth, y: window.innerHeight, dir: -1 }
  ];

  origens.forEach(origem => {
    for (let i = 0; i < 50; i++) {
      particulas.push({
        x: origem.x,
        y: origem.y,
        vx: origem.dir * (Math.random() * 12 + 6),
        vy: -(Math.random() * 14 + 10),
        tamanho: Math.random() * 8 + 4,
        cor: cores[Math.floor(Math.random() * cores.length)],
        rotacao: Math.random() * Math.PI * 2,
        vRotacao: (Math.random() - 0.5) * 0.3,
        vida: 1
      });
    }
  });

  if (!animacaoAtiva) {
    animacaoAtiva = true;
    requestAnimationFrame(animarConfete);
  }
}

function animarConfete() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particulas.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.35;
    p.vx *= 0.99;
    p.rotacao += p.vRotacao;
    p.vida -= 0.012;

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.vida);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotacao);
    ctx.fillStyle = p.cor;
    ctx.fillRect(-p.tamanho / 2, -p.tamanho / 2, p.tamanho, p.tamanho);
    ctx.restore();
  });

  particulas = particulas.filter(p => p.vida > 0 && p.y < canvas.height + 50);

  if (particulas.length > 0) {
    requestAnimationFrame(animarConfete);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    animacaoAtiva = false;
  }
}

// ============================================
// EVENTOS
// ============================================
btnAdicionar.addEventListener("click", adicionarItem);
btnTodos.addEventListener("click",     () => definirFiltro("todos"));
btnComprados.addEventListener("click", () => definirFiltro("comprados"));
btnPendentes.addEventListener("click", () => definirFiltro("pendentes"));
btnLimpar.addEventListener("click",    limparComprados);
btnGravar.addEventListener("click",    iniciarGravacaoVoz);
btnTema.addEventListener("click",      alternarTema);
btnExportar.addEventListener("click",  exportarLista);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") adicionarItem();
});

// ============================================
// INIT
// ============================================
renderizarLista();
input.focus();

// ============================================
// BANNER DE INSTALAÇÃO PWA
// ============================================

const bannerInstalar = document.getElementById("bannerInstalar");
const btnInstalarPWA = document.getElementById("btnInstalar");
const btnFecharBanner = document.getElementById("btnFecharBanner");

let eventoInstalacao = null;

// Verifica se já foi dispensado nos últimos 7 dias
function jaFoiDispensado() {
  const data = localStorage.getItem("pwaDispensado");
  if (!data) return false;
  const seteDias = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - parseInt(data) < seteDias;
}

// Detecta se já está instalado (standalone)
function jaEstaInstalado() {
  return window.matchMedia("(display-mode: standalone)").matches ||
         window.navigator.standalone === true;
}

// O Chrome dispara esse evento quando PWA é instalável
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  eventoInstalacao = event;
  
  if (!jaFoiDispensado() && !jaEstaInstalado() && bannerInstalar) {
    setTimeout(() => {
      bannerInstalar.hidden = false;
    }, 3000);
  }
});

// Clique no botão "Instalar"
if (btnInstalarPWA) {
  btnInstalarPWA.addEventListener("click", async () => {
    if (!eventoInstalacao) return;
    
    eventoInstalacao.prompt();
    const { outcome } = await eventoInstalacao.userChoice;
    
    if (outcome === "accepted") {
      console.log("PWA instalado pelo usuário");
    }
    
    eventoInstalacao = null;
    if (bannerInstalar) bannerInstalar.hidden = true;
  });
}

// Clique no botão fechar
if (btnFecharBanner) {
  btnFecharBanner.addEventListener("click", () => {
    if (bannerInstalar) bannerInstalar.hidden = true;
    localStorage.setItem("pwaDispensado", Date.now().toString());
  });
}

// Detecta quando é instalado
window.addEventListener("appinstalled", () => {
  console.log("PWA foi instalado");
  if (bannerInstalar) bannerInstalar.hidden = true;
});

// iOS: instrução manual (Safari não tem beforeinstallprompt)
function detectarIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

if (detectarIOS() && !jaEstaInstalado() && !jaFoiDispensado() && bannerInstalar) {
  const bannerTexto = bannerInstalar.querySelector(".banner-texto");
  if (bannerTexto) {
    bannerTexto.innerHTML = `
      <strong>Instalar o Cesta App</strong>
      <small>Toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong></small>
    `;
  }
  
  if (btnInstalarPWA) btnInstalarPWA.style.display = "none";
  
  setTimeout(() => {
    bannerInstalar.hidden = false;
  }, 3000);
}
