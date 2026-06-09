const zhWeekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const enWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const defaultTemplates = {
  common: [
    { name: "方案制定", duration: 3, emphasis: "normal" },
    { name: "方案会议", duration: 1, emphasis: "bold" }
  ],
  amazonNpcImages: [
    { name: "3D/AI图片制作", duration: 4 },
    { name: "图片审核修改", duration: 2 },
    { name: "平面排版", duration: 2 },
    { name: "平面审核修改", duration: 2 },
    { name: "图片定稿", duration: 1, emphasis: "bold" }
  ],
  amazonVideo: [
    { name: "脚本修改", duration: 2 },
    { name: "脚本定稿", duration: 1, emphasis: "bold" },
    { name: "视频拍摄/分镜制作", duration: 4 },
    { name: "视频生成", duration: 3 },
    { name: "视频剪辑", duration: 3 },
    { name: "ACOPY", duration: 1 },
    { name: "审核修改", duration: 2 },
    { name: "BCOPY", duration: 1, emphasis: "bold" }
  ],
  tkImages: [
    { name: "图片制作", duration: 3 },
    { name: "平面排版", duration: 2 },
    { name: "审核修改", duration: 2 },
    { name: "图片交付", duration: 1, emphasis: "bold" }
  ],
  tkVideo: [
    { name: "脚本制作", duration: 2 },
    { name: "视频拍摄", duration: 2 },
    { name: "视频剪辑", duration: 3 },
    { name: "ACOPY", duration: 1 },
    { name: "审核修改", duration: 2 },
    { name: "BCOPY", duration: 1, emphasis: "bold" }
  ]
};

const defaultTypeOrder = ["amazonNpcImages", "amazonVideo", "tkImages", "tkVideo"];
const defaultTypeLabels = {
  amazonNpcImages: "AMAZON&NPC图片项目",
  amazonVideo: "AMAZON视频项目",
  tkImages: "TK图片项目",
  tkVideo: "TK视频项目"
};
const defaultTypeColors = {
  common: "#cfe0ff",
  amazonNpcImages: "#e6f0df",
  amazonVideo: "#fff2c9",
  tkImages: "#fbf0f0",
  tkVideo: "#f5c9a7"
};
const newTypeColors = ["#d8ecff", "#e8ddff", "#dff7ed", "#ffe3d6", "#f3e8c4"];
const storageKey = "online-timeline-template-v2";

let editingType = null;
let saveTimer = null;
let state = {
  timelineTitle: "时间表 Timeline",
  projectName: "616033书柜项目",
  deliveryDate: "",
  calendarStart: "2026-05-03",
  weekCount: 6,
  restMode: "double",
  holidayStart: "",
  holidayEnd: "",
  selectedTypes: ["amazonNpcImages", "amazonVideo"],
  typeOrder: [...defaultTypeOrder],
  typeLabels: { ...defaultTypeLabels },
  typeColors: { ...defaultTypeColors },
  typeStarts: {
    amazonNpcImages: "2026-05-07",
    amazonVideo: "2026-05-07",
    tkImages: "2026-05-07",
    tkVideo: "2026-05-07"
  },
  templates: clone(defaultTemplates)
};

const fields = {
  timelineTitle: document.querySelector("#timelineTitle"),
  projectName: document.querySelector("#projectName"),
  deliveryDate: document.querySelector("#deliveryDate"),
  calendarStart: document.querySelector("#calendarStart"),
  weekCount: document.querySelector("#weekCount"),
  restMode: document.querySelector("#restMode"),
  holidayStart: document.querySelector("#holidayStart"),
  holidayEnd: document.querySelector("#holidayEnd")
};

const typeList = document.querySelector("#typeList");
const timeline = document.querySelector("#timeline");
const itemCount = document.querySelector("#itemCount");
const selectedTypeCount = document.querySelector("#selectedTypeCount");
const summaryItemCount = document.querySelector("#summaryItemCount");
const summaryDelivery = document.querySelector("#summaryDelivery");
const summaryRules = document.querySelector("#summaryRules");
const saveStatus = document.querySelector("#saveStatus");
const appShell = document.querySelector(".app-shell");
const templatePage = document.querySelector("#templatePage");
const templateTitle = document.querySelector("#templateTitle");
const nodeList = document.querySelector("#nodeList");
const toast = document.querySelector("#toast");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function dateFromInput(value) {
  const [year, month, day] = String(value || "").split("-").map(Number);
  return new Date(year || 2026, (month || 1) - 1, day || 1);
}

function toInputDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function addDays(date, count) {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}

function monthDay(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function normalizeStartDate(value) {
  const date = dateFromInput(value);
  return addDays(date, -date.getDay());
}

function getTypeLabel(type) {
  return state.typeLabels[type] || defaultTypeLabels[type] || "未命名大类";
}

function getTypeColor(type) {
  return state.typeColors[type] || defaultTypeColors[type] || "#e6f0df";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

function isHoliday(date) {
  if (!state.holidayStart || !state.holidayEnd) return false;
  const start = dateFromInput(state.holidayStart);
  const end = dateFromInput(state.holidayEnd);
  const min = start < end ? start : end;
  const max = start < end ? end : start;
  return date >= min && date <= max;
}

function isRestDay(date) {
  const day = date.getDay();
  if (state.restMode === "double") return day === 0 || day === 6;
  if (state.restMode === "single") return day === 0;
  return false;
}

function isSchedulableDate(date) {
  return !isHoliday(date) && !isRestDay(date);
}

function nextSchedulableDate(date) {
  let cursor = new Date(date);
  while (!isSchedulableDate(cursor)) cursor = addDays(cursor, 1);
  return cursor;
}

function allocateTask(task, startDate, type) {
  const dates = [];
  let cursor = nextSchedulableDate(startDate);
  const duration = Math.max(1, Number(task.duration) || 1);
  while (dates.length < duration) {
    if (isSchedulableDate(cursor)) dates.push(toInputDate(cursor));
    cursor = addDays(cursor, 1);
  }
  return {
    item: {
      name: task.name,
      dates,
      duration,
      color: getTypeColor(type),
      emphasis: task.emphasis || "normal",
      type
    },
    nextStart: cursor
  };
}

function getCommonStart() {
  const starts = state.selectedTypes.map((type) => dateFromInput(state.typeStarts[type]));
  if (!starts.length) return nextSchedulableDate(dateFromInput(state.calendarStart));
  return nextSchedulableDate(new Date(Math.min(...starts.map((date) => date.getTime()))));
}

function getCommonEndExclusive() {
  let cursor = getCommonStart();
  state.templates.common.forEach((task) => {
    cursor = allocateTask(task, cursor, "common").nextStart;
  });
  return cursor;
}

function getBranchStart(type) {
  const requested = nextSchedulableDate(dateFromInput(state.typeStarts[type]));
  const commonEnd = getCommonEndExclusive();
  return requested > commonEnd ? requested : nextSchedulableDate(commonEnd);
}

function getTypeFinishDate(type) {
  if (!state.templates[type]?.length) return toInputDate(nextSchedulableDate(dateFromInput(state.typeStarts[type])));
  let cursor = getBranchStart(type);
  let lastDate = cursor;
  state.templates[type].forEach((task) => {
    const allocated = allocateTask(task, cursor, type);
    lastDate = dateFromInput(allocated.item.dates.at(-1));
    cursor = allocated.nextStart;
  });
  return toInputDate(lastDate);
}

function getAutoDeliveryDate() {
  const finishes = state.selectedTypes.map(getTypeFinishDate).filter(Boolean);
  if (!finishes.length) return "";
  return toInputDate(finishes.map(dateFromInput).reduce((max, date) => (date > max ? date : max)));
}

function buildItems() {
  const items = [];
  let commonCursor = getCommonStart();
  if (state.selectedTypes.length) {
    state.templates.common.forEach((task) => {
      const allocated = allocateTask(task, commonCursor, "common");
      items.push(allocated.item);
      commonCursor = allocated.nextStart;
    });
  }
  state.selectedTypes.forEach((type) => {
    let cursor = getBranchStart(type);
    (state.templates[type] || []).forEach((task) => {
      const allocated = allocateTask(task, cursor, type);
      items.push(allocated.item);
      cursor = allocated.nextStart;
    });
  });
  return items;
}

function getDays() {
  const start = normalizeStartDate(state.calendarStart);
  return Array.from({ length: state.weekCount * 7 }, (_, index) => addDays(start, index));
}

function itemOnDate(item, date) {
  return item.dates.includes(toInputDate(date));
}

function readForm() {
  state.timelineTitle = fields.timelineTitle.value.trim() || "时间表 Timeline";
  state.projectName = fields.projectName.value.trim() || "未命名项目";
  state.calendarStart = fields.calendarStart.value;
  state.weekCount = Math.max(2, Math.min(12, Number(fields.weekCount.value) || 6));
  state.restMode = fields.restMode.value;
  state.holidayStart = fields.holidayStart.value;
  state.holidayEnd = fields.holidayEnd.value;
  state.deliveryDate = getAutoDeliveryDate();
  fields.deliveryDate.value = state.deliveryDate;
  fields.weekCount.value = state.weekCount;
}

function save() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
    saveStatus.textContent = "已保存";
    saveStatus.classList.remove("dirty");
  }, 120);
}

