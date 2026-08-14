/* ============================================================
   Tang Ji — Lógica de la aplicación
   ============================================================ */

const STORAGE_KEY = "tangji_data_v1";

function cloneData(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.categories) && Array.isArray(parsed.points)) {
        if (!Array.isArray(parsed.diagrams)) {
          parsed.diagrams = cloneData(DEFAULT_DATA.diagrams);
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn("No se pudo leer la copia guardada, se usan los datos de ejemplo.", e);
  }
  return cloneData(DEFAULT_DATA);
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA));
}

let DATA = loadData();
let currentMeridianFilter = null;

/* ---------------- Utilidades de árbol ---------------- */

function uid(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

function isBranch(node) {
  return Array.isArray(node.children);
}

function countLeaves(node) {
  if (!isBranch(node)) return 1;
  return node.children.reduce((sum, c) => sum + countLeaves(c), 0);
}

function nodeMatches(node, q) {
  if (node.name.toLowerCase().includes(q)) return true;
  if (node.description && node.description.toLowerCase().includes(q)) return true;
  if (node.points) {
    for (const code of node.points) {
      const pt = DATA.points.find(p => p.code.toLowerCase() === code.toLowerCase());
      if (pt && (pt.code.toLowerCase().includes(q) || pt.name.toLowerCase().includes(q))) {
        return true;
      }
    }
  }
  if (isBranch(node)) {
    return node.children.some(c => nodeMatches(c, q));
  }
  return false;
}

function findPathByRef(nodes, target, path) {
  for (const n of nodes) {
    const nextPath = path.concat(n.name);
    if (n === target) return nextPath;
    if (isBranch(n)) {
      const found = findPathByRef(n.children, target, nextPath);
      if (found) return found;
    }
  }
  return null;
}

function removeNodeById(list, id) {
  const idx = list.findIndex(n => n.id === id);
  if (idx > -1) {
    list.splice(idx, 1);
    return true;
  }
  for (const n of list) {
    if (isBranch(n) && removeNodeById(n.children, id)) return true;
  }
  return false;
}

function findParentId(nodes, id) {
  for (const n of nodes) {
    if (isBranch(n)) {
      if (n.children.some(c => c.id === id)) return n.id;
      const deeper = findParentId(n.children, id);
      if (deeper !== null) return deeper;
    }
  }
  return null;
}

function collectIds(node) {
  let ids = [node.id];
  if (isBranch(node)) node.children.forEach(c => { ids = ids.concat(collectIds(c)); });
  return ids;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function highlight(text, q) {
  const safe = escapeHtml(text);
  if (!q) return safe;
  const idx = safe.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return safe;
  return safe.slice(0, idx) + "<mark>" + safe.slice(idx, idx + q.length) + "</mark>" + safe.slice(idx + q.length);
}

/* ---------------- Modo: por dolencia ---------------- */

const treeEl = document.getElementById("tree");
const searchDiseaseEl = document.getElementById("searchDisease");
const searchHintDiseaseEl = document.getElementById("searchHintDisease");
const diseaseDetailEl = document.getElementById("diseaseDetail");

function buildNodeEl(node, depth, query) {
  const el = document.createElement("div");
  el.className = "tree-node" + (isBranch(node) ? "" : " is-leaf");
  el.dataset.depth = depth;

  const branch = isBranch(node);
  const matched = !query || nodeMatches(node, query);
  if (!matched) el.classList.add("is-match-hidden");
  if (query && matched && branch) el.classList.add("is-open");

  const row = document.createElement("div");
  row.className = "node-row";

  const toggle = document.createElement("span");
  toggle.className = "node-toggle";
  toggle.textContent = "▸";
  row.appendChild(toggle);

  const label = document.createElement("span");
  label.className = "node-label";
  label.innerHTML = highlight(node.name, query);
  row.appendChild(label);

  if (branch) {
    const count = document.createElement("span");
    count.className = "node-count";
    const n = countLeaves(node);
    count.textContent = n + (n === 1 ? " dolencia" : " dolencias");
    row.appendChild(count);
  }

  const actions = document.createElement("span");
  actions.className = "node-actions admin-only";
  if (branch) {
    actions.innerHTML =
      '<button type="button" class="node-act" data-act="addcat" title="Añadir subcategoría aquí">📁+</button>' +
      '<button type="button" class="node-act" data-act="adddis" title="Añadir dolencia aquí">🩹+</button>' +
      '<button type="button" class="node-act" data-act="edit" title="Editar / mover">✎</button>' +
      '<button type="button" class="node-act" data-act="del" title="Eliminar">🗑</button>';
  } else {
    actions.innerHTML =
      '<button type="button" class="node-act" data-act="edit" title="Editar dolencia">✎</button>' +
      '<button type="button" class="node-act" data-act="del" title="Eliminar dolencia">🗑</button>';
  }
  actions.addEventListener("click", e => {
    e.stopPropagation();
    const act = e.target.closest(".node-act");
    if (!act) return;
    if (act.dataset.act === "addcat") startAddCategory(node.id);
    if (act.dataset.act === "adddis") startAddDisease(node.id);
    if (act.dataset.act === "edit") {
      if (branch) startEditCategory(node); else startEditDisease(node);
    }
    if (act.dataset.act === "del") {
      if (branch) deleteCategoryNode(node); else deleteDiseaseNode(node);
    }
  });
  row.appendChild(actions);

  el.appendChild(row);

  if (branch) {
    const childrenWrap = document.createElement("div");
    childrenWrap.className = "node-children";
    node.children.forEach(c => childrenWrap.appendChild(buildNodeEl(c, depth + 1, query)));
    el.appendChild(childrenWrap);

    row.addEventListener("click", () => {
      el.classList.toggle("is-open");
    });
  } else {
    row.addEventListener("click", () => {
      document.querySelectorAll("#tree .node-row.is-selected").forEach(r => r.classList.remove("is-selected"));
      row.classList.add("is-selected");
      renderDiseaseDetail(node);
    });
  }

  return el;
}

function renderTree(query) {
  treeEl.innerHTML = "";
  if (DATA.categories.length === 0) {
    treeEl.innerHTML = '<div class="empty-state"><p>Todavía no hay categorías. Usa "Editar" para añadir la primera.</p></div>';
    return;
  }
  DATA.categories.forEach(node => treeEl.appendChild(buildNodeEl(node, 0, query)));

  if (query) {
    const anyVisible = DATA.categories.some(n => !treeEl.querySelector ? true : nodeMatches(n, query));
    searchHintDiseaseEl.textContent = anyVisible
      ? 'Mostrando ramas que coinciden con "' + query + '".'
      : 'Sin resultados para "' + query + '". Prueba con otra palabra.';
  } else {
    searchHintDiseaseEl.textContent = "";
  }
}

function renderDiseaseDetail(node) {
  const path = findPathByRef(DATA.categories, node, []) || [node.name];
  const breadcrumb = path.slice(0, -1).join(" › ");

  let html = "";
  html += '<h3 class="detail-title">' + escapeHtml(node.name) + "</h3>";
  if (breadcrumb) html += '<p class="detail-path">' + escapeHtml(breadcrumb) + "</p>";
  if (node.description) html += '<p class="detail-desc">' + escapeHtml(node.description) + "</p>";

  html += '<p class="detail-section-label">Puntos relacionados</p>';
  html += '<div class="point-chip-list">';
  const codes = node.points || [];
  if (codes.length === 0) {
    html += '<span class="point-chip is-missing">Sin puntos asignados todavía</span>';
  } else {
    codes.forEach(code => {
      const pt = DATA.points.find(p => p.code.toLowerCase() === code.toLowerCase());
      if (pt) {
        html += '<button class="point-chip" data-code="' + escapeHtml(pt.code) + '">' + escapeHtml(pt.code) + "</button>";
      } else {
        html += '<span class="point-chip is-missing" title="Este punto aún no está en la ficha de puntos">' + escapeHtml(code) + "</span>";
      }
    });
  }
  html += "</div>";

  diseaseDetailEl.innerHTML = html;
  diseaseDetailEl.querySelectorAll(".point-chip[data-code]").forEach(btn => {
    btn.addEventListener("click", () => {
      switchMode("puntos");
      const pt = DATA.points.find(p => p.code === btn.dataset.code);
      if (pt) {
        searchPointEl.value = "";
        renderPointList("");
        renderPointDetail(pt);
        const row = pointListEl.querySelector('[data-code="' + pt.code + '"] .node-row');
        if (row) row.classList.add("is-selected");
      }
    });
  });
}

searchDiseaseEl.addEventListener("input", () => {
  renderTree(searchDiseaseEl.value.trim().toLowerCase());
});

/* ---------------- Modo: por punto ---------------- */

const pointListEl = document.getElementById("pointList");
const searchPointEl = document.getElementById("searchPoint");
const searchHintPointEl = document.getElementById("searchHintPoint");
const pointDetailEl = document.getElementById("pointDetail");

function pointMatches(pt, q) {
  return (
    pt.code.toLowerCase().includes(q) ||
    pt.name.toLowerCase().includes(q) ||
    pt.meridian.toLowerCase().includes(q) ||
    (pt.indications && pt.indications.toLowerCase().includes(q))
  );
}

function renderPointList(query, filterMeridian, containerOverride) {
  const container = containerOverride || pointListEl;
  container.innerHTML = "";
  let points = DATA.points.slice().sort((a, b) => a.code.localeCompare(b.code));
  if (filterMeridian) points = points.filter(p => p.meridian === filterMeridian);
  if (query) points = points.filter(p => pointMatches(p, query));

  if (points.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No hay puntos que coincidan.</p></div>';
  }

  points.forEach(pt => {
    const el = document.createElement("div");
    el.className = "tree-node is-leaf";
    el.dataset.code = pt.code;
    const row = document.createElement("div");
    row.className = "node-row";
    row.innerHTML =
      '<span class="node-toggle"></span><span class="node-label">' +
      "<strong>" + highlight(pt.code, query) + "</strong> · " + highlight(pt.name, query) +
      '</span><span class="node-count">' + escapeHtml(pt.meridian) + "</span>" +
      '<span class="node-actions admin-only">' +
      '<button type="button" class="node-act" data-act="edit" title="Editar punto">✎</button>' +
      '<button type="button" class="node-act" data-act="del" title="Eliminar punto">🗑</button>' +
      "</span>";
    row.querySelector(".node-actions").addEventListener("click", e => {
      e.stopPropagation();
      const act = e.target.closest(".node-act");
      if (!act) return;
      if (act.dataset.act === "edit") startEditPoint(pt);
      if (act.dataset.act === "del") deletePointEntry(pt);
    });
    row.addEventListener("click", () => {
      container.querySelectorAll(".node-row.is-selected").forEach(r => r.classList.remove("is-selected"));
      row.classList.add("is-selected");
      renderPointDetail(pt);
    });
    el.appendChild(row);
    container.appendChild(el);
  });

  if (container === pointListEl) {
    searchHintPointEl.textContent = query && points.length === 0
      ? 'Sin resultados para "' + query + '".'
      : "";
  }
}

function findDiseasesUsingPoint(code) {
  const results = [];
  function walk(nodes, path) {
    nodes.forEach(n => {
      const nextPath = path.concat(n.name);
      if (isBranch(n)) {
        walk(n.children, nextPath);
      } else if (n.points && n.points.some(c => c.toLowerCase() === code.toLowerCase())) {
        results.push({ node: n, path: nextPath.slice(0, -1).join(" › ") });
      }
    });
  }
  walk(DATA.categories, []);
  return results;
}

function renderPointDetail(pt) {
  let html = "";
  html += '<div class="point-detail-code"><span class="code">' + escapeHtml(pt.code) + "</span></div>";
  html += "<h3 class=\"detail-title\" style=\"margin-top:0\">" + escapeHtml(pt.name) + "</h3>";
  html += '<span class="meridian-tag">' + escapeHtml(pt.meridian) + "</span>";

  const fields = [
    ["Ubicación", pt.location],
    ["Indicaciones", pt.indications],
    ["Técnica", pt.technique]
  ];
  fields.forEach(([label, value]) => {
    if (value) {
      html += '<div class="field-block"><h4>' + label + "</h4><p>" + escapeHtml(value) + "</p></div>";
    }
  });
  if (pt.cautions) {
    html += '<div class="field-block caution"><h4>Precauciones</h4><p>' + escapeHtml(pt.cautions) + "</p></div>";
  }

  const uses = findDiseasesUsingPoint(pt.code);
  html += '<p class="detail-section-label">Se usa para</p>';
  if (uses.length === 0) {
    html += '<p class="detail-desc" style="margin:0">Ninguna dolencia lo usa todavía.</p>';
  } else {
    html += '<ul class="used-in-list">';
    uses.forEach(u => {
      html += "<li>" + escapeHtml(u.node.name) + (u.path ? ' <span style="opacity:.6">— ' + escapeHtml(u.path) + "</span>" : "") + "</li>";
    });
    html += "</ul>";
  }

  html += '<div class="photo-gallery is-hidden" id="photoGallery">' +
    '<p class="detail-section-label">Fotos</p>' +
    '<div class="photo-grid" id="photoGrid"></div>' +
    "</div>";

  pointDetailEl.innerHTML = html;
  renderPointPhotos(pt.code);
  pointDetailEl.querySelectorAll(".used-in-list li").forEach((li, i) => {
    li.addEventListener("click", () => {
      switchMode("enfermedades");
      searchDiseaseEl.value = "";
      renderTree("");
      renderDiseaseDetail(uses[i].node);
    });
  });
}

searchPointEl.addEventListener("input", () => {
  renderPointList(searchPointEl.value.trim().toLowerCase(), currentMeridianFilter);
});

/* ---------------- Fotos por punto (carpeta local, sin edición) ----------------
   Convención: images/points/<CÓDIGO>/1.jpg, 2.jpg, 3.jpg... (también valen
   .jpeg, .png, .webp). No hace falta registrar nada en el panel de edición:
   basta con crear la carpeta con el código exacto del punto (mayúsculas,
   tal cual aparece en su ficha) y arrastrar las fotos numeradas desde 1.
   El navegador no puede "listar" una carpeta por su cuenta en una web
   estática, así que se prueban los números del 1 al máximo y se muestran
   solo los que existan de verdad.
------------------------------------------------------------------- */

const PHOTO_MAX_PER_POINT = 12;
const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

function tryLoadPhoto(code, index, extIdx, gridEl, wrapperEl) {
  if (extIdx >= PHOTO_EXTENSIONS.length) return;
  const path = "images/points/" + encodeURIComponent(code) + "/" + index + "." + PHOTO_EXTENSIONS[extIdx];
  const img = new Image();
  img.onload = () => {
    wrapperEl.classList.remove("is-hidden");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "photo-thumb";
    const thumb = document.createElement("img");
    thumb.src = path;
    thumb.alt = code + " · foto " + index;
    thumb.loading = "lazy";
    btn.appendChild(thumb);
    btn.addEventListener("click", () => openLightbox(path, thumb.alt));
    gridEl.appendChild(btn);
  };
  img.onerror = () => {
    tryLoadPhoto(code, index, extIdx + 1, gridEl, wrapperEl);
  };
  img.src = path;
}

function renderPointPhotos(code) {
  const wrapperEl = document.getElementById("photoGallery");
  const gridEl = document.getElementById("photoGrid");
  if (!wrapperEl || !gridEl) return;
  gridEl.innerHTML = "";
  wrapperEl.classList.add("is-hidden");
  for (let i = 1; i <= PHOTO_MAX_PER_POINT; i++) {
    tryLoadPhoto(code, i, 0, gridEl, wrapperEl);
  }
}

const lightboxEl = document.getElementById("photoLightbox");
const lightboxImgEl = document.getElementById("lightboxImg");
const lightboxCloseEl = document.getElementById("lightboxClose");

function openLightbox(src, alt) {
  lightboxImgEl.src = src;
  lightboxImgEl.alt = alt || "";
  lightboxEl.classList.remove("is-hidden");
}
function closeLightbox() {
  lightboxEl.classList.add("is-hidden");
  lightboxImgEl.src = "";
}
lightboxCloseEl.addEventListener("click", closeLightbox);
lightboxEl.addEventListener("click", e => {
  if (e.target === lightboxEl) closeLightbox();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeLightbox();
});

/* ---------------- Modo: atlas ---------------- */

const meridianFilterEl = document.getElementById("meridianFilter");
const atlasListEl = document.getElementById("atlasList");

function renderMeridianFilter() {
  meridianFilterEl.innerHTML = "";
  const meridians = [...new Set(DATA.points.map(p => p.meridian))].sort();

  const allChip = document.createElement("button");
  allChip.className = "meridian-chip" + (currentMeridianFilter === null ? " is-active" : "");
  allChip.textContent = "Todos los meridianos";
  allChip.addEventListener("click", () => {
    currentMeridianFilter = null;
    renderMeridianFilter();
    renderPointList("", null, atlasListEl);
  });
  meridianFilterEl.appendChild(allChip);

  meridians.forEach(m => {
    const chip = document.createElement("button");
    chip.className = "meridian-chip" + (currentMeridianFilter === m ? " is-active" : "");
    chip.textContent = m;
    chip.addEventListener("click", () => {
      currentMeridianFilter = m;
      renderMeridianFilter();
      renderPointList("", m, atlasListEl);
    });
    meridianFilterEl.appendChild(chip);
  });
}

/* ---------------- Cambio de modo ---------------- */

const modeButtons = document.querySelectorAll(".mode-btn");
function switchMode(mode) {
  modeButtons.forEach(b => {
    const active = b.dataset.mode === mode;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", active ? "true" : "false");
  });
  document.querySelectorAll(".view").forEach(v => v.classList.add("is-hidden"));
  document.getElementById("view-" + mode).classList.remove("is-hidden");
}
modeButtons.forEach(b => b.addEventListener("click", () => switchMode(b.dataset.mode)));

/* ---------------- Autenticación (usuario / admin) ----------------
   Aviso honesto: esto es una valla de acceso a nivel de interfaz,
   no seguridad real de servidor. Al ser una web estática sin backend,
   cualquier persona con conocimientos técnicos podría saltársela
   desde las herramientas de desarrollador del navegador. Como los
   datos se guardan solo en el propio navegador de cada visitante
   (ver STORAGE_KEY más arriba), no hay ningún dato compartido real
   que proteger: como mucho, alguien tocaría su propia copia local.
------------------------------------------------------------------- */

const AUTH_KEY = "tangji_auth_v1";
const SESSION_KEY = "tangji_role";

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function ensureAuthInitialized() {
  if (!localStorage.getItem(AUTH_KEY)) {
    const passHash = await sha256Hex("1234");
    localStorage.setItem(AUTH_KEY, JSON.stringify({ username: "admin", passHash }));
  }
}

function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch (e) {
    return null;
  }
}

function isAdmin() {
  return sessionStorage.getItem(SESSION_KEY) === "admin";
}

function setAdminSession(on) {
  if (on) sessionStorage.setItem(SESSION_KEY, "admin");
  else sessionStorage.removeItem(SESSION_KEY);
  updateSessionUI();
}

function updateSessionUI() {
  const admin = isAdmin();
  document.body.classList.toggle("is-admin", admin);
  editToggle.classList.toggle("is-admin", admin);
  logoutBtn.classList.toggle("is-hidden", !admin);
}

/* ---------------- Panel de edición ---------------- */

const editToggle = document.getElementById("editToggle");
const logoutBtn = document.getElementById("logoutBtn");
const editOverlay = document.getElementById("editOverlay");
const closeEdit = document.getElementById("closeEdit");
const loginOverlay = document.getElementById("loginOverlay");
const closeLogin = document.getElementById("closeLogin");

function openEdit() {
  editOverlay.classList.remove("is-hidden");
  refreshParentSelects();
  const auth = getAuth();
  if (auth) document.getElementById("cuenta-user").value = auth.username;
}
function closeEditPanel() {
  editOverlay.classList.add("is-hidden");
}
function openLogin() {
  document.getElementById("login-note").textContent = "";
  document.getElementById("form-login").reset();
  loginOverlay.classList.remove("is-hidden");
  document.getElementById("login-user").focus();
}
function closeLoginPanel() {
  loginOverlay.classList.add("is-hidden");
}

editToggle.addEventListener("click", () => {
  if (isAdmin()) {
    openEdit();
  } else {
    openLogin();
  }
});
logoutBtn.addEventListener("click", () => {
  setAdminSession(false);
});
closeEdit.addEventListener("click", closeEditPanel);
closeLogin.addEventListener("click", closeLoginPanel);
editOverlay.addEventListener("click", e => {
  if (e.target === editOverlay) closeEditPanel();
});
loginOverlay.addEventListener("click", e => {
  if (e.target === loginOverlay) closeLoginPanel();
});

document.getElementById("form-login").addEventListener("submit", async e => {
  e.preventDefault();
  const user = document.getElementById("login-user").value.trim();
  const pass = document.getElementById("login-pass").value;
  const note = document.getElementById("login-note");

  await ensureAuthInitialized();
  const auth = getAuth();
  const passHash = await sha256Hex(pass);

  if (auth && user === auth.username && passHash === auth.passHash) {
    setAdminSession(true);
    closeLoginPanel();
    openEdit();
  } else {
    note.classList.add("is-error");
    note.textContent = "Usuario o contraseña incorrectos.";
  }
});

document.getElementById("form-cuenta").addEventListener("submit", async e => {
  e.preventDefault();
  const note = document.getElementById("cuenta-note");
  const user = document.getElementById("cuenta-user").value.trim();
  const pass = document.getElementById("cuenta-pass").value;
  const pass2 = document.getElementById("cuenta-pass2").value;

  if (pass !== pass2) {
    note.classList.add("is-error");
    note.textContent = "Las dos contraseñas no coinciden.";
    return;
  }
  if (!user || pass.length < 4) {
    note.classList.add("is-error");
    note.textContent = "El usuario no puede estar vacío y la contraseña debe tener al menos 4 caracteres.";
    return;
  }

  const passHash = await sha256Hex(pass);
  localStorage.setItem(AUTH_KEY, JSON.stringify({ username: user, passHash }));
  note.classList.remove("is-error");
  note.textContent = "✓ Credenciales actualizadas. Úsalas la próxima vez que inicies sesión.";
  document.getElementById("form-cuenta").reset();
  document.getElementById("cuenta-user").value = user;
});

document.querySelectorAll(".edit-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".edit-tab").forEach(t => t.classList.remove("is-active"));
    tab.classList.add("is-active");
    document.querySelectorAll(".edit-form").forEach(f => f.classList.add("is-hidden"));
    document.querySelector('[data-tabcontent="' + tab.dataset.tab + '"]').classList.remove("is-hidden");
  });
});

