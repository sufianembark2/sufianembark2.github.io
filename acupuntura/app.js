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
      '</span><span class="node-count">' + escapeHtml(pt.meridian) + "</span>";
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

  pointDetailEl.innerHTML = html;
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

/* ---------------- Panel de edición ---------------- */

const editToggle = document.getElementById("editToggle");
const editOverlay = document.getElementById("editOverlay");
const closeEdit = document.getElementById("closeEdit");

function openEdit() {
  editOverlay.classList.remove("is-hidden");
  refreshParentSelects();
}
function closeEditPanel() {
  editOverlay.classList.add("is-hidden");
}
editToggle.addEventListener("click", openEdit);
closeEdit.addEventListener("click", closeEditPanel);
editOverlay.addEventListener("click", e => {
  if (e.target === editOverlay) closeEditPanel();
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

function refreshParentSelects() {
  const branches = flattenBranches(DATA.categories, 0, "");

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
}

/* Form: nueva categoría */
document.getElementById("form-categoria").addEventListener("submit", e => {
  e.preventDefault();
  const parentId = document.getElementById("cat-parent").value;
  const nameInput = document.getElementById("cat-nombre");
  const name = nameInput.value.trim();
  if (!name) return;

  const newNode = { id: uid("cat"), name, children: [] };
  if (parentId) {
    const parent = findNodeById(DATA.categories, parentId);
    parent.children.push(newNode);
  } else {
    DATA.categories.push(newNode);
  }
  saveData();
  nameInput.value = "";
  document.getElementById("cat-note").textContent = "✓ Categoría guardada.";
  refreshEverything();
});

/* Form: nueva dolencia */
document.getElementById("form-dolencia").addEventListener("submit", e => {
  e.preventDefault();
  const parentId = document.getElementById("dol-parent").value;
  if (!parentId) {
    document.getElementById("dol-note").textContent = "Primero crea una categoría.";
    document.getElementById("dol-note").classList.add("is-error");
    return;
  }
  const nameInput = document.getElementById("dol-nombre");
  const name = nameInput.value.trim();
  if (!name) return;
  const desc = document.getElementById("dol-desc").value.trim();
  const pointsRaw = document.getElementById("dol-puntos").value.trim();
  const points = pointsRaw ? pointsRaw.split(",").map(s => s.trim().toUpperCase()).filter(Boolean) : [];

  const parent = findNodeById(DATA.categories, parentId);
  parent.children.push({ id: uid("dis"), name, description: desc, points });
  saveData();

  nameInput.value = "";
  document.getElementById("dol-desc").value = "";
  document.getElementById("dol-puntos").value = "";
  document.getElementById("dol-note").classList.remove("is-error");
  document.getElementById("dol-note").textContent = "✓ Dolencia guardada en \"" + parent.name + "\".";
  refreshEverything();
});

/* Form: nuevo punto */
document.getElementById("form-punto").addEventListener("submit", e => {
  e.preventDefault();
  const code = document.getElementById("pt-codigo").value.trim().toUpperCase();
  const name = document.getElementById("pt-nombre").value.trim();
  const meridian = document.getElementById("pt-meridiano").value.trim();
  if (!code || !name || !meridian) return;

  const point = {
    code,
    name,
    meridian,
    location: document.getElementById("pt-ubicacion").value.trim(),
    indications: document.getElementById("pt-indicaciones").value.trim(),
    technique: document.getElementById("pt-tecnica").value.trim(),
    cautions: document.getElementById("pt-precauciones").value.trim()
  };

  const existingIndex = DATA.points.findIndex(p => p.code.toUpperCase() === code);
  const note = document.getElementById("pt-note");
  if (existingIndex > -1) {
    DATA.points[existingIndex] = point;
    note.textContent = "✓ Punto \"" + code + "\" actualizado.";
  } else {
    DATA.points.push(point);
    note.textContent = "✓ Punto \"" + code + "\" añadido.";
  }
  saveData();

  ["pt-codigo", "pt-nombre", "pt-meridiano", "pt-ubicacion", "pt-indicaciones", "pt-tecnica", "pt-precauciones"].forEach(id => {
    document.getElementById(id).value = "";
  });
  refreshEverything();
});

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
      DATA = parsed;
      saveData();
      refreshEverything();
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
  document.getElementById("datos-note").classList.remove("is-error");
  document.getElementById("datos-note").textContent = "✓ Restaurado a los datos de ejemplo.";
});

/* ---------------- Arranque ---------------- */

renderTree("");
renderPointList("");
renderMeridianFilter();
renderPointList("", null, atlasListEl);