function markDirty() {
  saveStatus.textContent = "正在保存...";
  saveStatus.classList.add("dirty");
}

function load() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    const cached = JSON.parse(raw);
    state = {
      ...state,
      ...cached,
      selectedTypes: Array.isArray(cached.selectedTypes) && cached.selectedTypes.length ? cached.selectedTypes : state.selectedTypes,
      typeOrder: Array.isArray(cached.typeOrder) && cached.typeOrder.length ? cached.typeOrder : state.typeOrder,
      typeLabels: { ...state.typeLabels, ...(cached.typeLabels || {}) },
      typeColors: { ...state.typeColors, ...(cached.typeColors || {}) },
      typeStarts: { ...state.typeStarts, ...(cached.typeStarts || {}) },
      templates: { ...clone(defaultTemplates), ...(cached.templates || {}) }
    };
    Object.entries(fields).forEach(([key, input]) => {
      input.value = state[key] || "";
    });
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function restModeLabel() {
  if (state.restMode === "double") return "双休";
  if (state.restMode === "single") return "单休";
  return "无休";
}

function renderSummary(items) {
  selectedTypeCount.textContent = `${state.selectedTypes.length} 类`;
  summaryItemCount.textContent = `${items.length} 项`;
  summaryDelivery.textContent = state.deliveryDate ? monthDay(dateFromInput(state.deliveryDate)) : "-";
  summaryRules.textContent = state.holidayStart && state.holidayEnd ? `${restModeLabel()} + 假期` : restModeLabel();
}

function renderTypes() {
  typeList.innerHTML = "";
  state.typeOrder.forEach((type) => {
    const selected = state.selectedTypes.includes(type);
    const row = document.createElement("article");
    row.className = "type-row";
    row.style.setProperty("--type-color", getTypeColor(type));
    row.innerHTML = `
      <label class="type-check">
        <input type="checkbox" data-type-check="${type}"${selected ? " checked" : ""} />
        <input class="type-name" data-type-name="${type}" value="${escapeAttr(getTypeLabel(type))}" aria-label="项目大类名称" />
      </label>
      <label class="color-field">显示颜色<input type="color" data-type-color="${type}" value="${getTypeColor(type)}" /></label>
      <label>启动时间<input type="date" data-type-start="${type}" value="${state.typeStarts[type] || state.calendarStart}" /></label>
      <label>完成时间<input type="date" value="${selected ? getTypeFinishDate(type) : ""}" readonly /></label>
      <button class="ghost-button" type="button" data-edit-template="${type}">自定义模板</button>
      <button class="delete-button" type="button" data-delete-type="${type}" title="删除大类" ${state.typeOrder.length <= 1 ? "disabled" : ""}>×</button>
    `;
    row.querySelector("[data-type-check]").addEventListener("change", (event) => {
      markDirty();
      state.selectedTypes = event.target.checked
        ? Array.from(new Set([...state.selectedTypes, type]))
        : state.selectedTypes.filter((candidate) => candidate !== type);
      if (!state.selectedTypes.length) state.selectedTypes = [type];
      render();
    });
    row.querySelector("[data-type-name]").addEventListener("input", (event) => {
      markDirty();
      state.typeLabels[type] = event.target.value.trim() || "未命名大类";
      renderTimeline();
      save();
    });
    row.querySelector("[data-type-color]").addEventListener("input", (event) => {
      markDirty();
      state.typeColors[type] = event.target.value;
      row.style.setProperty("--type-color", event.target.value);
      renderTimeline();
      save();
    });
    row.querySelector("[data-type-start]").addEventListener("change", (event) => {
      markDirty();
      state.typeStarts[type] = event.target.value;
      render();
    });
    row.querySelector("[data-edit-template]").addEventListener("click", () => openTemplate(type));
    row.querySelector("[data-delete-type]").addEventListener("click", () => deleteType(type));
    typeList.appendChild(row);
  });
}