function flattenBranches(nodes, depth, prefix) {
  let out = [];
  nodes.forEach(n => {
    if (isBranch(n)) {
      out.push({ node: n, label: prefix + n.name, depth });
      out = out.concat(flattenBranches(n.children, depth + 1, prefix + "— "));
    }
  });
  return out;
}

function refreshParentSelects(excludeCatIds) {
  const exclude = excludeCatIds || [];
  const branches = flattenBranches(DATA.categories, 0, "").filter(b => !exclude.includes(b.node.id));

  const catParent = document.getElementById("cat-parent");
  catParent.innerHTML = '<option value="">— Nivel principal —</option>';
  branches.forEach(b => {
    const opt = document.createElement("option");
    opt.value = b.node.id;
    opt.textContent = b.label;
    catParent.appendChild(opt);
  });

  const dolParent = document.getElementById("dol-parent");
  dolParent.innerHTML = "";
  if (branches.length === 0) {
    dolParent.innerHTML = '<option value="">Crea antes una categoría</option>';
  } else {
    branches.forEach(b => {
      const opt = document.createElement("option");
      opt.value = b.node.id;
      opt.textContent = b.label;
      dolParent.appendChild(opt);
    });
  }
}

function findNodeById(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (isBranch(n)) {
      const found = findNodeById(n.children, id);
      if (found) return found;
    }
  }
  return null;
}

