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
const minWeekCount = 2;
const maxWeekCount = 100;
const weekColumnsPerRow = 6;

function createDefaultTemplateLibrary() {
  return defaultTypeOrder.map((type) => ({
    id: `preset-${type}`,
    name: defaultTypeLabels[type],
    nodes: clone(defaultTemplates[type])
  }));
}

let editingType = null;
let editingLibraryTemplateId = null;
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
  activeView: "day",
  currentMonth: "",
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
  templates: clone(defaultTemplates),
  templateLibrary: createDefaultTemplateLibrary()
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
const templateLibraryBtn = document.querySelector("#templateLibraryBtn");
const dayViewBtn = document.querySelector("#dayViewBtn");
const weekViewBtn = document.querySelector("#weekViewBtn");
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
const saveAsLibraryBtn = document.querySelector("#saveAsLibraryBtn");
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

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, count) {
  const next = startOfMonth(date);
  next.setMonth(next.getMonth() + count);
  return next;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dateFromMonthKey(key) {
  const [year, month] = String(key || "").split("-").map(Number);
  return new Date(year || dateFromInput(state.calendarStart).getFullYear(), (month || dateFromInput(state.calendarStart).getMonth() + 1) - 1, 1);
}

function monthIndex(date) {
  return date.getFullYear() * 12 + date.getMonth();
}

function monthTitle(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
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

function getScheduledTypes() {
  return state.selectedTypes.filter((type) => state.templates[type]?.length);
}

function getLibraryTemplate(id) {
  return state.templateLibrary.find((template) => template.id === id);
}

function getEditingNodes() {
  if (editingLibraryTemplateId) return getLibraryTemplate(editingLibraryTemplateId)?.nodes || [];
  return state.templates[editingType] || [];
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
  const starts = getScheduledTypes().map((type) => dateFromInput(state.typeStarts[type]));
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
  if (!state.templates[type]?.length) return "";
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
  const finishes = getScheduledTypes().map(getTypeFinishDate).filter(Boolean);
  if (!finishes.length) return "";
  return toInputDate(finishes.map(dateFromInput).reduce((max, date) => (date > max ? date : max)));
}

function buildItems() {
  const items = [];
  let commonCursor = getCommonStart();
  const scheduledTypes = getScheduledTypes();
  if (scheduledTypes.length) {
    state.templates.common.forEach((task) => {
      const allocated = allocateTask(task, commonCursor, "common");
      items.push(allocated.item);
      commonCursor = allocated.nextStart;
    });
  }
  scheduledTypes.forEach((type) => {
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
  const start = dateFromInput(state.calendarStart);
  return Array.from({ length: state.weekCount * 7 }, (_, index) => addDays(start, index));
}

function getDisplayRange() {
  const start = dateFromInput(state.calendarStart);
  return {
    start,
    end: addDays(start, state.weekCount * 7 - 1)
  };
}

function isInDisplayRange(date) {
  const { start, end } = getDisplayRange();
  return date >= start && date <= end;
}

function getMonthPage() {
  const { end } = getDisplayRange();
  const firstMonth = startOfMonth(dateFromInput(state.calendarStart));
  const lastMonth = startOfMonth(end);
  let current = state.currentMonth ? dateFromMonthKey(state.currentMonth) : firstMonth;
  if (monthIndex(current) < monthIndex(firstMonth)) current = firstMonth;
  if (monthIndex(current) > monthIndex(lastMonth)) current = lastMonth;
  state.currentMonth = monthKey(current);
  return {
    current,
    firstMonth,
    lastMonth,
    canGoPrev: monthIndex(current) > monthIndex(firstMonth),
    canGoNext: monthIndex(current) < monthIndex(lastMonth)
  };
}

function getMonthGridDays(monthDate) {
  const firstDay = startOfMonth(monthDate);
  const lastDay = addDays(addMonths(firstDay, 1), -1);
  const gridStart = addDays(firstDay, -firstDay.getDay());
  const gridEnd = addDays(lastDay, 6 - lastDay.getDay());
  const totalDays = Math.round((gridEnd - gridStart) / (24 * 60 * 60 * 1000)) + 1;
  return Array.from({ length: totalDays }, (_, index) => addDays(gridStart, index));
}

function itemOnDate(item, date) {
  return item.dates.includes(toInputDate(date));
}

function readForm() {
  const previousCalendarStart = state.calendarStart;
  state.timelineTitle = fields.timelineTitle.value.trim() || "时间表 Timeline";
  state.projectName = fields.projectName.value.trim() || "未命名项目";
  state.calendarStart = fields.calendarStart.value;
  state.weekCount = Math.max(minWeekCount, Math.min(maxWeekCount, Number(fields.weekCount.value) || 6));
  state.restMode = fields.restMode.value;
  state.holidayStart = fields.holidayStart.value;
  state.holidayEnd = fields.holidayEnd.value;
  state.deliveryDate = getAutoDeliveryDate();
  fields.deliveryDate.value = state.deliveryDate;
  fields.weekCount.value = state.weekCount;
  if (state.calendarStart !== previousCalendarStart) state.currentMonth = monthKey(dateFromInput(state.calendarStart));
  getMonthPage();
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
      templates: { ...clone(defaultTemplates), ...(cached.templates || {}) },
      templateLibrary: Array.isArray(cached.templateLibrary) ? cached.templateLibrary : createDefaultTemplateLibrary()
    };
    state.activeView = state.activeView === "week" ? "week" : "day";
    state.templateLibrary = state.templateLibrary.map((template, index) => ({
      id: template.id || `library-${Date.now()}-${index}`,
      name: template.name || "未命名模板",
      nodes: Array.isArray(template.nodes) ? template.nodes : []
    }));
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

function getWeekLabel(weekDays) {
  const months = new Map();
  weekDays.forEach((day) => {
    const key = `${day.getFullYear()}-${day.getMonth()}`;
    months.set(key, (months.get(key) || 0) + 1);
  });
  const [monthKey] = [...months.entries()].sort((a, b) => b[1] - a[1])[0];
  const [year, month] = monthKey.split("-").map(Number);
  const firstDay = new Date(year, month, 1);
  const firstWeekStart = addDays(firstDay, -firstDay.getDay());
  const weekNumber = Math.floor((weekDays[0] - firstWeekStart) / (7 * 24 * 60 * 60 * 1000)) + 1;
  return `${month + 1}月 WEEK ${weekNumber}`;
}

function getWeekGroups(days, items) {
  return Array.from({ length: state.weekCount }, (_, index) => {
    const weekDays = days.slice(index * 7, index * 7 + 7);
    const weekDates = new Set(weekDays.map(toInputDate));
    const holidayCount = weekDays.filter(isHoliday).length;
    return {
      label: getWeekLabel(weekDays),
      range: `${monthDay(weekDays[0])} - ${monthDay(weekDays.at(-1))}`,
      holidayCount,
      items: items.filter((item) => item.dates.some((date) => weekDates.has(date)))
    };
  });
}

function updateViewButtons() {
  const isWeekView = state.activeView === "week";
  dayViewBtn.classList.toggle("is-active", !isWeekView);
  dayViewBtn.setAttribute("aria-selected", String(!isWeekView));
  weekViewBtn.classList.toggle("is-active", isWeekView);
  weekViewBtn.setAttribute("aria-selected", String(isWeekView));
}

function renderWeekBoard(days, items) {
  const groups = getWeekGroups(days, items);
  const board = document.createElement("div");
  board.className = "week-board";
  const grid = document.createElement("div");
  grid.className = "week-board-grid";
  grid.style.setProperty("--week-columns", Math.min(weekColumnsPerRow, groups.length || 1));

  groups.forEach((group) => {
    const card = document.createElement("article");
    card.className = "week-card";
    card.innerHTML = `
      <header class="week-card-head">
        <strong>${escapeHtml(group.label)}</strong>
        <span>${escapeHtml(group.range)}</span>
      </header>
      <div class="week-card-body">
        ${group.holidayCount ? `<span class="week-holiday-note">含 ${group.holidayCount} 天假期</span>` : ""}
        <div class="week-task-stack"></div>
      </div>
    `;
    const stack = card.querySelector(".week-task-stack");
    group.items.forEach((item) => {
      const pill = document.createElement("div");
      pill.className = "task-pill week-task-pill";
      pill.style.background = item.color;
      pill.innerHTML = item.emphasis === "bold" ? `<strong>${escapeHtml(item.name)}</strong>` : escapeHtml(item.name);
      stack.appendChild(pill);
    });
    if (!group.items.length) stack.innerHTML = '<span class="week-empty">本周暂无排期</span>';
    grid.appendChild(card);
  });

  board.appendChild(grid);
  return board;
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

  timeline.innerHTML = "";
  timeline.append(title, projectRow);
  if (state.activeView === "week") {
    timeline.classList.add("is-week-view");
    timeline.append(renderWeekBoard(days, items));
  } else {
    timeline.classList.remove("is-week-view");
    const monthPage = getMonthPage();
    const monthDays = getMonthGridDays(monthPage.current);
    const monthNav = document.createElement("div");
    monthNav.className = "month-nav";
    monthNav.innerHTML = `
      <button class="ghost-button month-nav-button" data-month-prev type="button" ${monthPage.canGoPrev ? "" : "disabled"}>上月</button>
      <strong>${escapeHtml(monthTitle(monthPage.current))}</strong>
      <button class="ghost-button month-nav-button" data-month-next type="button" ${monthPage.canGoNext ? "" : "disabled"}>下月</button>
    `;
    monthNav.querySelector("[data-month-prev]").addEventListener("click", () => {
      if (!monthPage.canGoPrev) return;
      markDirty();
      state.currentMonth = monthKey(addMonths(monthPage.current, -1));
      renderTimeline();
    });
    monthNav.querySelector("[data-month-next]").addEventListener("click", () => {
      if (!monthPage.canGoNext) return;
      markDirty();
      state.currentMonth = monthKey(addMonths(monthPage.current, 1));
      renderTimeline();
    });

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
    for (let week = 0; week < monthDays.length / 7; week += 1) {
      monthDays.slice(week * 7, week * 7 + 7).forEach((day) => {
        const cell = document.createElement("div");
        cell.className = "date-cell";
        if (day.getMonth() !== monthPage.current.getMonth()) cell.classList.add("is-outside-month");
        if (!isInDisplayRange(day)) cell.classList.add("is-outside-range");
        cell.textContent = monthDay(day);
        grid.appendChild(cell);
      });

      monthDays.slice(week * 7, week * 7 + 7).forEach((day) => {
        const inRange = isInDisplayRange(day);
        const cell = document.createElement("div");
        cell.className = inRange && isHoliday(day) ? "task-cell holiday-cell" : "task-cell";
        if (day.getMonth() !== monthPage.current.getMonth()) cell.classList.add("is-outside-month");
        if (!inRange) cell.classList.add("is-outside-range");
        if (inRange && isHoliday(day)) {
          cell.innerHTML = `<div class="holiday-label">假期</div>`;
        } else if (inRange && !isRestDay(day)) {
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
    timeline.append(monthNav, header, grid);
  }
  updateViewButtons();
  renderSummary(items);
  save();
}

function renderTemplate() {
  if (!editingType && !editingLibraryTemplateId) return;
  const libraryTemplate = editingLibraryTemplateId ? getLibraryTemplate(editingLibraryTemplateId) : null;
  const nodes = getEditingNodes();
  templateTitle.textContent = libraryTemplate
    ? `${libraryTemplate.name}模板编辑`
    : `${editingType === "common" ? "共用环节" : getTypeLabel(editingType)}自定义模板`;
  saveAsLibraryBtn.hidden = Boolean(libraryTemplate) || editingType === "common";
  nodeList.innerHTML = "";
  nodes.forEach((node, index) => {
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
      nodes.splice(index, 1);
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
      const [moved] = nodes.splice(from, 1);
      nodes.splice(to, 0, moved);
      renderTemplate();
      render();
    });
    nodeList.appendChild(row);
  });
}

function openTemplate(type) {
  editingType = type;
  editingLibraryTemplateId = null;
  appShell.hidden = true;
  templatePage.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderTemplate();
}

function openLibraryTemplate(templateId) {
  editingType = null;
  editingLibraryTemplateId = templateId;
  document.querySelector(".template-library-overlay")?.remove();
  appShell.hidden = true;
  templatePage.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderTemplate();
}

function closeTemplate() {
  editingType = null;
  editingLibraryTemplateId = null;
  templatePage.hidden = true;
  appShell.hidden = false;
  render();
}

function createProjectType(name, nodes) {
  markDirty();
  const id = `customType${Date.now()}`;
  state.typeOrder.push(id);
  state.typeLabels[id] = name || "新增项目大类";
  state.typeColors[id] = newTypeColors[state.typeOrder.length % newTypeColors.length];
  state.typeStarts[id] = state.calendarStart || toInputDate(new Date());
  state.templates[id] = clone(nodes || []);
  state.selectedTypes.push(id);
  render();
  showToast(nodes?.length ? "已套用流程模板" : "已新建空白大类");
}

function showTemplateNameDialog(title, initialValue, onConfirm) {
  document.querySelector(".template-name-overlay")?.remove();
  const overlay = document.createElement("div");
  overlay.className = "export-overlay template-name-overlay";
  overlay.innerHTML = `
    <form class="template-name-dialog">
      <div class="export-dialog-header"><div><p class="eyebrow">Template</p><h2>${escapeHtml(title)}</h2></div><button class="delete-button" data-close-template-name type="button">×</button></div>
      <label>模板名称<input data-template-name value="${escapeAttr(initialValue)}" maxlength="40" autofocus /></label>
      <div class="export-actions"><button class="ghost-button" data-close-template-name type="button">取消</button><button class="primary-button" type="submit">保存</button></div>
    </form>`;
  const input = overlay.querySelector("[data-template-name]");
  overlay.querySelectorAll("[data-close-template-name]").forEach((button) => button.addEventListener("click", () => overlay.remove()));
  overlay.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value) {
      showToast("请输入模板名称");
      input.focus();
      return;
    }
    overlay.remove();
    onConfirm(value);
  });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
  input.focus();
}

function showTemplateLibrary(selectMode = false) {
  document.querySelector(".template-library-overlay")?.remove();
  const overlay = document.createElement("div");
  overlay.className = "export-overlay template-library-overlay";
  const libraryItems = state.templateLibrary.map((template) => `
    <article class="library-template-item" data-library-template="${template.id}">
      <div class="library-template-main">
        <input class="library-template-name" data-library-name="${template.id}" value="${escapeAttr(template.name)}" aria-label="模板名称" />
        <span>${template.nodes.length} 个节点</span>
      </div>
      <div class="library-template-actions">
        ${selectMode ? `<button class="primary-button" data-use-library-template="${template.id}" type="button">套用</button>` : ""}
        <button class="ghost-button" data-edit-library-template="${template.id}" type="button">编辑流程</button>
        <button class="delete-button" data-delete-library-template="${template.id}" type="button" title="删除模板">×</button>
      </div>
    </article>
  `).join("") || '<p class="template-library-empty">暂无已存模板，可新建模板或创建空白大类。</p>';
  overlay.innerHTML = `
    <section class="export-dialog template-library-dialog">
      <div class="export-dialog-header">
        <div><p class="eyebrow">Template Library</p><h2>${selectMode ? "选择流程模板" : "流程模板库"}</h2></div>
        <button class="delete-button" data-close-library type="button">×</button>
      </div>
      <div class="template-library-list">${libraryItems}</div>
      <div class="export-actions"><button class="ghost-button" data-new-library-template type="button">新建模板</button><button class="ghost-button" data-close-library type="button">关闭</button></div>
    </section>`;
  overlay.querySelectorAll("[data-close-library]").forEach((button) => button.addEventListener("click", () => overlay.remove()));
  overlay.querySelectorAll("[data-library-name]").forEach((input) => input.addEventListener("input", (event) => {
    const template = getLibraryTemplate(event.target.dataset.libraryName);
    if (!template) return;
    template.name = event.target.value.trim() || "未命名模板";
    markDirty();
    save();
  }));
  overlay.querySelectorAll("[data-edit-library-template]").forEach((button) => button.addEventListener("click", () => openLibraryTemplate(button.dataset.editLibraryTemplate)));
  overlay.querySelectorAll("[data-use-library-template]").forEach((button) => button.addEventListener("click", () => {
    const template = getLibraryTemplate(button.dataset.useLibraryTemplate);
    if (!template) return;
    overlay.remove();
    createProjectType(template.name, template.nodes);
  }));
  overlay.querySelectorAll("[data-delete-library-template]").forEach((button) => button.addEventListener("click", () => {
    const template = getLibraryTemplate(button.dataset.deleteLibraryTemplate);
    if (!template || !confirm(`确认删除“${template.name}”吗？已套用的大类不会受影响。`)) return;
    markDirty();
    state.templateLibrary = state.templateLibrary.filter((item) => item.id !== template.id);
    save();
    showTemplateLibrary(selectMode);
  }));
  overlay.querySelector("[data-new-library-template]").addEventListener("click", () => {
    showTemplateNameDialog("新建流程模板", "新流程模板", (name) => {
      const template = { id: `library-${Date.now()}`, name, nodes: [] };
      markDirty();
      state.templateLibrary.push(template);
      save();
      openLibraryTemplate(template.id);
    });
  });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
}

function showTypeCreationDialog() {
  document.querySelector(".project-type-overlay")?.remove();
  const overlay = document.createElement("div");
  overlay.className = "export-overlay project-type-overlay";
  overlay.innerHTML = `
    <section class="export-dialog project-type-dialog">
      <div class="export-dialog-header"><div><p class="eyebrow">Project Type</p><h2>新增项目大类</h2></div><button class="delete-button" data-close-type-dialog type="button">×</button></div>
      <div class="type-creation-options">
        <button class="type-creation-option" data-create-from-library type="button"><strong>套用已存模板</strong><span>复制一套已有流程，创建后可独立修改</span></button>
        <button class="type-creation-option" data-create-empty type="button"><strong>新建空白大类</strong><span>不添加流程节点，之后按需从零开始制作</span></button>
      </div>
    </section>`;
  overlay.querySelectorAll("[data-close-type-dialog]").forEach((button) => button.addEventListener("click", () => overlay.remove()));
  overlay.querySelector("[data-create-from-library]").addEventListener("click", () => {
    overlay.remove();
    showTemplateLibrary(true);
  });
  overlay.querySelector("[data-create-empty]").addEventListener("click", () => {
    overlay.remove();
    createProjectType("新增项目大类", []);
  });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
}

function saveEditingAsLibrary() {
  if (!editingType || editingType === "common") return;
  showTemplateNameDialog("保存为流程模板", `${getTypeLabel(editingType)}模板`, (name) => {
    markDirty();
    state.templateLibrary.push({ id: `library-${Date.now()}`, name, nodes: clone(getEditingNodes()) });
    save();
    showToast("流程已保存到模板库");
  });
}

function addType() {
  showTypeCreationDialog();
}

function deleteType(type) {
  if (state.typeOrder.length <= 1) {
    showToast("至少保留一个项目大类");
    return;
  }
  if (!confirm(`确认删除“${getTypeLabel(type)}”吗？对应流程也会一起删除。`)) return;
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

function drawTaskStackAt(ctx, items, left, rowY, cellWidth, taskHeight) {
  const gap = 5;
  const padding = 7;
  const pillHeight = Math.max(22, Math.floor((taskHeight - padding * 2 - gap * (items.length - 1)) / Math.max(1, items.length)));
  items.forEach((item, index) => {
    const top = rowY + padding + index * (pillHeight + gap);
    const pillLeft = left + 8;
    const width = cellWidth - 14;
    ctx.fillStyle = item.color;
    ctx.fillRect(pillLeft, top, width, pillHeight);
    ctx.strokeStyle = "rgba(31, 41, 51, 0.22)";
    ctx.strokeRect(pillLeft, top, width, pillHeight);
    ctx.fillStyle = "#111";
    drawWrappedText(ctx, item.name, pillLeft + width / 2, top + pillHeight / 2, width - 10, 18, item.emphasis === "bold");
  });
}

function drawTaskStack(ctx, items, col, rowY, cellWidth, taskHeight) {
  drawTaskStackAt(ctx, items, col * cellWidth, rowY, cellWidth, taskHeight);
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

function exportDayPng() {
  const cellWidth = 150;
  const titleHeight = 112;
  const projectHeight = 42;
  const monthHeight = 42;
  const headerHeight = 46;
  const dateHeight = 28;
  const taskHeight = 124;
  const monthPage = getMonthPage();
  const monthDays = getMonthGridDays(monthPage.current);
  const monthWeekCount = monthDays.length / 7;
  const width = cellWidth * 7 + 2;
  const height = titleHeight + projectHeight + monthHeight + headerHeight + monthWeekCount * (dateHeight + taskHeight) + 2;
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
  ctx.fillStyle = "#f8fbff";
  ctx.fillRect(1, y, width - 2, monthHeight);
  ctx.strokeStyle = "#1f2933";
  ctx.strokeRect(1, y, width - 2, monthHeight);
  ctx.fillStyle = "#1f2933";
  ctx.font = "700 18px Microsoft YaHei, Arial";
  ctx.textAlign = "center";
  ctx.fillText(monthTitle(monthPage.current), width / 2, y + monthHeight / 2);

  y += monthHeight;
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
  const items = buildItems();
  monthDays.forEach((day, index) => {
    const week = Math.floor(index / 7);
    const col = index % 7;
    const rowY = y + week * (dateHeight + taskHeight);
    const outsideMonth = day.getMonth() !== monthPage.current.getMonth();
    ctx.fillStyle = outsideMonth ? "#f7f8fb" : "#eee";
    ctx.fillRect(col * cellWidth + 1, rowY, cellWidth, dateHeight);
    ctx.strokeStyle = "#1f2933";
    ctx.strokeRect(col * cellWidth + 1, rowY, cellWidth, dateHeight);
    ctx.fillStyle = outsideMonth || !isInDisplayRange(day) ? "#98a2b3" : "#1f2933";
    ctx.font = "18px Microsoft YaHei, Arial";
    ctx.textAlign = "center";
    ctx.fillText(monthDay(day), col * cellWidth + cellWidth / 2, rowY + dateHeight / 2);
  });
  monthDays.forEach((day, index) => {
    const week = Math.floor(index / 7);
    const col = index % 7;
    const rowY = y + week * (dateHeight + taskHeight) + dateHeight;
    const inRange = isInDisplayRange(day);
    const outsideMonth = day.getMonth() !== monthPage.current.getMonth();
    ctx.fillStyle = outsideMonth || !inRange ? "#fbfcfe" : "#fff";
    ctx.fillRect(col * cellWidth + 1, rowY, cellWidth, taskHeight);
    ctx.strokeStyle = "#1f2933";
    ctx.strokeRect(col * cellWidth + 1, rowY, cellWidth, taskHeight);
    if (inRange && isHoliday(day)) {
      ctx.fillStyle = "#f4f6fa";
      ctx.fillRect(col * cellWidth + 2, rowY + 1, cellWidth - 2, taskHeight - 1);
      ctx.fillStyle = "#6b7280";
      ctx.font = "700 18px Microsoft YaHei, Arial";
      ctx.fillText("假期", col * cellWidth + cellWidth / 2, rowY + taskHeight / 2);
    } else if (inRange && !isRestDay(day)) {
      drawTaskStack(ctx, items.filter((item) => itemOnDate(item, day)), col, rowY, cellWidth, taskHeight);
    }
  });
  showExportPreview(canvas.toDataURL("image/png"), `${state.projectName || "项目排期"}-日视图-${Date.now()}.png`.replace(/[\\/:*?"<>|]/g, "-"));
}

function exportWeekPng() {
  const days = getDays();
  const items = buildItems();
  const groups = getWeekGroups(days, items);
  const cellWidth = 180;
  const columns = Math.min(weekColumnsPerRow, groups.length || 1);
  const rowCount = Math.ceil(groups.length / weekColumnsPerRow);
  const titleHeight = 112;
  const projectHeight = 52;
  const headerHeight = 54;
  const maxTaskCount = Math.max(1, ...groups.map((group) => group.items.length));
  const taskHeight = Math.max(170, maxTaskCount * 38 + 26);
  const weekRowHeight = headerHeight + taskHeight;
  const width = cellWidth * columns + 2;
  const height = titleHeight + projectHeight + rowCount * weekRowHeight + 2;
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
  const projectSplit = width * (4 / 7);
  ctx.strokeStyle = "#1f2933";
  ctx.lineWidth = 1;
  ctx.strokeRect(1, y, width - 2, projectHeight);
  ctx.beginPath();
  ctx.moveTo(projectSplit, y);
  ctx.lineTo(projectSplit, y + projectHeight);
  ctx.stroke();
  ctx.font = "700 16px Microsoft YaHei, Arial";
  ctx.textAlign = "left";
  ctx.fillStyle = "#1f2933";
  ctx.fillText(`项目名称  Entry name--${state.projectName}`, 12, y + projectHeight / 2);
  drawLegend(ctx, projectSplit, y, width - projectSplit, projectHeight);

  y += projectHeight;
  groups.forEach((group, index) => {
    const col = index % weekColumnsPerRow;
    const row = Math.floor(index / weekColumnsPerRow);
    const left = col * cellWidth + 1;
    const top = y + row * weekRowHeight;
    ctx.fillStyle = "#f26f1f";
    ctx.fillRect(left, top, cellWidth, headerHeight);
    ctx.strokeStyle = "#1f2933";
    ctx.strokeRect(left, top, cellWidth, headerHeight);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "700 17px Microsoft YaHei, Arial";
    ctx.fillText(group.label, left + cellWidth / 2, top + 19);
    ctx.font = "13px Microsoft YaHei, Arial";
    ctx.fillText(group.range, left + cellWidth / 2, top + 39);

    const taskY = top + headerHeight;
    ctx.fillStyle = "#fff";
    ctx.fillRect(left, taskY, cellWidth, taskHeight);
    ctx.strokeStyle = "#1f2933";
    ctx.strokeRect(left, taskY, cellWidth, taskHeight);
    if (group.holidayCount) {
      ctx.fillStyle = "#687483";
      ctx.font = "700 12px Microsoft YaHei, Arial";
      ctx.fillText(`含 ${group.holidayCount} 天假期`, left + cellWidth / 2, taskY + 14);
    }
    drawTaskStackAt(ctx, group.items, left, taskY + (group.holidayCount ? 18 : 0), cellWidth, taskHeight - (group.holidayCount ? 18 : 0));
    if (!group.items.length) {
      ctx.fillStyle = "#8a96a8";
      ctx.font = "14px Microsoft YaHei, Arial";
      ctx.fillText("本周暂无排期", left + cellWidth / 2, taskY + taskHeight / 2);
    }
  });
  showExportPreview(canvas.toDataURL("image/png"), `${state.projectName || "项目排期"}-周视图-${Date.now()}.png`.replace(/[\\/:*?"<>|]/g, "-"));
}

function exportPng() {
  readForm();
  if (state.activeView === "week") {
    exportWeekPng();
    return;
  }
  exportDayPng();
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

function bridge() {
  return window.TimelineWorkbenchBridge;
}

function optionHtml(values, selected = "", includeBlank = false) {
  return `${includeBlank ? `<option value="">请选择</option>` : ""}${values.map((value) => `<option value="${escapeAttr(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}`;
}

function buildWorkbenchDraft() {
  readForm();
  if (!bridge()) return null;
  const draft = bridge().buildDraft({
    state: clone(state),
    items: buildItems(),
    getTypeLabel
  });
  const firstTask = draft.tasks.find((task) => task.shouldImport && task.module);
  if (!draft.project.currentNode && firstTask) draft.project.currentNode = firstTask.module;
  return draft;
}

function validateWorkbenchDraft(draft) {
  const issues = [];
  if (!draft.project.title.trim()) issues.push("请填写项目标题");
  if (!draft.project.startDate) issues.push("请填写项目启动时间");
  if (!draft.project.finishDate) issues.push("请填写项目完成时间");
  const selectedTasks = draft.tasks.filter((task) => task.shouldImport);
  if (!selectedTasks.length) issues.push("请至少选择一个任务录入");
  selectedTasks.forEach((task) => {
    const validModules = (task.modules || []).filter((module) => bridge().TASK_MODULES.includes(module));
    if (!validModules.length) issues.push(`${task.sourceNode} 需要选择工作台模块`);
    if (!task.plannedDate) issues.push(`${task.sourceNode} 需要填写预计完成时间`);
  });
  return issues;
}

function draftFromWorkbenchDialog(overlay) {
  const project = {};
  overlay.querySelectorAll("[data-import-project]").forEach((input) => {
    project[input.dataset.importProject] = input.value;
  });
  const tasks = [];
  overlay.querySelectorAll("[data-import-task-row]").forEach((row) => {
    const index = Number(row.dataset.importTaskRow);
    const base = workbenchImportDraft.tasks[index];
    const task = { ...base };
    row.querySelectorAll("[data-import-task]").forEach((input) => {
      const field = input.dataset.importTask;
      task[field] = input.type === "checkbox" ? input.checked : input.value;
    });
    task.modules = Array.from(row.querySelectorAll("[data-import-task-module]:checked")).map((input) => input.value);
    task.module = task.modules[0] || "";
    task.needsReview = Boolean(task.shouldImport && !task.modules.length);
    tasks[index] = task;
  });
  const finalTaskOwners = { ...(workbenchImportDraft.finalTaskOwners || {}) };
  overlay.querySelectorAll("[data-final-task-owner]").forEach((input) => {
    finalTaskOwners[input.dataset.finalTaskOwner] = input.value.trim();
  });
  workbenchImportDraft = { project, tasks, finalTaskOwners };
  return workbenchImportDraft;
}

function updateWorkbenchImportMessage(overlay, options = {}) {
  const draft = draftFromWorkbenchDialog(overlay);
  const issues = validateWorkbenchDraft(draft);
  const message = overlay.querySelector("[data-import-message]");
  const confirmButton = overlay.querySelector("[data-confirm-workbench-import]");
  message.textContent = issues.length ? `还需校对：${issues[0]}${issues.length > 1 ? `等 ${issues.length} 项` : ""}` : "校对完成，可以录入工作台。";
  message.classList.toggle("warning", Boolean(issues.length));
  confirmButton.disabled = Boolean(issues.length);
  overlay.querySelectorAll("[data-import-task-row]").forEach((row) => {
    const task = draft.tasks[Number(row.dataset.importTaskRow)];
    row.classList.toggle("needs-review", Boolean(task.shouldImport && !task.modules?.length));
    row.classList.toggle("excluded", !task.shouldImport);
    const badge = row.querySelector("[data-import-task-badge]");
    badge.innerHTML = task.shouldImport && !task.modules?.length ? `<span class="workbench-review-badge">需校对</span>` : `<span class="workbench-ok-badge">${task.shouldImport ? "可录入" : "不录入"}</span>`;
  });
  const finalPreview = overlay.querySelector("[data-final-task-preview]");
  const editingFinalOwner = document.activeElement?.matches?.("[data-final-task-owner]");
  if (finalPreview && !editingFinalOwner && !options.skipFinalPreview) finalPreview.innerHTML = finalTaskPreviewHtml(draft);
}

function modulePickerHtml(task, index) {
  const selected = new Set(Array.isArray(task.modules) ? task.modules : [task.module].filter(Boolean));
  return `
    <div class="workbench-module-picker" aria-label="工作台模块">
      ${bridge().TASK_MODULES.map((module) => `
        <label>
          <input data-import-task-module="${index}" type="checkbox" value="${escapeAttr(module)}" ${selected.has(module) ? "checked" : ""} />
          <span>${escapeHtml(module)}</span>
        </label>
      `).join("")}
    </div>
  `;
}

function finalTaskPreviewHtml(draft) {
  const finalTasks = bridge().buildFinalTasks(draft);
  if (!finalTasks.length) return `<p class="workbench-import-empty">暂无将录入的最终任务。</p>`;
  return `
    <div class="workbench-final-preview">
      <table>
        <thead><tr><th>最终任务</th><th>来源节点</th><th>排期</th><th>负责人</th></tr></thead>
        <tbody>
          ${finalTasks.map((task) => `
            <tr>
              <td>${escapeHtml(task.module)}</td>
              <td>${escapeHtml(task.sourceNode || "-")}</td>
              <td>${escapeHtml(task.startDate || "-")} - ${escapeHtml(task.plannedDate || "-")}</td>
              <td><input class="workbench-final-owner-input" data-final-task-owner="${escapeAttr(task.module)}" value="${escapeAttr(task.owner)}" placeholder="负责人" /></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function workbenchTaskRows(draft) {
  return draft.tasks.map((task, index) => {
    const badge = task.shouldImport && !(task.modules?.length)
      ? `<span class="workbench-review-badge">需校对</span>`
      : `<span class="workbench-ok-badge">${task.shouldImport ? "可录入" : "不录入"}</span>`;
    return `
      <tr data-import-task-row="${index}" class="${task.shouldImport && !(task.modules?.length) ? "needs-review" : ""} ${task.shouldImport ? "" : "excluded"}">
        <td><input data-import-task="shouldImport" type="checkbox" ${task.shouldImport ? "checked" : ""} aria-label="是否录入 ${escapeAttr(task.sourceNode)}" /></td>
        <td>${escapeHtml(task.sourceTypeLabel)}</td>
        <td>${escapeHtml(task.sourceNode)}${task.excludedReason ? `<br><small>${escapeHtml(task.excludedReason)}</small>` : ""}</td>
        <td>${escapeHtml(task.startDate)} - ${escapeHtml(task.plannedDate)}</td>
        <td>${modulePickerHtml(task, index)}</td>
        <td><input data-import-task="owner" value="${escapeAttr(task.owner)}" placeholder="负责人" /></td>
        <td><input data-import-task="plannedDate" type="date" value="${escapeAttr(task.plannedDate)}" /></td>
        <td><select data-import-task="priority">${optionHtml(["高", "中", "低"], task.priority || "中")}</select></td>
        <td><input class="workbench-note-input" data-import-task="note" value="${escapeAttr(task.note)}" /></td>
        <td data-import-task-badge>${badge}</td>
      </tr>
    `;
  }).join("");
}

let workbenchImportDraft = null;

function showWorkbenchImportPreview() {
  if (!bridge()) {
    showToast("工作台映射模块未加载，请刷新页面后重试。");
    return;
  }
  workbenchImportDraft = buildWorkbenchDraft();
  if (!workbenchImportDraft.tasks.length) {
    showToast("当前排期没有可录入的任务。");
    return;
  }
  document.querySelector(".export-overlay")?.remove();
  const overlay = document.createElement("div");
  overlay.className = "export-overlay";
  overlay.innerHTML = `
    <div class="export-dialog workbench-import-dialog">
      <div class="export-dialog-header">
        <div><p class="eyebrow">Workbench Import</p><h2>录入工作台预览</h2></div>
        <button class="delete-button" data-close-workbench-import type="button">×</button>
      </div>
      <div class="workbench-import-body">
        <section class="workbench-import-section">
          <h3>项目字段</h3>
          <div class="workbench-project-grid">
            <label>标题<input data-import-project="title" value="${escapeAttr(workbenchImportDraft.project.title)}" /></label>
            <label>系列<input data-import-project="series" value="${escapeAttr(workbenchImportDraft.project.series)}" placeholder="可选" /></label>
            <label>项目类型<select data-import-project="projectType">${optionHtml(bridge().PROJECT_TYPES, workbenchImportDraft.project.projectType)}</select></label>
            <label>项目状态<select data-import-project="status">${optionHtml(bridge().PROJECT_STATUSES, workbenchImportDraft.project.status)}</select></label>
            <label>当前节点<input data-import-project="currentNode" value="${escapeAttr(workbenchImportDraft.project.currentNode)}" /></label>
            <label>启动时间<input data-import-project="startDate" type="date" value="${escapeAttr(workbenchImportDraft.project.startDate)}" /></label>
            <label>完成时间<input data-import-project="finishDate" type="date" value="${escapeAttr(workbenchImportDraft.project.finishDate)}" /></label>
            <label>产品图片<input data-import-project="image" value="${escapeAttr(workbenchImportDraft.project.image)}" placeholder="可选" /></label>
          </div>
        </section>
        <section class="workbench-import-section">
          <h3>任务字段</h3>
          <div class="workbench-task-preview">
            <table>
              <thead>
                <tr>
                  <th>录入</th><th>来源大类</th><th>来源节点</th><th>排期</th><th>工作台模块</th><th>负责人</th><th>预计完成</th><th>优先级</th><th>备注</th><th>状态</th>
                </tr>
              </thead>
              <tbody>${workbenchTaskRows(workbenchImportDraft)}</tbody>
            </table>
          </div>
        </section>
        <section class="workbench-import-section">
          <h3>最终任务预览</h3>
          <div data-final-task-preview>${finalTaskPreviewHtml(workbenchImportDraft)}</div>
        </section>
      </div>
      <div class="export-actions">
        <span class="workbench-import-message" data-import-message></span>
        <a class="ghost-button" href="../capacity-board/index.html?module=workbench" target="_blank" rel="noopener">打开工作台</a>
        <button class="ghost-button" data-close-workbench-import type="button">取消</button>
        <button class="primary-button" data-confirm-workbench-import type="button">确认录入</button>
      </div>
    </div>`;

  overlay.querySelectorAll("[data-close-workbench-import]").forEach((button) => button.addEventListener("click", () => overlay.remove()));
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.remove();
  });
  overlay.addEventListener("input", (event) => updateWorkbenchImportMessage(overlay, { skipFinalPreview: event.target.matches("[data-final-task-owner]") }));
  overlay.addEventListener("change", (event) => updateWorkbenchImportMessage(overlay, { skipFinalPreview: event.target.matches("[data-final-task-owner]") }));
  overlay.querySelector("[data-confirm-workbench-import]").addEventListener("click", () => {
    const draft = draftFromWorkbenchDialog(overlay);
    const issues = validateWorkbenchDraft(draft);
    if (issues.length) {
      updateWorkbenchImportMessage(overlay);
      return;
    }
    try {
      const result = bridge().applyDraftToWorkbench(draft);
      overlay.remove();
      showToast(`${result.projectCreated ? "已创建" : "已更新"}项目，新增 ${result.createdTasks} 个任务，更新 ${result.updatedTasks} 个任务。`);
    } catch (error) {
      showToast(error.message || "录入失败，请检查预览字段。");
    }
  });
  document.body.appendChild(overlay);
  updateWorkbenchImportMessage(overlay);
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
templateLibraryBtn.addEventListener("click", () => showTemplateLibrary());
document.querySelector("#addTypeBtn").addEventListener("click", addType);
saveAsLibraryBtn.addEventListener("click", saveEditingAsLibrary);
document.querySelector("#addNodeBtn").addEventListener("click", () => {
  if (!editingType && !editingLibraryTemplateId) return;
  markDirty();
  getEditingNodes().push({ name: "新增节点", duration: 1, emphasis: "normal" });
  renderTemplate();
  renderTimeline();
  renderTypes();
});
document.querySelector("#backBtn").addEventListener("click", closeTemplate);
document.querySelector("#jumpPreviewBtn").addEventListener("click", () => {
  document.querySelector("#previewPanel").scrollIntoView({ behavior: "smooth", block: "start" });
});
dayViewBtn.addEventListener("click", () => {
  if (state.activeView === "day") return;
  markDirty();
  state.activeView = "day";
  renderTimeline();
});
weekViewBtn.addEventListener("click", () => {
  if (state.activeView === "week") return;
  markDirty();
  state.activeView = "week";
  renderTimeline();
});
document.querySelector("#importWorkbenchBtn").addEventListener("click", showWorkbenchImportPreview);
document.querySelector("#resetBtn").addEventListener("click", () => {
  if (!confirm("确认恢复示例吗？当前自定义内容会被清空。")) return;
  localStorage.removeItem(storageKey);
  location.reload();
});
document.querySelector("#exportBtn").addEventListener("click", exportPng);

load();
render();