function legendHtml() {
  return `<div class="legend-list">${state.selectedTypes.map((type) => `
    <span class="legend-item"><span class="legend-swatch" style="background:${getTypeColor(type)}"></span>${escapeHtml(getTypeLabel(type))}</span>
  `).join("")}</div>`;
}

function renderTimeline() {
  readForm();
  const days = getDays();
  const items = buildItems();
  itemCount.textContent = `${items.length} 个流程项`;
  const delivery = state.deliveryDate ? monthDay(dateFromInput(state.deliveryDate)) : "";

  const title = document.createElement("div");
  title.className = "timeline-title";
  title.innerHTML = `<div><div>${escapeHtml(state.timelineTitle)}</div><div>${escapeHtml(state.projectName)}项目交付时间：${delivery}</div></div>`;

  const projectRow = document.createElement("div");
  projectRow.className = "project-row";
  projectRow.innerHTML = `<div>项目名称&nbsp;&nbsp; Entry name--${escapeHtml(state.projectName)}</div><div>${legendHtml()}</div>`;

  const header = document.createElement("div");
  header.className = "week-header";
  zhWeekdays.forEach((label, index) => {
    const cell = document.createElement("div");
    cell.className = "weekday";
    cell.innerHTML = `${label}<br>${enWeekdays[index]}`;
    header.appendChild(cell);
  });

  const grid = document.createElement("div");
  grid.className = "calendar-grid";
  for (let week = 0; week < state.weekCount; week += 1) {
    days.slice(week * 7, week * 7 + 7).forEach((day) => {
      const cell = document.createElement("div");
      cell.className = "date-cell";
      cell.textContent = monthDay(day);
      grid.appendChild(cell);
    });

    days.slice(week * 7, week * 7 + 7).forEach((day) => {
      const cell = document.createElement("div");
      cell.className = isHoliday(day) ? "task-cell holiday-cell" : "task-cell";
      if (isHoliday(day)) {
        cell.innerHTML = `<div class="holiday-label">假期</div>`;
      } else if (!isRestDay(day)) {
        const stack = document.createElement("div");
        stack.className = "task-stack";
        items.filter((item) => itemOnDate(item, day)).forEach((item) => {
          const pill = document.createElement("div");
          pill.className = "task-pill";
          pill.style.background = item.color;
          pill.innerHTML = item.emphasis === "bold" ? `<strong>${escapeHtml(item.name)}</strong>` : escapeHtml(item.name);
          stack.appendChild(pill);
        });
        if (stack.children.length) cell.appendChild(stack);
      }
      grid.appendChild(cell);
    });
  }

  timeline.innerHTML = "";
  timeline.append(title, projectRow, header, grid);
  renderSummary(items);
  save();
}