function refreshEverything() {
  renderTree(searchDiseaseEl.value.trim().toLowerCase());
  renderPointList(searchPointEl.value.trim().toLowerCase(), currentMeridianFilter);
  renderMeridianFilter();
  renderPointList("", currentMeridianFilter, atlasListEl);
  refreshParentSelects();
  if (typeof populateDiagramPointPicker === "function") populateDiagramPointPicker();
  if (typeof renderDiagramMarkers === "function") renderDiagramMarkers();
}

function switchEditTab(tabName) {
  const btn = document.querySelector('.edit-tab[data-tab="' + tabName + '"]');
  if (btn) btn.click();
}

/* ===================== CATEGORÍAS ===================== */

let editingCategoryId = null;

function resetCategoriaForm() {
  editingCategoryId = null;
  document.getElementById("cat-nombre").value = "";
  document.getElementById("cat-parent").value = "";
  document.getElementById("cat-submit").textContent = "Guardar categoría";
  document.getElementById("cat-cancel").classList.add("is-hidden");
  document.getElementById("cat-delete").classList.add("is-hidden");
  document.getElementById("cat-note").classList.remove("is-error");
  document.getElementById("cat-note").textContent = "";
}

function startAddCategory(parentId) {
  openEdit();
  switchEditTab("categoria");
  resetCategoriaForm();
  refreshParentSelects();
  if (parentId) document.getElementById("cat-parent").value = parentId;
  document.getElementById("cat-nombre").focus();
}

function startEditCategory(node) {
  openEdit();
  switchEditTab("categoria");
  editingCategoryId = node.id;
  refreshParentSelects(collectIds(node));
  document.getElementById("cat-parent").value = findParentId(DATA.categories, node.id) || "";
  document.getElementById("cat-nombre").value = node.name;
  document.getElementById("cat-submit").textContent = "Guardar cambios";
  document.getElementById("cat-cancel").classList.remove("is-hidden");
  document.getElementById("cat-delete").classList.remove("is-hidden");
  document.getElementById("cat-note").classList.remove("is-error");
  document.getElementById("cat-note").textContent = "";
}

function deleteCategoryNode(node) {
  const total = countLeaves(node);
  const hasContent = isBranch(node) && node.children.length > 0;
  const warning = hasContent
    ? "\n\nEsto también borrará todo lo que hay dentro (" + total + (total === 1 ? " dolencia" : " dolencias") + ")."
    : "";
  if (!confirm('¿Eliminar la categoría "' + node.name + '"?' + warning)) return;
  removeNodeById(DATA.categories, node.id);
  saveData();
  if (editingCategoryId === node.id) resetCategoriaForm();
  refreshEverything();
}

document.getElementById("cat-cancel").addEventListener("click", resetCategoriaForm);
document.getElementById("cat-delete").addEventListener("click", () => {
  const node = findNodeById(DATA.categories, editingCategoryId);
  if (node) deleteCategoryNode(node);
});