function renderTemplate() {
  if (!editingType) return;
  templateTitle.textContent = `${editingType === "common" ? "共用环节" : getTypeLabel(editingType)}自定义模板`;
  nodeList.innerHTML = "";
  state.templates[editingType].forEach((node, index) => {
    const row = document.createElement("article");
    row.className = "node-row";
    row.draggable = true;
    row.innerHTML = `
      <div class="drag-handle" title="拖拽排序">↕</div>
      <label>节点名称<input data-node-name="${index}" value="${escapeAttr(node.name)}" /></label>
      <label>节点时间（天）<input data-node-duration="${index}" type="number" min="1" max="60" value="${node.duration}" /></label>
      <label>重点样式<select data-node-emphasis="${index}"><option value="normal"${(node.emphasis || "normal") === "normal" ? " selected" : ""}>普通</option><option value="bold"${node.emphasis === "bold" ? " selected" : ""}>加粗</option></select></label>
      <button class="delete-button" data-delete-node="${index}" type="button">×</button>
    `;
    row.querySelector("[data-node-name]").addEventListener("input", (event) => {
      markDirty();
      node.name = event.target.value.trim() || "未命名节点";
      renderTimeline();
      renderTypes();
    });
    row.querySelector("[data-node-duration]").addEventListener("input", (event) => {
      markDirty();
      node.duration = Math.max(1, Number(event.target.value) || 1);
      renderTimeline();
      renderTypes();
    });
    row.querySelector("[data-node-emphasis]").addEventListener("input", (event) => {
      markDirty();
      node.emphasis = event.target.value;
      renderTimeline();
    });
    row.querySelector("[data-delete-node]").addEventListener("click", () => {
      markDirty();
      state.templates[editingType].splice(index, 1);
      if (!state.templates[editingType].length) state.templates[editingType].push({ name: "新增节点", duration: 1, emphasis: "normal" });
      renderTemplate();
      render();
    });
    row.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", String(index));
      row.classList.add("dragging");
    });
    row.addEventListener("dragend", () => row.classList.remove("dragging"));
    row.addEventListener("dragover", (event) => {
      event.preventDefault();
      row.classList.add("drag-over");
    });
    row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      row.classList.remove("drag-over");
      const from = Number(event.dataTransfer.getData("text/plain"));
      const to = index;
      if (Number.isNaN(from) || from === to) return;
      markDirty();
      const [moved] = state.templates[editingType].splice(from, 1);
      state.templates[editingType].splice(to, 0, moved);
      renderTemplate();
      render();
    });
    nodeList.appendChild(row);
  });
}

function openTemplate(type) {
  editingType = type;
  appShell.hidden = true;
  templatePage.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderTemplate();
}

function closeTemplate() {
  editingType = null;
  templatePage.hidden = true;
  appShell.hidden = false;
  render();
}

function addType() {
  markDirty();
  const id = `customType${Date.now()}`;
  state.typeOrder.push(id);
  state.typeLabels[id] = "新增项目大类";
  state.typeColors[id] = newTypeColors[state.typeOrder.length % newTypeColors.length];
  state.typeStarts[id] = state.calendarStart || toInputDate(new Date());
  state.templates[id] = [{ name: "新增节点", duration: 1, emphasis: "normal" }];
  state.selectedTypes.push(id);
  render();
  showToast("已新增项目大类");
}

function deleteType(type) {
  if (state.typeOrder.length <= 1) {
    showToast("至少保留一个项目大类");
    return;
  }
  if (!confirm(`确认删除“${getTypeLabel(type)}”吗？对应模板也会一起删除。`)) return;
  markDirty();
  state.typeOrder = state.typeOrder.filter((item) => item !== type);
  state.selectedTypes = state.selectedTypes.filter((item) => item !== type);
  delete state.typeLabels[type];
  delete state.typeColors[type];
  delete state.typeStarts[type];
  delete state.templates[type];
  if (!state.selectedTypes.length) state.selectedTypes = [state.typeOrder[0]];
  render();
  showToast("项目大类已删除");
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, bold = false) {
  ctx.font = `${bold ? "700 " : ""}15px Microsoft YaHei, Arial`;
  const lines = [];
  let line = "";
  Array.from(text).forEach((char) => {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = test;
    }
  });
  lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((value, index) => ctx.fillText(value, x, startY + index * lineHeight));
}

function drawTaskStack(ctx, items, col, rowY, cellWidth, taskHeight) {
  const gap = 5;
  const padding = 7;
  const pillHeight = Math.max(22, Math.floor((taskHeight - padding * 2 - gap * (items.length - 1)) / Math.max(1, items.length)));
  items.forEach((item, index) => {
    const top = rowY + padding + index * (pillHeight + gap);
    const left = col * cellWidth + 8;
    const width = cellWidth - 14;
    ctx.fillStyle = item.color;
    ctx.fillRect(left, top, width, pillHeight);
    ctx.strokeStyle = "rgba(31, 41, 51, 0.22)";
    ctx.strokeRect(left, top, width, pillHeight);
    ctx.fillStyle = "#111";
    drawWrappedText(ctx, item.name, left + width / 2, top + pillHeight / 2, width - 10, 18, item.emphasis === "bold");
  });
}

function drawLegend(ctx, left, top, width, height) {
  const entries = state.selectedTypes.map((type) => ({ label: getTypeLabel(type), color: getTypeColor(type) }));
  const columns = entries.length > 2 ? 2 : entries.length || 1;
  const columnWidth = width / columns;
  const rowHeight = 18;
  const rows = Math.ceil(entries.length / columns);
  const startY = top + (height - rows * rowHeight) / 2 + rowHeight / 2;
  ctx.textAlign = "left";
  ctx.font = "700 13px Microsoft YaHei, Arial";
  entries.forEach((entry, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = left + col * columnWidth + 16;
    const y = startY + row * rowHeight;
    ctx.fillStyle = entry.color;
    ctx.fillRect(x, y - 6, 18, 12);
    ctx.strokeStyle = "rgba(31,41,51,.28)";
    ctx.strokeRect(x, y - 6, 18, 12);
    ctx.fillStyle = "#1f2933";
    ctx.fillText(entry.label, x + 26, y);
  });
  ctx.textAlign = "center";
}