document.getElementById("form-categoria").addEventListener("submit", e => {
  e.preventDefault();
  const parentId = document.getElementById("cat-parent").value;
  const nameInput = document.getElementById("cat-nombre");
  const name = nameInput.value.trim();
  if (!name) return;
  const note = document.getElementById("cat-note");
  note.classList.remove("is-error");

  if (editingCategoryId) {
    const node = findNodeById(DATA.categories, editingCategoryId);
    if (!node) { resetCategoriaForm(); return; }
    node.name = name;
    const oldParentId = findParentId(DATA.categories, node.id);
    const newParentId = parentId || null;
    if (oldParentId !== newParentId) {
      removeNodeById(DATA.categories, node.id);
      if (newParentId) {
        const newParent = findNodeById(DATA.categories, newParentId);
        newParent.children.push(node);
      } else {
        DATA.categories.push(node);
      }
    }
    saveData();
    note.textContent = "✓ Cambios guardados.";
    resetCategoriaForm();
  } else {
    const newNode = { id: uid("cat"), name, children: [] };
    if (parentId) {
      const parent = findNodeById(DATA.categories, parentId);
      parent.children.push(newNode);
    } else {
      DATA.categories.push(newNode);
    }
    saveData();
    nameInput.value = "";
    note.textContent = "✓ Categoría guardada.";
  }
  refreshEverything();
});