function exportPng() {
  readForm();
  const cellWidth = 150;
  const titleHeight = 112;
  const projectHeight = 42;
  const headerHeight = 46;
  const dateHeight = 28;
  const taskHeight = 124;
  const width = cellWidth * 7 + 2;
  const height = titleHeight + projectHeight + headerHeight + state.weekCount * (dateHeight + taskHeight) + 2;
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "#2368ff";
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, width - 3, titleHeight - 3);
  ctx.fillStyle = "#1f2933";
  ctx.font = "700 20px Microsoft YaHei, Arial";
  const delivery = state.deliveryDate ? monthDay(dateFromInput(state.deliveryDate)) : "";
  ctx.fillText(state.timelineTitle, width / 2, 48);
  ctx.fillText(`${state.projectName}项目交付时间：${delivery}`, width / 2, 76);

  let y = titleHeight;
  ctx.strokeStyle = "#1f2933";
  ctx.lineWidth = 1;
  ctx.strokeRect(1, y, width - 2, projectHeight);
  ctx.beginPath();
  ctx.moveTo(cellWidth * 4, y);
  ctx.lineTo(cellWidth * 4, y + projectHeight);
  ctx.stroke();
  ctx.font = "700 16px Microsoft YaHei, Arial";
  ctx.textAlign = "left";
  ctx.fillText(`项目名称  Entry name--${state.projectName}`, 8, y + projectHeight / 2);
  drawLegend(ctx, cellWidth * 4, y, cellWidth * 3, projectHeight);

  y += projectHeight;
  for (let index = 0; index < 7; index += 1) {
    ctx.fillStyle = "#f26f1f";
    ctx.fillRect(index * cellWidth + 1, y, cellWidth, headerHeight);
    ctx.strokeRect(index * cellWidth + 1, y, cellWidth, headerHeight);
    ctx.fillStyle = "#fff";
    ctx.font = "700 18px Microsoft YaHei, Arial";
    ctx.fillText(zhWeekdays[index], index * cellWidth + cellWidth / 2, y + 16);
    ctx.fillText(enWeekdays[index], index * cellWidth + cellWidth / 2, y + 34);
  }

  y += headerHeight;
  const days = getDays();
  const items = buildItems();
  days.forEach((day, index) => {
    const week = Math.floor(index / 7);
    const col = index % 7;
    const rowY = y + week * (dateHeight + taskHeight);
    ctx.fillStyle = "#eee";
    ctx.fillRect(col * cellWidth + 1, rowY, cellWidth, dateHeight);
    ctx.strokeStyle = "#1f2933";
    ctx.strokeRect(col * cellWidth + 1, rowY, cellWidth, dateHeight);
    ctx.fillStyle = "#1f2933";
    ctx.font = "18px Microsoft YaHei, Arial";
    ctx.textAlign = "center";
    ctx.fillText(monthDay(day), col * cellWidth + cellWidth / 2, rowY + dateHeight / 2);
  });
  days.forEach((day, index) => {
    const week = Math.floor(index / 7);
    const col = index % 7;
    const rowY = y + week * (dateHeight + taskHeight) + dateHeight;
    ctx.fillStyle = "#fff";
    ctx.fillRect(col * cellWidth + 1, rowY, cellWidth, taskHeight);
    ctx.strokeStyle = "#1f2933";
    ctx.strokeRect(col * cellWidth + 1, rowY, cellWidth, taskHeight);
    if (isHoliday(day)) {
      ctx.fillStyle = "#f4f6fa";
      ctx.fillRect(col * cellWidth + 2, rowY + 1, cellWidth - 2, taskHeight - 1);
      ctx.fillStyle = "#6b7280";
      ctx.font = "700 18px Microsoft YaHei, Arial";
      ctx.fillText("假期", col * cellWidth + cellWidth / 2, rowY + taskHeight / 2);
    } else if (!isRestDay(day)) {
      drawTaskStack(ctx, items.filter((item) => itemOnDate(item, day)), col, rowY, cellWidth, taskHeight);
    }
  });
  showExportPreview(canvas.toDataURL("image/png"), `${state.projectName || "项目排期"}-${Date.now()}.png`.replace(/[\\/:*?"<>|]/g, "-"));
}

function showExportPreview(dataUrl, fileName) {
  document.querySelector(".export-overlay")?.remove();
  const overlay = document.createElement("div");
  overlay.className = "export-overlay";
  overlay.innerHTML = `
    <div class="export-dialog">
      <div class="export-dialog-header">
        <div><p class="eyebrow">Export Preview</p><h2>图片已生成</h2></div>
        <button class="delete-button" data-close-export type="button">×</button>
      </div>
      <div class="export-preview"><img alt="排期导出图片预览" src="${dataUrl}" /></div>
      <div class="export-actions">
        <a class="primary-button" href="${dataUrl}" download="${escapeAttr(fileName)}">下载 PNG</a>
        <a class="ghost-button" href="${dataUrl}" target="_blank" rel="noopener">打开图片</a>
        <button class="ghost-button" data-close-export type="button">关闭</button>
      </div>
    </div>`;
  overlay.querySelectorAll("[data-close-export]").forEach((button) => button.addEventListener("click", () => overlay.remove()));
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
  showToast("图片已生成，可下载或打开查看");
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function render() {
  readForm();
  renderTypes();
  renderTimeline();
}

Object.values(fields).forEach((input) => {
  input.addEventListener("input", () => {
    markDirty();
    render();
  });
});

document.querySelector("#editCommonBtn").addEventListener("click", () => openTemplate("common"));
document.querySelector("#addTypeBtn").addEventListener("click", addType);
document.querySelector("#addNodeBtn").addEventListener("click", () => {
  if (!editingType) return;
  markDirty();
  state.templates[editingType].push({ name: "新增节点", duration: 1, emphasis: "normal" });
  renderTemplate();
  renderTimeline();
  renderTypes();
});
document.querySelector("#backBtn").addEventListener("click", closeTemplate);
document.querySelector("#jumpPreviewBtn").addEventListener("click", () => {
  document.querySelector("#previewPanel").scrollIntoView({ behavior: "smooth", block: "start" });
});
document.querySelector("#resetBtn").addEventListener("click", () => {
  if (!confirm("确认恢复示例吗？当前自定义内容会被清空。")) return;
  localStorage.removeItem(storageKey);
  location.reload();
});
document.querySelector("#exportBtn").addEventListener("click", exportPng);

load();
render();