/* ===================== DOLENCIAS ===================== */

let editingDiseaseId = null;

function resetDolenciaForm() {
  editingDiseaseId = null;
  document.getElementById("dol-nombre").value = "";
  document.getElementById("dol-desc").value = "";
  document.getElementById("dol-puntos").value = "";
  document.getElementById("dol-submit").textContent = "Guardar dolencia";
  document.getElementById("dol-cancel").classList.add("is-hidden");
  document.getElementById("dol-delete").classList.add("is-hidden");
  document.getElementById("dol-note").classList.remove("is-error");
  document.getElementById("dol-note").textContent = "";
}

function startAddDisease(parentId) {
  openEdit();
  switchEditTab("dolencia");
  resetDolenciaForm();
  refreshParentSelects();
  if (parentId) document.getElementById("dol-parent").value = parentId;
  document.getElementById("dol-nombre").focus();
}

function startEditDisease(node) {
  openEdit();
  switchEditTab("dolencia");
  editingDiseaseId = node.id;
  refreshParentSelects();
  document.getElementById("dol-parent").value = findParentId(DATA.categories, node.id) || "";
  document.getElementById("dol-nombre").value = node.name;
  document.getElementById("dol-desc").value = node.description || "";
  document.getElementById("dol-puntos").value = (node.points || []).join(", ");
  document.getElementById("dol-submit").textContent = "Guardar cambios";
  document.getElementById("dol-cancel").classList.remove("is-hidden");
  document.getElementById("dol-delete").classList.remove("is-hidden");
  document.getElementById("dol-note").classList.remove("is-error");
  document.getElementById("dol-note").textContent = "";
}

function deleteDiseaseNode(node) {
  if (!confirm('¿Eliminar la dolencia "' + node.name + '"?')) return;
  removeNodeById(DATA.categories, node.id);
  saveData();
  if (editingDiseaseId === node.id) resetDolenciaForm();
  refreshEverything();
}

document.getElementById("dol-cancel").addEventListener("click", resetDolenciaForm);
document.getElementById("dol-delete").addEventListener("click", () => {
  const node = findNodeById(DATA.categories, editingDiseaseId);
  if (node) deleteDiseaseNode(node);
});

document.getElementById("form-dolencia").addEventListener("submit", e => {
  e.preventDefault();
  const parentId = document.getElementById("dol-parent").value;
  const note = document.getElementById("dol-note");
  if (!parentId) {
    note.classList.add("is-error");
    note.textContent = "Primero crea una categoría.";
    return;
  }
  const nameInput = document.getElementById("dol-nombre");
  const name = nameInput.value.trim();
  if (!name) return;
  const desc = document.getElementById("dol-desc").value.trim();
  const pointsRaw = document.getElementById("dol-puntos").value.trim();
  const points = pointsRaw ? pointsRaw.split(",").map(s => s.trim().toUpperCase()).filter(Boolean) : [];
  note.classList.remove("is-error");

  if (editingDiseaseId) {
    const node = findNodeById(DATA.categories, editingDiseaseId);
    if (!node) { resetDolenciaForm(); return; }
    node.name = name;
    node.description = desc;
    node.points = points;
    const oldParentId = findParentId(DATA.categories, node.id);
    if (oldParentId !== parentId) {
      removeNodeById(DATA.categories, node.id);
      const newParent = findNodeById(DATA.categories, parentId);
      newParent.children.push(node);
    }
    saveData();
    note.textContent = "✓ Cambios guardados.";
    resetDolenciaForm();
  } else {
    const parent = findNodeById(DATA.categories, parentId);
    parent.children.push({ id: uid("dis"), name, description: desc, points });
    saveData();
    nameInput.value = "";
    document.getElementById("dol-desc").value = "";
    document.getElementById("dol-puntos").value = "";
    note.textContent = "✓ Dolencia guardada en \"" + parent.name + "\".";
  }
  refreshEverything();
});

/* ===================== PUNTOS ===================== */

let editingPointCode = null;
const PT_FIELD_IDS = ["pt-codigo", "pt-nombre", "pt-meridiano", "pt-ubicacion", "pt-indicaciones", "pt-tecnica", "pt-precauciones"];

function resetPuntoForm() {
  editingPointCode = null;
  PT_FIELD_IDS.forEach(id => { document.getElementById(id).value = ""; });
  document.getElementById("pt-codigo").disabled = false;
  document.getElementById("pt-submit").textContent = "Guardar punto";
  document.getElementById("pt-cancel").classList.add("is-hidden");
  document.getElementById("pt-delete").classList.add("is-hidden");
  document.getElementById("pt-note").classList.remove("is-error");
  document.getElementById("pt-note").textContent = "";
}

function startAddPoint() {
  openEdit();
  switchEditTab("punto");
  resetPuntoForm();
  document.getElementById("pt-codigo").focus();
}

function startEditPoint(pt) {
  openEdit();
  switchEditTab("punto");
  editingPointCode = pt.code;
  document.getElementById("pt-codigo").value = pt.code;
  document.getElementById("pt-nombre").value = pt.name;
  document.getElementById("pt-meridiano").value = pt.meridian;
  document.getElementById("pt-ubicacion").value = pt.location || "";
  document.getElementById("pt-indicaciones").value = pt.indications || "";
  document.getElementById("pt-tecnica").value = pt.technique || "";
  document.getElementById("pt-precauciones").value = pt.cautions || "";
  document.getElementById("pt-submit").textContent = "Guardar cambios";
  document.getElementById("pt-cancel").classList.remove("is-hidden");
  document.getElementById("pt-delete").classList.remove("is-hidden");
  document.getElementById("pt-note").classList.remove("is-error");
  document.getElementById("pt-note").textContent = "";
}

function renameCodeEverywhere(oldCode, newCode) {
  function walk(nodes) {
    nodes.forEach(n => {
      if (isBranch(n)) {
        walk(n.children);
      } else if (n.points) {
        n.points = n.points.map(c => (c.toUpperCase() === oldCode.toUpperCase() ? newCode : c));
      }
    });
  }
  walk(DATA.categories);
}

function deletePointEntry(pt) {
  const uses = findDiseasesUsingPoint(pt.code);
  const warning = uses.length > 0
    ? "\n\nSe usa en " + uses.length + (uses.length === 1 ? " dolencia" : " dolencias") + "; quedará marcado como \"sin añadir\" ahí."
    : "";
  if (!confirm('¿Eliminar el punto "' + pt.code + '"?' + warning)) return;
  DATA.points = DATA.points.filter(p => p.code !== pt.code);
  saveData();
  if (editingPointCode === pt.code) resetPuntoForm();
  refreshEverything();
}

document.getElementById("pt-cancel").addEventListener("click", resetPuntoForm);
document.getElementById("pt-delete").addEventListener("click", () => {
  const pt = DATA.points.find(p => p.code === editingPointCode);
  if (pt) deletePointEntry(pt);
});

document.getElementById("form-punto").addEventListener("submit", e => {
  e.preventDefault();
  const code = document.getElementById("pt-codigo").value.trim().toUpperCase();
  const name = document.getElementById("pt-nombre").value.trim();
  const meridian = document.getElementById("pt-meridiano").value.trim();
  if (!code || !name || !meridian) return;
  const note = document.getElementById("pt-note");
  note.classList.remove("is-error");

  const point = {
    code,
    name,
    meridian,
    location: document.getElementById("pt-ubicacion").value.trim(),
    indications: document.getElementById("pt-indicaciones").value.trim(),
    technique: document.getElementById("pt-tecnica").value.trim(),
    cautions: document.getElementById("pt-precauciones").value.trim()
  };

  if (editingPointCode) {
    const collision = DATA.points.find(p => p.code === code && p.code !== editingPointCode);
    if (collision) {
      note.classList.add("is-error");
      note.textContent = "Ya existe otro punto con el código \"" + code + "\".";
      return;
    }
    const oldCode = editingPointCode;
    DATA.points = DATA.points.filter(p => p.code !== oldCode);
    DATA.points.push(point);
    if (oldCode !== code) renameCodeEverywhere(oldCode, code);
    saveData();
    note.textContent = "✓ Cambios guardados.";
    resetPuntoForm();
  } else {
    const existingIndex = DATA.points.findIndex(p => p.code.toUpperCase() === code);
    if (existingIndex > -1) {
      DATA.points[existingIndex] = point;
      note.textContent = "✓ Punto \"" + code + "\" actualizado.";
    } else {
      DATA.points.push(point);
      note.textContent = "✓ Punto \"" + code + "\" añadido.";
    }
    saveData();
    PT_FIELD_IDS.forEach(id => { document.getElementById(id).value = ""; });
  }
  refreshEverything();
});

document.getElementById("addRootCatBtn").addEventListener("click", () => startAddCategory(null));
document.getElementById("addPointBtn").addEventListener("click", () => startAddPoint());


/* Copia de seguridad */
document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(DATA, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tangji-copia-seguridad-" + new Date().toISOString().slice(0, 10) + ".json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.points)) {
        throw new Error("Formato no reconocido");
      }
      if (!Array.isArray(parsed.diagrams)) {
        parsed.diagrams = cloneData(DEFAULT_DATA.diagrams);
      }
      DATA = parsed;
      saveData();
      refreshEverything();
      renderDiagramTabs();
      switchDiagram(currentDiagramId);
      document.getElementById("datos-note").classList.remove("is-error");
      document.getElementById("datos-note").textContent = "✓ Datos restaurados desde el archivo.";
    } catch (err) {
      document.getElementById("datos-note").classList.add("is-error");
      document.getElementById("datos-note").textContent = "No se pudo leer ese archivo. ¿Es una copia de seguridad válida?";
    }
  };
  reader.readAsText(file);
  e.target.value = "";
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("Esto borra todo lo añadido en este navegador y vuelve a los datos de ejemplo. ¿Seguro?")) return;
  localStorage.removeItem(STORAGE_KEY);
  DATA = cloneData(DEFAULT_DATA);
  currentMeridianFilter = null;
  refreshEverything();
  renderDiagramTabs();
  switchDiagram("front");
  document.getElementById("datos-note").classList.remove("is-error");
  document.getElementById("datos-note").textContent = "✓ Restaurado a los datos de ejemplo.";
});

/* ===================== ATLAS: DIAGRAMAS INTERACTIVOS ===================== */

let currentDiagramId = "front";
let diagramPlaceMode = false;

const diagramTabsEl = document.getElementById("diagramTabs");
const diagramCanvasEl = document.getElementById("diagramCanvas");
const diagramArtEl = document.getElementById("diagramArt");
const diagramMarkersEl = document.getElementById("diagramMarkers");
const diagramPointPickerEl = document.getElementById("diagramPointPicker");
const diagramPlaceModeBtn = document.getElementById("diagramPlaceModeBtn");
const diagramNoteEl = document.getElementById("diagramNote");

function getDiagram(id) {
  return DATA.diagrams.find(d => d.id === id);
}

function renderDiagramTabs() {
  diagramTabsEl.innerHTML = "";
  DATA.diagrams.forEach(d => {
    const btn = document.createElement("button");
    btn.className = "diagram-tab" + (d.id === currentDiagramId ? " is-active" : "");
    btn.textContent = d.label;
    btn.addEventListener("click", () => switchDiagram(d.id));
    diagramTabsEl.appendChild(btn);
  });
}

function switchDiagram(id) {
  currentDiagramId = id;
  renderDiagramTabs();
  diagramArtEl.innerHTML = (BODY_SILHOUETTE_SVG[id] || "").trim();
  renderDiagramMarkers();
}

function populateDiagramPointPicker() {
  const current = diagramPointPickerEl.value;
  const points = DATA.points.slice().sort((a, b) => a.code.localeCompare(b.code));
  diagramPointPickerEl.innerHTML = '<option value="">— Elige un punto —</option>';
  points.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.code;
    opt.textContent = p.code + " · " + p.name;
    diagramPointPickerEl.appendChild(opt);
  });
  if (points.some(p => p.code === current)) diagramPointPickerEl.value = current;
}

function renderDiagramMarkers() {
  diagramMarkersEl.innerHTML = "";
  const diagram = getDiagram(currentDiagramId);
  if (!diagram) return;
  diagram.markers.forEach(marker => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "diagram-marker";
    btn.style.left = marker.x + "%";
    btn.style.top = marker.y + "%";
    btn.title = marker.code;
    btn.addEventListener("click", e => {
      e.stopPropagation();
      handleMarkerClick(diagram, marker);
    });
    diagramMarkersEl.appendChild(btn);
  });
}

function handleMarkerClick(diagram, marker) {
  if (isAdmin() && diagramPlaceMode) {
    if (confirm('¿Quitar el marcador de "' + marker.code + '" de este diagrama?')) {
      diagram.markers = diagram.markers.filter(m => m !== marker);
      saveData();
      renderDiagramMarkers();
    }
    return;
  }
  const pt = DATA.points.find(p => p.code === marker.code);
  if (!pt) {
    alert('El punto "' + marker.code + '" ya no existe en la ficha de puntos.');
    return;
  }
  switchMode("puntos");
  searchPointEl.value = "";
  renderPointList("");
  renderPointDetail(pt);
  const row = pointListEl.querySelector('[data-code="' + pt.code + '"] .node-row');
  if (row) row.classList.add("is-selected");
}

diagramCanvasEl.addEventListener("click", e => {
  if (!isAdmin() || !diagramPlaceMode) return;
  if (e.target.closest(".diagram-marker")) return;

  const code = diagramPointPickerEl.value;
  if (!code) {
    diagramNoteEl.classList.add("is-error");
    diagramNoteEl.textContent = "Elige primero un punto en la lista de arriba.";
    return;
  }
  const rect = diagramMarkersEl.getBoundingClientRect();
  const clamp = v => Math.max(0, Math.min(100, v));
  const x = clamp(Math.round((((e.clientX - rect.left) / rect.width) * 100) * 10) / 10);
  const y = clamp(Math.round((((e.clientY - rect.top) / rect.height) * 100) * 10) / 10);

  const diagram = getDiagram(currentDiagramId);
  diagram.markers.push({ code, x, y });
  saveData();
  renderDiagramMarkers();
  diagramNoteEl.classList.remove("is-error");
  diagramNoteEl.textContent = "✓ Punto \"" + code + "\" colocado.";
});

diagramPlaceModeBtn.addEventListener("click", () => {
  diagramPlaceMode = !diagramPlaceMode;
  diagramPlaceModeBtn.classList.toggle("is-active", diagramPlaceMode);
  diagramPlaceModeBtn.textContent = diagramPlaceMode
    ? "🎯 Modo colocar puntos: activado"
    : "🎯 Modo colocar puntos: desactivado";
  diagramCanvasEl.classList.toggle("is-place-mode", diagramPlaceMode);
  diagramNoteEl.textContent = diagramPlaceMode
    ? "Elige un punto arriba y haz clic en el cuerpo para colocarlo. Clica un marcador ya puesto para quitarlo."
    : "";
  diagramNoteEl.classList.remove("is-error");
  if (diagramPlaceMode) populateDiagramPointPicker();
});

/* ---------------- Arranque ---------------- */

ensureAuthInitialized().then(updateSessionUI);
renderTree("");
renderPointList("");
renderMeridianFilter();
renderPointList("", null, atlasListEl);
renderDiagramTabs();
switchDiagram("front");
populateDiagramPointPicker();
