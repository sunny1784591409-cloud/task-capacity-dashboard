const STORAGE_KEY = "photo-video-capacity-board-v3";
const COMPLETED_STORAGE_KEY = "photo-video-temp-completed-db-v1";
const LEGACY_KEYS = ["photo-video-capacity-board-v2", "photo-video-capacity-board-v1"];
const PAGE_SIZE = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

const boardMeta = {
  photo: { label: "摄影", personLabel: "摄影师", eyebrow: "Photography", taskClass: "task-photo", daysPerSku: 2 },
  video: { label: "摄像", personLabel: "摄像师", eyebrow: "Videography", taskClass: "task-video", daysPerSku: 1 }
};

const defaultRules = [
  { content: "AMAZON出图", days: 2 },
  { content: "AMAZON&NPC出图", days: 3 },
  { content: "安装视频", days: 2 },
  { content: "场景视频", days: 2 },
  { content: "AI视频", days: 4 },
  { content: "重点项目", days: 5 }
];

const initialState = {
  currentView: "photo",
  monthCursor: { photo: toMonthKey(new Date()), video: toMonthKey(new Date()) },
  rules: { photo: clone(defaultRules), video: clone(defaultRules) },
  imported: { photo: [], video: [] },
  temp: { photo: [], video: [] },
  tablePage: { photo: 1, video: 1 },
  taskSearch: { photo: "", video: "" },
  highlightedTask: { photo: "", video: "" },
  capacityLimits: {},
  capacityMonthOffset: 0,
  personalMonthOffset: 0,
  personal: null,
  videoScheduleSchemaVersion: 0
};

let state = loadState();
let completedDb = loadCompletedDb();
let pasteTargetBoard = "photo";
let completedContext = { board: "photo", type: "month", value: toMonthKey(new Date()) };
let personalEdgeSwitchTimer = 0;
let personalEdgeSwitchedThisDrag = false;
cleanupLegacyPastCalendarTasks();
migrateVideoScheduleDefaults();

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY) || LEGACY_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
  if (!raw) return clone(initialState);
  try {
    const cached = JSON.parse(raw);
    const importedSource = cached.imported || cached.tasks || { photo: [], video: [] };
    const next = {
      ...clone(initialState),
      ...cached,
      imported: {
        photo: Array.isArray(importedSource.photo) ? importedSource.photo : [],
        video: Array.isArray(importedSource.video) ? importedSource.video : []
      },
      temp: {
        photo: Array.isArray(cached.temp?.photo) ? cached.temp.photo : [],
        video: Array.isArray(cached.temp?.video) ? cached.temp.video : []
      },
      rules: {
        photo: cached.rules?.photo?.length ? cached.rules.photo : clone(defaultRules),
        video: cached.rules?.video?.length ? cached.rules.video : clone(defaultRules)
      },
      tablePage: { ...initialState.tablePage, ...(cached.tablePage || {}) },
      taskSearch: { ...initialState.taskSearch, ...(cached.taskSearch || {}) },
      highlightedTask: { ...initialState.highlightedTask, ...(cached.highlightedTask || {}) },
      capacityLimits: cached.capacityLimits || {},
      capacityMonthOffset: clampMonthOffset(cached.capacityMonthOffset),
      personalMonthOffset: clampPersonalMonthOffset(cached.personalMonthOffset),
      personal: cached.personal || null
    };

    ["photo", "video"].forEach((board) => {
      next.imported[board] = next.imported[board].map((task) => ({ ...createImportedTask(board, task), ...task, board, kind: "imported" }));
      next.temp[board] = next.temp[board].map((task) => ({ ...createTempTask(board, task), ...task, board, kind: "temp" }));
    });
    return next;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return clone(initialState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadCompletedDb() {
  try {
    const cached = JSON.parse(localStorage.getItem(COMPLETED_STORAGE_KEY) || "{}");
    return {
      photo: Array.isArray(cached.photo) ? cached.photo : [],
      video: Array.isArray(cached.video) ? cached.video : []
    };
  } catch {
    localStorage.removeItem(COMPLETED_STORAGE_KEY);
    return { photo: [], video: [] };
  }
}

function saveCompletedDb() {
  localStorage.setItem(COMPLETED_STORAGE_KEY, JSON.stringify(completedDb));
}

function cleanupLegacyPastCalendarTasks() {
  let changed = false;
  ["photo", "video"].forEach((board) => {
    const before = state.temp[board].length;
    state.temp[board] = state.temp[board].filter((task) => taskUniqueKey(task) !== "594013&594023");
    changed ||= before !== state.temp[board].length;

    (completedDb[board] || []).forEach((task) => {
      if (taskUniqueKey(task) !== "594013&594023") return;
      if (task.completedAt !== "2026-05-29" || !task.hiddenFromCalendar) changed = true;
      task.completedAt = "2026-05-29";
      task.completedTime = "2026-05-29T00:00:00.000+08:00";
      task.hiddenFromCalendar = true;
    });
  });
  if (changed) {
    saveState();
    saveCompletedDb();
  }
}

function migrateVideoScheduleDefaults() {
  if (Number(state.videoScheduleSchemaVersion) >= 3) return;
  state.imported.video.forEach((task) => {
    if (task.manualDuration) return;
    task.content = task.taskType || task.content;
    task.duration = getRuleDays("video", task.content);
  });
  state.videoScheduleSchemaVersion = 3;
  autoSchedule("video", { preserveTempSchedule: true, silent: true });
  saveState();
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  if (typeof value === "number") {
    const base = new Date(Date.UTC(1899, 11, 30));
    return new Date(base.getTime() + value * DAY_MS);
  }
  const text = String(value).trim();
  if (!text) return null;
  const normalized = text.replaceAll("/", "-").replace(/[.年]/g, "-").replace("月", "-").replace("日", "");
  const parts = normalized.split("-").map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const [year, month, day] = parts.map(Number);
    if (year && month && day) return new Date(year, month - 1, day);
  }
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return null;
}

function toDateKey(value) {
  const date = toDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayKey() {
  return toDateKey(new Date());
}

function displayDate(value) {
  const date = toDate(value);
  return date ? `${date.getMonth() + 1}/${date.getDate()}` : "";
}

function toMonthKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function fromMonthKey(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(monthKey, amount) {
  const date = fromMonthKey(monthKey);
  date.setMonth(date.getMonth() + amount);
  return toMonthKey(date);
}

function isWeekend(date) {
  return date.getDay() === 0 || date.getDay() === 6;
}

function nextWorkday(date) {
  let cursor = new Date(date);
  while (isWeekend(cursor)) cursor = addDays(cursor, 1);
  return cursor;
}

function addWorkdays(startDate, days) {
  let cursor = nextWorkday(startDate);
  let used = 0;
  let last = cursor;
  const duration = normalizeHalfDay(days);
  while (used < duration) {
    if (!isWeekend(cursor)) {
      last = cursor;
      used += 1;
    }
    cursor = addDays(cursor, 1);
  }
  return { start: toDateKey(nextWorkday(startDate)), end: toDateKey(last), next: nextWorkday(cursor) };
}

function scheduleFromCursor(cursorState, days) {
  const duration = normalizeHalfDay(days);
  if (cursorState.halfUsed && duration >= 1) {
    cursorState.date = nextWorkday(addDays(cursorState.date, 1));
    cursorState.halfUsed = false;
  }
  const startDate = cursorState.date;
  if (duration === 0.5) {
    const range = { start: toDateKey(startDate), end: toDateKey(startDate), next: startDate };
    if (cursorState.halfUsed) {
      cursorState.date = nextWorkday(addDays(startDate, 1));
      cursorState.halfUsed = false;
    } else {
      cursorState.halfUsed = true;
    }
    return range;
  }
  const range = addWorkdays(startDate, duration);
  if (duration % 1) {
    cursorState.date = toDate(range.end);
    cursorState.halfUsed = true;
  } else {
    cursorState.date = range.next;
    cursorState.halfUsed = false;
  }
  return range;
}

function workdaysBetween(start, end) {
  let count = 0;
  let cursor = toDate(start);
  const endDate = toDate(end);
  if (!cursor || !endDate) return 0;
  while (cursor <= endDate) {
    if (!isWeekend(cursor)) count += 1;
    cursor = addDays(cursor, 1);
  }
  return count;
}

function clampMonthOffset(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function clampPersonalMonthOffset(value) {
  return Math.max(-1, Math.min(1, Number(value) || 0));
}

function monthKeyFromOffset(offset) {
  return addMonths(toMonthKey(new Date()), Number(offset) || 0);
}

function monthOffsetFromCurrent(monthKey) {
  const current = fromMonthKey(toMonthKey(new Date()));
  const target = fromMonthKey(monthKey);
  return (target.getFullYear() - current.getFullYear()) * 12 + target.getMonth() - current.getMonth();
}

function relativeMonthText(offset) {
  if (offset < 0) return "上月";
  if (offset > 0) return "次月";
  return "本月";
}

function normalizeHalfDay(value) {
  return Math.max(0.5, Math.round((Number(value) || 0.5) * 2) / 2);
}

function monthLabel(monthKey) {
  const date = fromMonthKey(monthKey);
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()（）:：/_\-—\[\]【】,，.。]/g, "");
}

function getRuleDays(board, content) {
  const match = state.rules?.[board]?.find((rule) => rule.content === content);
  const fallback = defaultRules.find((rule) => rule.content === content);
  return Math.max(1, Number(match?.days || fallback?.days) || 1);
}

function optionalDuration(value) {
  const match = String(value ?? "").match(/\d+(?:\.\d+)?/);
  const number = Number(match ? match[0] : value);
  return Number.isFinite(number) && number > 0 ? normalizeHalfDay(number) : 0;
}

function importedDefaultDuration(board, content) {
  return getRuleDays(board, content);
}

function parseTimestamp(value) {
  if (typeof value === "number") {
    const date = toDate(value);
    return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
  }
  const text = String(value || "").trim();
  if (text) {
    const parsed = new Date(text.replaceAll("/", "-"));
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
  }
  const date = toDate(value);
  return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
}

function createImportedTask(board, values = {}) {
  const content = values.content || values.taskType || defaultRules[0].content;
  const manualDuration = Boolean(values.manualDuration || optionalDuration(values.duration));
  return {
    id: values.id || uid(),
    board,
    kind: "imported",
    sku: values.sku || "",
    title: values.title || "",
    productType: values.productType || "",
    language: values.language || "",
    taskType: values.taskType || content,
    taskStatus: values.taskStatus || "",
    priority: values.priority || "",
    createdTime: values.createdTime || "",
    relatedSku: values.relatedSku || "",
    sample: values.sample || "",
    eta: values.eta || "",
    earliestDue: values.earliestDue || "",
    assignee: values.assignee || "",
    content,
    duration: optionalDuration(values.duration) || importedDefaultDuration(board, content),
    manualDuration,
    start: values.start || "",
    end: values.end || "",
    createdAt: values.createdAt || Date.now()
  };
}

function createTempTask(board, values = {}) {
  const estimateDays = normalizeHalfDay(values.estimateDays || values.duration);
  return {
    id: values.id || uid(),
    board,
    kind: "temp",
    sku: values.sku || "",
    contact: values.contact || "",
    note: values.note || "",
    assignee: values.assignee || "",
    estimateDays,
    duration: estimateDays,
    start: values.start || "",
    end: values.end || "",
    createdAt: values.createdAt || Date.now()
  };
}

function mapRow(row, board) {
  const aliases = {
    sku: ["sku别名", "sku", "sku编码", "sku编号", "sku名称", "款号", "商品编码", "产品编码", "skualias", "sku_alias"],
    title: ["产品标题", "商品标题", "产品名称", "商品名称", "品名", "标题", "名称", "producttitle", "productname", "title", "name"],
    productType: ["产品类型", "商品类型", "产品分类", "商品分类", "品类", "类目", "producttype", "productcategory", "category"],
    language: ["任务语种", "语种", "语言", "视频语种", "任务语言", "站点", "国家", "language", "lang"],
    taskType: ["任务类型", "视频类型", "拍摄类型", "内容类型", "视频内容", "视频需求", "摄像内容", "任务内容", "tasktype", "task_type"],
    taskStatus: ["任务状态", "拍摄状态", "分配状态", "状态", "进度", "taskstatus", "status"],
    priority: ["优先级", "优先", "优先程度", "紧急程度", "等级", "priority"],
    createdTime: ["创建时间", "创建日期", "创建", "提交时间", "提交日期", "下单时间", "需求创建时间", "createdtime", "created_time", "createddate", "created_date"],
    relatedSku: ["关联sku", "关联SKU", "关联sku别名", "关联产品", "关联款号", "主sku", "父sku", "父级sku", "relatedsku", "related_sku"],
    duration: ["时长", "任务时长", "预计时长", "预计耗时", "预估耗时", "耗时", "天数", "工期", "duration", "days"],
    sample: ["样品", "样品状态", "是否有样", "sample"],
    eta: ["预计到港时间", "预计到港", "到港时间", "到港日期", "eta", "arrival", "arrivaldate"],
    earliestDue: ["最早交期", "最早交付时间", "最早交货期", "最早完成时间", "最早完成日期", "交期", "交付时间", "due", "earliestdue", "earliest_due"],
    assignee: [boardMeta[board].personLabel, "摄影师", "摄像师", "拍摄人", "摄像负责人", "负责人", "执行人", "分配人", "assignee", "owner"],
    content: ["拍摄内容", "内容", "出图类型", "任务内容", "视频内容", "视频需求", "content", "shootcontent"]
  };
  const normalizedRow = {};
  Object.entries(row).forEach(([key, value]) => {
    normalizedRow[normalizeHeader(key)] = value;
  });
  const fuzzyFields = new Set(["sku", "title", "productType", "language", "taskType", "taskStatus", "priority", "createdTime", "relatedSku", "duration", "sample", "eta", "earliestDue", "assignee", "content"]);
  const pick = (field) => {
    for (const name of aliases[field]) {
      const value = normalizedRow[normalizeHeader(name)];
      if (value !== undefined && value !== null) return String(value).trim();
    }
    if (fuzzyFields.has(field)) {
      const normalizedAliases = aliases[field].map(normalizeHeader).filter((name) => name.length >= 2 && !["类型", "内容", "状态", "名称", "标题", "创建", "天数", "样品"].includes(name));
      for (const [key, value] of Object.entries(normalizedRow)) {
        if (!key || value === undefined || value === null) continue;
        if (normalizedAliases.some((name) => key.includes(name) || name.includes(key))) return String(value).trim();
      }
    }
    return "";
  };
  const taskType = pick("taskType");
  const duration = pick("duration");
  return createImportedTask(board, {
    sku: pick("sku"),
    title: pick("title"),
    productType: pick("productType"),
    language: pick("language"),
    taskType,
    taskStatus: pick("taskStatus"),
    priority: pick("priority"),
    createdTime: pick("createdTime"),
    relatedSku: pick("relatedSku"),
    sample: pick("sample"),
    eta: toDateKey(pick("eta")),
    earliestDue: toDateKey(pick("earliestDue")),
    assignee: pick("assignee"),
    content: pick("content") || taskType || defaultRules[0].content,
    duration,
    manualDuration: Boolean(duration)
  });
}

function updateImportedDuration(task) {
  task.duration = task.manualDuration ? normalizeHalfDay(task.duration) : importedDefaultDuration(task.board, task.content);
  if (task.start) {
    const range = addWorkdays(toDate(task.start), task.duration);
    task.start = range.start;
    task.end = range.end;
  }
}

function shouldDimTask(task) {
  if (task.kind !== "imported") return false;
  if (task.eta || !task.earliestDue) return false;
  const today = toDate(toDateKey(new Date()));
  const threshold = addDays(toDate(task.earliestDue), 15);
  return today < threshold;
}

function isPhotoEtaTask(task) {
  return task.board === "photo" && task.kind === "imported" && Boolean(task.eta);
}

function extractSkuNumber(sku) {
  const match = String(sku || "").match(/\d+/);
  return match ? match[0] : `no-number-${sku}`;
}

function shuffle(array) {
  const next = [...array];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }
  return next;
}

function sortImportedForSchedule(tasks) {
  const withEta = tasks.filter((task) => task.eta).sort((left, right) => toDate(left.eta) - toDate(right.eta));
  const withSample = tasks.filter((task) => !task.eta && task.sample);
  const groups = withSample.reduce((acc, task) => {
    const key = extractSkuNumber(task.sku);
    acc[key] ||= [];
    acc[key].push(task);
    return acc;
  }, {});
  const grouped = shuffle(Object.values(groups)).flatMap((group) =>
    group.sort((left, right) => String(left.sku).localeCompare(String(right.sku), "zh-CN"))
  );
  const rest = tasks.filter((task) => !task.eta && !task.sample).sort((left, right) => left.createdAt - right.createdAt);
  return [...withEta, ...grouped, ...rest];
}

function priorityRank(value) {
  const text = String(value || "").trim();
  if (text.includes("高")) return 0;
  if (text.includes("中")) return 1;
  if (text.includes("低")) return 2;
  return 3;
}

function isVideoSchedulable(task) {
  const status = String(task.taskStatus || "").trim();
  return status === "待分配" || status === "待拍摄" || status === "拍摄中";
}

function taskSchedulePerson(task) {
  const person = String(task.assignee || "").trim();
  if (person) return person;
  if (task.board === "video" && task.kind === "imported" && isVideoSchedulable(task)) return "待分配";
  return "";
}

function sortVideoImportedForSchedule(tasks) {
  const groups = tasks.reduce((acc, task) => {
    const key = taskUniqueKey(task);
    acc[key] ||= [];
    acc[key].push(task);
    return acc;
  }, {});
  return Object.values(groups)
    .map((group) => ({
      group: group.sort((left, right) => {
        const priorityDiff = priorityRank(left.priority) - priorityRank(right.priority);
        if (priorityDiff) return priorityDiff;
        const timeDiff = parseTimestamp(left.createdTime || left.createdAt) - parseTimestamp(right.createdTime || right.createdAt);
        if (timeDiff) return timeDiff;
        return String(left.sku).localeCompare(String(right.sku), "zh-CN");
      }),
      rank: Math.min(...group.map((task) => priorityRank(task.priority))),
      created: Math.min(...group.map((task) => parseTimestamp(task.createdTime || task.createdAt)))
    }))
    .sort((left, right) => {
      if (left.rank !== right.rank) return left.rank - right.rank;
      if (left.created !== right.created) return left.created - right.created;
      return String(left.group[0]?.sku || "").localeCompare(String(right.group[0]?.sku || ""), "zh-CN");
    })
    .flatMap((item) => item.group);
}

function scheduleOrderForPerson(board, person) {
  const imported = state.imported[board].filter((task) => taskSchedulePerson(task) === person);
  if (board === "video") {
    const videoImported = sortVideoImportedForSchedule(imported.filter(isVideoSchedulable));
    const tempTasks = state.temp[board]
      .filter((task) => taskSchedulePerson(task) === person)
      .sort((left, right) => left.createdAt - right.createdAt);
    return [...videoImported, ...tempTasks];
  }
  const normalImported = sortImportedForSchedule(imported.filter((task) => !shouldDimTask(task)));
  const tempTasks = state.temp[board]
    .filter((task) => taskSchedulePerson(task) === person)
    .sort((left, right) => left.createdAt - right.createdAt);
  const dimImported = sortImportedForSchedule(imported.filter((task) => shouldDimTask(task)));
  return [...normalImported, ...tempTasks, ...dimImported];
}

function tasksForPersonByDate(board, person, excludeTaskId = "") {
  return allTasks(board)
    .filter((task) => task.id !== excludeTaskId && taskSchedulePerson(task) === person && task.start && task.end)
    .sort((left, right) => {
      const dateDiff = toDate(left.start) - toDate(right.start);
      if (dateDiff) return dateDiff;
      return (left.createdAt || 0) - (right.createdAt || 0);
    });
}

function prepareTaskDuration(task) {
  if (task.kind === "imported") updateImportedDuration(task);
  task.duration = task.kind === "temp" ? normalizeHalfDay(task.estimateDays) : normalizeHalfDay(task.duration);
}

function refreshTaskRangeFromStart(task) {
  if (!task.start) return;
  prepareTaskDuration(task);
  const range = addWorkdays(toDate(task.start), task.duration);
  task.start = range.start;
  task.end = range.end;
}

function taskDisplayEnd(task) {
  if (!task.start) return "";
  const duration = task.kind === "temp" || task.kind === "completedTemp" ? normalizeHalfDay(task.estimateDays || task.duration) : normalizeHalfDay(task.duration);
  return addWorkdays(toDate(task.start), duration).end;
}

function isPastTask(task) {
  const end = taskDisplayEnd(task);
  return Boolean(end && end < todayKey());
}

function isStartedScheduledTask(task) {
  return Boolean(task.start && task.start <= todayKey());
}

function addCalendarMonths(date, amount) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function isVideoAgedTask(task) {
  if (task.board !== "video" || task.kind !== "imported") return false;
  const created = toDate(task.createdTime);
  if (!created) return false;
  return toDate(todayKey()) > addCalendarMonths(created, 1);
}

function isVideoUnassignedTask(task) {
  return task.board === "video" && task.kind === "imported" && String(task.taskStatus || "").trim() === "待分配";
}

function displayCreatedTime(value) {
  if (!value) return "";
  const parsed = new Date(String(value).trim().replaceAll("/", "-"));
  if (Number.isNaN(parsed.getTime())) return String(value);
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

function taskUniqueKey(task) {
  const sku = String(task.sku || "").trim().toLowerCase();
  return sku || task.id;
}

function placeTaskAt(task, startDate) {
  prepareTaskDuration(task);
  const cursorState = { date: nextWorkday(startDate), halfUsed: false };
  const range = scheduleFromCursor(cursorState, task.duration);
  task.start = range.start;
  task.end = range.end;
  return cursorState;
}

function compactTasksFrom(tasks, cursorState) {
  tasks.forEach((task) => {
    prepareTaskDuration(task);
    const range = scheduleFromCursor(cursorState, task.duration);
    task.start = range.start;
    task.end = range.end;
  });
}

function rangeOverlaps(startA, endA, startB, endB) {
  return startA <= endB && endA >= startB;
}

function findFixedOverlap(range, fixedTasks) {
  return fixedTasks.find((task) => rangeOverlaps(range.start, range.end, task.start, taskDisplayEnd(task)));
}

function scheduleTaskSkippingFixed(task, cursorState, fixedTasks) {
  prepareTaskDuration(task);
  let attempts = 0;
  while (attempts < 120) {
    const preview = addWorkdays(cursorState.date, task.duration);
    const overlap = findFixedOverlap(preview, fixedTasks);
    if (!overlap) {
      const range = scheduleFromCursor(cursorState, task.duration);
      task.start = range.start;
      task.end = range.end;
      return;
    }
    cursorState.date = nextWorkday(addDays(toDate(taskDisplayEnd(overlap)), 1));
    cursorState.halfUsed = false;
    attempts += 1;
  }
}

function reflowPersonScheduleFromDrop(board, task, targetDateKey) {
  prepareTaskDuration(task);
  const person = taskSchedulePerson(task);
  const rawTargetDate = toDate(targetDateKey);
  if (!rawTargetDate) return;
  const targetDate = nextWorkday(rawTargetDate);
  if (!person) {
    placeTaskAt(task, targetDate);
    return;
  }
  const oldDate = toDate(task.start) || targetDate;
  const targetKey = toDateKey(targetDate);
  const oldKey = toDateKey(oldDate);
  const otherTasks = tasksForPersonByDate(board, person, task.id);

  if (targetDate > oldDate) {
    const beforeTarget = otherTasks.filter((item) => item.start >= oldKey && item.start < targetKey);
    const afterTarget = otherTasks.filter((item) => item.start >= targetKey);
    const gapCursor = { date: nextWorkday(oldDate), halfUsed: false };
    compactTasksFrom(beforeTarget, gapCursor);
    const anchorDate = gapCursor.date > targetDate ? gapCursor.date : targetDate;
    const anchorCursor = placeTaskAt(task, anchorDate);
    compactTasksFrom(afterTarget, anchorCursor);
    return;
  }

  const anchorCursor = placeTaskAt(task, targetDate);
  const afterTarget = otherTasks.filter((item) => item.start >= targetKey);
  compactTasksFrom(afterTarget, anchorCursor);
}

function allTasks(board) {
  return [...state.imported[board], ...state.temp[board]];
}

function completedTasks(board) {
  return (completedDb[board] || []).map((task) => ({
    ...task,
    board,
    kind: "completedTemp"
  }));
}

function calendarTasks(board) {
  const seen = new Set();
  return [...allTasks(board), ...completedTasks(board)].filter((task) => {
    if (task.hiddenFromCalendar) return false;
    if (seen.has(task.id)) return false;
    seen.add(task.id);
    return true;
  });
}

function activeCapacityTasks(board) {
  return allTasks(board).filter((task) => !isPastTask(task) && (task.kind === "temp" || !shouldDimTask(task)));
}

function archiveTempTask(board, taskId) {
  const task = state.temp[board].find((item) => item.id === taskId);
  if (!task) return;
  state.temp[board] = state.temp[board].filter((item) => item.id !== taskId);
  completedDb[board].unshift({
    ...task,
    kind: "completedTemp",
    completedAt: toDateKey(new Date()),
    completedTime: new Date().toISOString()
  });
  saveState();
  saveCompletedDb();
  render();
  showToast("临时任务已归入已完成清单。");
}

function autoSchedule(board, options = {}) {
  const preserveTempSchedule = Boolean(options.preserveTempSchedule);
  if (board === "video") {
    state.imported.video.forEach((task) => {
      if (isStartedScheduledTask(task)) return;
      if (isVideoSchedulable(task)) return;
      task.start = "";
      task.end = "";
    });
  }
  const people = [...new Set(allTasks(board).map(taskSchedulePerson).filter(Boolean))];
  const today = nextWorkday(new Date());
  people.forEach((person) => {
    const cursorState = { date: new Date(today), halfUsed: false };
    const fixedTasks = allTasks(board).filter(
      (task) => taskSchedulePerson(task) === person && task.start && task.end && (isStartedScheduledTask(task) || (preserveTempSchedule && task.kind === "temp"))
    );
    scheduleOrderForPerson(board, person).forEach((task) => {
      if (isStartedScheduledTask(task)) return;
      if (preserveTempSchedule && task.kind === "temp" && task.start && task.end) return;
      if (task.kind === "imported") updateImportedDuration(task);
      task.duration = task.kind === "temp" ? normalizeHalfDay(task.estimateDays) : task.duration;
      scheduleTaskSkippingFixed(task, cursorState, fixedTasks);
    });
  });
  saveState();
  if (!options.silent) {
    render();
    showToast(`${boardMeta[board].label}已完成自动排期。`);
  }
}

function render() {
  renderChrome();
  renderBoard("photo");
  renderBoard("video");
  renderCapacity();
  saveState();
}

function renderChrome() {
  $("#todayText").textContent = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date());
  $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === state.currentView));
  $$(".board-view").forEach((view) => view.classList.remove("active"));
  $(`#${state.currentView}View`)?.classList.add("active");
  const isCapacity = state.currentView === "capacity";
  $("#viewEyebrow").textContent = isCapacity ? "Capacity" : boardMeta[state.currentView].eyebrow;
  $("#viewTitle").textContent = isCapacity ? "产能看板" : `${boardMeta[state.currentView].label}任务后台`;
}

function renderBoard(board) {
  renderRuleOptions(board);
  renderRules(board);
  renderImportedTable(board);
  renderTempTable(board);
  renderCalendar(board);
}

function renderRuleOptions(board) {
  // 临时任务不再需要拍摄内容下拉；保留导入任务规则配置即可。
}

function renderRules(board) {
  const root = $(`[data-rules="${board}"]`);
  root.innerHTML = state.rules[board]
    .map(
      (rule, index) => `
        <div class="rule-row">
          <input data-rule-content="${board}:${index}" value="${escapeHtml(rule.content)}" aria-label="拍摄内容" />
          <input data-rule-days="${board}:${index}" type="number" min="1" max="30" value="${rule.days}" aria-label="预计时长" />
          <button class="delete-button" type="button" data-delete-rule="${board}:${index}" aria-label="删除规则">×</button>
        </div>
      `
    )
    .join("");
}

function filteredImported(board) {
  const query = state.taskSearch[board].trim().toLowerCase();
  if (!query) return state.imported[board];
  return state.imported[board].filter((task) => String(task.sku).toLowerCase().includes(query));
}

function clampTablePage(board, total) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  state.tablePage[board] = Math.max(1, Math.min(totalPages, Number(state.tablePage[board]) || 1));
  return totalPages;
}

function readOnlyCell(value) {
  return `<span class="readonly-cell">${escapeHtml(value || "-")}</span>`;
}

function compactText(value, maxLength = 18) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function foldedRelatedSkuCell(value) {
  const text = String(value || "").trim();
  if (!text) return readOnlyCell("-");
  return `
    <details class="folded-sku">
      <summary title="${escapeHtml(text)}">
        <span>${escapeHtml(compactText(text))}</span>
      </summary>
      <div class="folded-sku-body">${escapeHtml(text)}</div>
    </details>
  `;
}

function renderVideoImportedRows(pageTasks) {
  return pageTasks
    .map(
      (task) => `
        <tr class="${state.highlightedTask.video === task.id ? "table-row-highlight" : ""}">
          <td>${readOnlyCell(task.sku)}</td>
          <td>${readOnlyCell(task.language)}</td>
          <td>${readOnlyCell(task.taskType || task.content)}</td>
          <td><input class="table-input" data-import-field="video:${task.id}:assignee" value="${escapeHtml(task.assignee)}" /></td>
          <td><input class="table-input" data-import-field="video:${task.id}:taskStatus" value="${escapeHtml(task.taskStatus)}" /></td>
          <td>${readOnlyCell(task.priority)}</td>
          <td>${readOnlyCell(displayCreatedTime(task.createdTime) || task.createdTime)}</td>
          <td>${foldedRelatedSkuCell(task.relatedSku)}</td>
          <td><input class="table-input" data-import-field="video:${task.id}:duration" type="number" min="0.5" step="0.5" value="${escapeHtml(task.duration)}" /></td>
          <td><span class="date-range">${task.start ? `${displayDate(task.start)} - ${displayDate(taskDisplayEnd(task))}` : "未排期"}</span></td>
          <td><button class="delete-button" type="button" data-delete-import="video:${task.id}" aria-label="删除任务">×</button></td>
        </tr>
      `
    )
    .join("");
}

function renderImportedTable(board) {
  const table = $(`[data-table="${board}"]`);
  const tasks = filteredImported(board);
  const totalPages = clampTablePage(board, tasks.length);
  const currentPage = state.tablePage[board];
  const pageTasks = tasks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const searchInput = $(`[data-task-search="${board}"]`);
  if (searchInput && searchInput.value !== state.taskSearch[board]) searchInput.value = state.taskSearch[board];
  $(`[data-task-count="${board}"]`).textContent = `${state.imported[board].length} 个导入任务`;
  $(`[data-page-info="${board}"]`).textContent = `第 ${currentPage}/${totalPages} 页，当前 ${pageTasks.length} 条`;
  if (board === "video") {
    table.innerHTML = `
      <thead>
        <tr>
          <th>sku别名</th><th>任务语种</th><th>任务类型</th><th>摄像师</th><th>任务状态</th>
          <th>优先级</th><th>创建时间</th><th>关联sku</th><th>时长</th><th>排期</th><th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${
          pageTasks.length
            ? renderVideoImportedRows(pageTasks)
            : `<tr><td class="empty-state" colspan="11">还没有导入任务。可以上传 Excel/CSV，或粘贴表格内容。</td></tr>`
        }
      </tbody>
    `;
    $(`[data-pagination="${board}"]`).innerHTML = `
      <button class="ghost-button" type="button" data-page-prev="${board}" ${currentPage <= 1 ? "disabled" : ""}>上一页</button>
      <span>每页最多 10 条</span>
      <button class="ghost-button" type="button" data-page-next="${board}" ${currentPage >= totalPages ? "disabled" : ""}>下一页</button>
    `;
    return;
  }
  table.innerHTML = `
    <thead>
      <tr>
        <th>sku别名</th><th>产品标题</th><th>产品类型</th><th>样品</th><th>预计到港</th><th>最早交期</th>
        <th>${boardMeta[board].personLabel}</th><th>拍摄内容</th><th>时长</th><th>排期</th><th>操作</th>
      </tr>
    </thead>
    <tbody>
      ${
        pageTasks.length
          ? pageTasks
              .map(
                (task) => `
            <tr class="${state.highlightedTask[board] === task.id ? "table-row-highlight" : ""}">
              <td>${readOnlyCell(task.sku)}</td>
              <td>${readOnlyCell(task.title)}</td>
              <td>${readOnlyCell(task.productType)}</td>
              <td><input class="table-input" data-import-field="${board}:${task.id}:sample" value="${escapeHtml(task.sample)}" /></td>
              <td><input class="table-input" data-import-field="${board}:${task.id}:eta" type="date" value="${escapeHtml(task.eta)}" /></td>
              <td>${readOnlyCell(displayDate(task.earliestDue) || task.earliestDue)}</td>
              <td><input class="table-input" data-import-field="${board}:${task.id}:assignee" value="${escapeHtml(task.assignee)}" /></td>
              <td>
                <select class="table-select" data-import-field="${board}:${task.id}:content">
                  ${state.rules[board]
                    .map((rule) => `<option value="${escapeHtml(rule.content)}"${rule.content === task.content ? " selected" : ""}>${escapeHtml(rule.content)}</option>`)
                    .join("")}
                </select>
              </td>
              <td>${task.duration}天</td>
              <td><span class="date-range">${task.start ? `${displayDate(task.start)} - ${displayDate(taskDisplayEnd(task))}` : "未排期"}</span></td>
              <td><button class="delete-button" type="button" data-delete-import="${board}:${task.id}" aria-label="删除任务">×</button></td>
            </tr>
          `
              )
              .join("")
          : `<tr><td class="empty-state" colspan="11">还没有导入任务。可以上传 Excel/CSV，或粘贴表格内容。</td></tr>`
      }
    </tbody>
  `;
  $(`[data-pagination="${board}"]`).innerHTML = `
    <button class="ghost-button" type="button" data-page-prev="${board}" ${currentPage <= 1 ? "disabled" : ""}>上一页</button>
    <span>每页最多 10 条</span>
    <button class="ghost-button" type="button" data-page-next="${board}" ${currentPage >= totalPages ? "disabled" : ""}>下一页</button>
  `;
}

function renderTempTable(board) {
  const table = $(`[data-temp-table="${board}"]`);
  $(`[data-temp-count="${board}"]`).textContent = `${state.temp[board].length} 个待排/进行中`;
  table.innerHTML = `
    <thead>
      <tr>
        <th>已完成</th><th>sku别名</th><th>对接人</th><th>任务备注</th><th>${boardMeta[board].personLabel}</th><th>预计耗时</th><th>预计完成时间</th><th>操作</th>
      </tr>
    </thead>
    <tbody>
      ${
        state.temp[board].length
          ? state.temp[board]
              .map(
                (task) => `
            <tr class="${state.highlightedTask[board] === task.id ? "table-row-highlight" : ""}">
              <td><input class="task-complete-box" type="checkbox" data-complete-temp="${board}:${task.id}" aria-label="标记临时任务已完成" /></td>
              <td><input class="table-input" data-temp-field="${board}:${task.id}:sku" value="${escapeHtml(task.sku)}" /></td>
              <td><input class="table-input" data-temp-field="${board}:${task.id}:contact" value="${escapeHtml(task.contact)}" /></td>
              <td><input class="table-input" data-temp-field="${board}:${task.id}:note" value="${escapeHtml(task.note)}" /></td>
              <td>
                <select class="table-select" data-temp-field="${board}:${task.id}:assignee">
                  ${[task.assignee, "吕皇勇", "汤崇武"]
                    .filter(Boolean)
                    .filter((person, index, people) => people.indexOf(person) === index)
                    .map((person) => `<option value="${person}"${person === task.assignee ? " selected" : ""}>${person}</option>`)
                    .join("")}
                </select>
              </td>
              <td><input class="table-input" data-temp-field="${board}:${task.id}:estimateDays" type="number" min="0.5" step="0.5" value="${task.estimateDays}" /></td>
              <td><span class="date-range">${task.start ? displayDate(taskDisplayEnd(task)) : "排期后生成"}</span></td>
              <td><button class="delete-button" type="button" data-delete-temp="${board}:${task.id}" aria-label="删除临时任务">×</button></td>
            </tr>
          `
              )
              .join("")
          : `<tr><td class="empty-state" colspan="8">暂无临时任务。手动填写后会在这里单独管理。</td></tr>`
      }
    </tbody>
  `;
}

function getMonthDays(monthKey) {
  const first = fromMonthKey(monthKey);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function taskCoversDate(task, date) {
  if (!task.start) return false;
  const key = toDateKey(date);
  return key >= task.start && key <= taskDisplayEnd(task) && !isWeekend(date);
}

function renderCalendar(board) {
  const monthKey = state.monthCursor[board];
  const monthDate = fromMonthKey(monthKey);
  const root = $(`[data-calendar="${board}"]`);
  const label = $(`[data-month-label="${board}"]`);
  if (!root || !label) return;
  label.textContent = monthLabel(monthKey);
  const headers = ["日", "一", "二", "三", "四", "五", "六"].map((day) => `<div class="weekday-head">周${day}</div>`).join("");
  const days = getMonthDays(monthKey)
    .map((day) => {
      const dateKey = toDateKey(day);
      const inMonth = day.getMonth() === monthDate.getMonth();
      const tasks = calendarTasks(board).filter((task) => taskCoversDate(task, day));
      return `
        <div class="calendar-day ${inMonth ? "" : "muted"} ${isWeekend(day) ? "weekend" : ""}" data-drop-date="${board}:${dateKey}">
          <div class="day-number">${day.getDate()}${isWeekend(day) ? "<span>休</span>" : ""}</div>
          ${tasks.map((task, index) => taskCardHtml(task, index)).join("")}
        </div>
      `;
    })
    .join("");
  root.innerHTML = `${headers}${days}`;
}

function taskCardHtml(task, index) {
  const isCompleted = task.kind === "completedTemp" || Boolean(task.completedAt);
  const isPast = isPastTask(task);
  const isVideoImported = task.board === "video" && task.kind === "imported";
  const baseClass = task.kind === "temp" || isCompleted ? "task-temp" : isVideoImported ? "task-video" : index > 0 ? `task-mixed-${index % 4}` : boardMeta[task.board].taskClass;
  const dimClass = shouldDimTask(task) ? "task-card-dim" : "";
  const completedClass = isCompleted ? "task-completed" : "";
  const pastClass = isPast && !isCompleted ? "task-past" : "";
  const videoAgedClass = isVideoAgedTask(task) && !isPast ? "task-video-aged" : "";
  const videoUnassignedClass = isVideoUnassignedTask(task) && !isVideoAgedTask(task) && !isPast ? "task-video-unassigned" : "";
  const photoEtaClass = isPhotoEtaTask(task) && !isPast ? "task-photo-eta" : "";
  const highlightClass = state.highlightedTask[task.board] === task.id ? "task-card-highlight" : "";
  const personText = taskSchedulePerson(task) || "未分配";
  const subline = task.kind === "temp" || isCompleted ? `${personText} · ${task.note || "临时任务"}` : `${personText} · ${task.content}`;
  const videoCreatedDetail = isVideoImported && task.createdTime ? `创建 ${displayCreatedTime(task.createdTime)}` : "";
  const detail = isCompleted ? `已完成 ${displayDate(task.completedAt)}` : isPast ? `已过期 ${displayDate(taskDisplayEnd(task))}` : task.kind === "temp" ? `预计 ${task.duration}天` : videoCreatedDetail || (task.earliestDue ? `最早交期 ${displayDate(task.earliestDue)}` : task.title || task.productType || "");
  const dragAttrs = isCompleted || isPast ? "" : `draggable="true" data-drag-task="${task.board}:${task.kind}:${task.id}"`;
  return `
    <div class="task-card ${baseClass} ${dimClass} ${completedClass} ${pastClass} ${videoAgedClass} ${videoUnassignedClass} ${photoEtaClass} ${highlightClass}" ${dragAttrs}>
      <strong>${escapeHtml(task.sku || "未命名SKU")}</strong>
      <small>${escapeHtml(subline)}</small>
      <small>${escapeHtml(detail)}</small>
    </div>
  `;
}

function peopleForBoard(board) {
  return [...new Set(allTasks(board).map(taskSchedulePerson).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
}

function monthRange(monthKey, currentMonthUsesToday = true) {
  const monthStart = fromMonthKey(monthKey);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const today = toDate(toDateKey(new Date()));
  const start = currentMonthUsesToday && toMonthKey(today) === monthKey && today > monthStart ? today : monthStart;
  return { start, end: monthEnd };
}

function taskOverlapsRange(task, start, end) {
  if (!task.start || !task.end) return false;
  return toDate(task.start) <= end && toDate(task.end) >= start;
}

function taskWorkdaysInRange(task, start, end) {
  if (!taskOverlapsRange(task, start, end)) return 0;
  const taskStart = toDate(task.start);
  const taskEnd = toDate(task.end);
  const overlapStart = taskStart > start ? taskStart : start;
  const overlapEnd = taskEnd < end ? taskEnd : end;
  return Math.min(workdaysBetween(overlapStart, overlapEnd), normalizeHalfDay(task.duration));
}

function uniqueSkuCount(tasks) {
  return new Set(tasks.map((task) => task.sku || task.id)).size;
}

function helpTip(text) {
  const safeText = escapeHtml(text);
  return `<span class="help-tip" tabindex="0" data-tip="${safeText}" aria-label="${safeText}">?</span>`;
}

function metricHelpText(board, metric) {
  const text = {
    photo: {
      remainingSku: "剩余SKU：按本月剩余工作日扣除未标灰任务占用天数后折算，同时不超过总产能上限扣除已排SKU后的余额；摄影按2天1个SKU计算。",
      scheduledSku: "已排SKU：统计本月已排进日历的摄影任务SKU数量，按SKU去重。",
      taskCount: "任务数：统计本月参与摄影剩余产能计算的任务数量。"
    },
    video: {
      remainingSku: "剩余SKU：按本月剩余工作日扣除未标灰任务占用天数后折算，同时不超过总产能上限扣除已排SKU后的余额；摄像按1天1个SKU计算。",
      scheduledSku: "已排SKU：统计当月已排进日历的摄像高亮任务数量，不按SKU去重。",
      taskCount: "任务数：统计当月该摄像师负责的所有摄像任务数量，包含高亮和非高亮任务。"
    }
  };
  return text[board][metric];
}

function metricLabel(board, metric, label) {
  return `<span class="metric-label">${label}${helpTip(metricHelpText(board, metric))}</span>`;
}

function isVideoCapacityHighlightedTask(task) {
  return task.board === "video" && !isPastTask(task) && (task.kind === "temp" || isVideoAgedTask(task));
}

function capacityKey(board, person, monthKey) {
  return `${board}::${person}::${monthKey}`;
}

function defaultCapacityLimit(board, monthKey) {
  const { start, end } = monthRange(monthKey, true);
  return Math.floor(workdaysBetween(start, end) / boardMeta[board].daysPerSku);
}

function getCapacityLimit(board, person, monthKey) {
  const key = capacityKey(board, person, monthKey);
  return Number.isFinite(Number(state.capacityLimits[key])) ? Number(state.capacityLimits[key]) : defaultCapacityLimit(board, monthKey);
}

function setCapacityLimit(board, person, monthKey, value) {
  state.capacityLimits[capacityKey(board, person, monthKey)] = Math.max(0, Math.floor(Number(value) || 0));
}

function personCapacity(board, person, monthKey) {
  const { start, end } = monthRange(monthKey, true);
  const fullMonth = monthRange(monthKey, false);
  const monthTasks = activeCapacityTasks(board).filter((task) => taskSchedulePerson(task) === person && taskOverlapsRange(task, start, end));
  const allDisplayMonthTasks = allTasks(board).filter((task) => taskSchedulePerson(task) === person && taskOverlapsRange(task, fullMonth.start, fullMonth.end));
  const scheduledSku = board === "video" ? allDisplayMonthTasks.filter(isVideoCapacityHighlightedTask).length : uniqueSkuCount(monthTasks);
  const limitUsedSku = uniqueSkuCount(monthTasks);
  const totalSku = getCapacityLimit(board, person, monthKey);
  const remainingWorkdays = workdaysBetween(start, end);
  const occupiedWorkdays = monthTasks.reduce((sum, task) => sum + taskWorkdaysInRange(task, start, end), 0);
  const dayBasedSku = Math.floor(Math.max(0, remainingWorkdays - occupiedWorkdays) / boardMeta[board].daysPerSku);
  const limitBasedSku = Math.max(0, totalSku - limitUsedSku);
  return {
    totalSku,
    scheduledSku,
    remainingSku: Math.min(limitBasedSku, dayBasedSku),
    taskCount: board === "video" ? allDisplayMonthTasks.length : monthTasks.length,
    remainingWorkdays,
    occupiedWorkdays
  };
}

function videoPendingAssignmentCount(monthKey) {
  const { start, end } = monthRange(monthKey, true);
  return allTasks("video").filter((task) => isVideoUnassignedTask(task) && !isPastTask(task) && taskOverlapsRange(task, start, end)).length;
}

function groupRemainingSku(board, people, monthKey) {
  if (board !== "video") {
    return people.reduce((sum, person) => sum + personCapacity(board, person, monthKey).remainingSku, 0);
  }
  const assignedPeopleSku = people
    .filter((person) => person !== "待分配")
    .reduce((sum, person) => sum + personCapacity(board, person, monthKey).remainingSku, 0);
  return Math.max(0, assignedPeopleSku - videoPendingAssignmentCount(monthKey));
}

function renderCapacity() {
  const monthKey = monthKeyFromOffset(state.capacityMonthOffset);
  $("#capacityMonthLabel").textContent = monthLabel(monthKey);
  $("#capacityTitle").textContent = state.capacityMonthOffset === 0 ? "本月 SKU 产能" : "次月 SKU 产能";
  ["photo", "video"].forEach((board) => {
    const people = peopleForBoard(board);
    const groupSku = groupRemainingSku(board, people, monthKey);
    $(`#${board}GroupCapacity`).textContent = `${groupSku} SKU`;
    $(`#${board}PeopleCount`).textContent = `${people.length} 人 · ${monthLabel(monthKey)}`;
    const grid = $(`#${board}PeopleGrid`);
    grid.innerHTML = people.length
      ? people
          .map((person) => {
            const capacity = personCapacity(board, person, monthKey);
            return `
              <article class="person-card" data-person="${board}:${escapeHtml(person)}" tabindex="0">
                <strong>${escapeHtml(person)}</strong>
                <label class="capacity-limit-field" onclick="event.stopPropagation()">
                  总产能上限
                  <input type="number" min="0" data-capacity-limit="${board}:${escapeHtml(person)}:${monthKey}" value="${capacity.totalSku}" />
                </label>
                <dl>
                  <div><dt>${metricLabel(board, "remainingSku", "剩余SKU")}</dt><dd>${capacity.remainingSku}</dd></div>
                  <div><dt>${metricLabel(board, "scheduledSku", "已排SKU")}</dt><dd>${capacity.scheduledSku}</dd></div>
                  <div><dt>${metricLabel(board, "taskCount", "任务数")}</dt><dd>${capacity.taskCount}</dd></div>
                </dl>
              </article>
            `;
          })
          .join("")
      : `<p class="muted-text">分配${boardMeta[board].personLabel}后会自动生成个人产能。</p>`;
  });
  if (state.personal) renderPersonalCalendar(state.personal.board, state.personal.person);
}

function renderPersonalCalendar(board, person) {
  const panel = $("#personalPanel");
  const root = $("#personalCalendar");
  const monthKey = monthKeyFromOffset(state.personalMonthOffset);
  const monthDate = fromMonthKey(monthKey);
  panel.hidden = false;
  $("#personalTitle").textContent = `${person} · ${relativeMonthText(state.personalMonthOffset)}任务排期`;
  $("#personalMonthLabel").textContent = monthLabel(monthKey);
  const headers = ["日", "一", "二", "三", "四", "五", "六"].map((day) => `<div class="weekday-head">周${day}</div>`).join("");
  const days = getMonthDays(monthKey)
    .map((day, index) => {
      const dateKey = toDateKey(day);
      const inMonth = day.getMonth() === monthDate.getMonth();
      const tasks = calendarTasks(board).filter((task) => taskSchedulePerson(task) === person && taskCoversDate(task, day));
      const isPrevSwitchCell = index === 0 || (inMonth && day.getDate() === 1);
      const isLastMonthDay = inMonth && day.getDate() === new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      const isNextSwitchCell = index === 41 || isLastMonthDay;
      return `
        <div class="calendar-day ${inMonth ? "" : "muted"} ${isWeekend(day) ? "weekend" : ""}" data-drop-date="${board}:${dateKey}" ${isPrevSwitchCell ? 'data-personal-edge-prev="true"' : ""} ${isNextSwitchCell ? 'data-personal-edge-next="true"' : ""}>
          <div class="day-number">${day.getDate()}${isWeekend(day) ? "<span>休</span>" : ""}</div>
          ${tasks.map((task, index) => taskCardHtml(task, index)).join("")}
        </div>
      `;
    })
    .join("");
  root.innerHTML = `${headers}${days}`;
}

function completedRangeLabel(type, value) {
  if (type === "month") return monthLabel(value);
  if (type === "quarter") return `${value.replace("-Q", "年 第")}季度`;
  return `${value}年`;
}

function taskMatchesCompletedRange(task, type, value) {
  const completedAt = toDate(task.completedAt);
  if (!completedAt) return false;
  if (type === "month") return toMonthKey(completedAt) === value;
  const [year, quarter] = value.split("-Q");
  const quarterNumber = Math.floor(completedAt.getMonth() / 3) + 1;
  return String(completedAt.getFullYear()) === year && String(quarterNumber) === quarter;
}

function populateCompletedTimeOptions() {
  const type = $("#completedRangeType").value;
  const select = $("#completedTimeInput");
  const now = new Date();
  const year = now.getFullYear();
  if (type === "month") {
    select.innerHTML = Array.from({ length: 24 }, (_, index) => {
      const date = new Date(year, now.getMonth() - index, 1);
      const value = toMonthKey(date);
      return `<option value="${value}">${monthLabel(value)}</option>`;
    }).join("");
    return;
  }
  select.innerHTML = [year - 1, year, year + 1]
    .flatMap((itemYear) =>
      [1, 2, 3, 4].map((quarter) => {
        const value = `${itemYear}-Q${quarter}`;
        return `<option value="${value}">${itemYear}年 第${quarter}季度</option>`;
      })
    )
    .join("");
  select.value = `${year}-Q${Math.floor(now.getMonth() / 3) + 1}`;
}

function openCompletedDialog(board) {
  completedContext.board = board;
  $("#completedRangeType").value = "month";
  populateCompletedTimeOptions();
  $("#completedDialog").showModal();
}

function currentCompletedFilter() {
  const type = $("#completedRangeType").value;
  return { type, value: $("#completedTimeInput").value || toMonthKey(new Date()) };
}

function showCompletedPage() {
  const filter = currentCompletedFilter();
  completedContext = { ...completedContext, ...filter };
  $("#completedDialog").close();
  $(".app-shell").hidden = true;
  $("#completedPage").hidden = false;
  renderCompletedPage();
}

function filteredCompletedTasks() {
  return completedTasks(completedContext.board).filter((task) => taskMatchesCompletedRange(task, completedContext.type, completedContext.value));
}

function renderCompletedPage() {
  const board = completedContext.board;
  const tasks = filteredCompletedTasks();
  $("#completedTitle").textContent = `${boardMeta[board].label}已完成临时任务 · ${completedRangeLabel(completedContext.type, completedContext.value)}`;
  $("#completedSummary").textContent = `${tasks.length} 个已完成任务`;
  $("#deleteMonthCompletedBtn").disabled = completedContext.type !== "month";
  $("#completedList").innerHTML = tasks.length
    ? tasks
        .map(
          (task) => `
            <tr>
              <td><input type="checkbox" data-completed-select="${task.id}" aria-label="选择已完成任务" /></td>
              <td>${escapeHtml(task.sku || "-")}</td>
              <td>${escapeHtml(task.contact || "-")}</td>
              <td>${escapeHtml(task.note || "-")}</td>
              <td>${escapeHtml(task.assignee || "-")}</td>
              <td>${task.duration || task.estimateDays || 1}天</td>
              <td>${task.start ? `${displayDate(task.start)} - ${displayDate(taskDisplayEnd(task))}` : "-"}</td>
              <td>${displayDate(task.completedAt) || "-"}</td>
            </tr>
          `
        )
        .join("")
    : `<tr><td class="empty-state" colspan="8">当前范围内还没有已完成临时任务。</td></tr>`;
}

function deleteSelectedCompleted() {
  const selected = $$("[data-completed-select]:checked").map((input) => input.dataset.completedSelect);
  if (!selected.length) {
    showToast("请先勾选要删除的已完成任务。");
    return;
  }
  if (!confirm(`确认删除勾选的 ${selected.length} 个已完成任务吗？删除后不可恢复。`)) return;
  const board = completedContext.board;
  completedDb[board] = completedDb[board].filter((task) => !selected.includes(task.id));
  saveCompletedDb();
  renderCompletedPage();
  render();
  showToast("已删除勾选的已完成任务。");
}

function deleteCurrentMonthCompleted() {
  if (completedContext.type !== "month") {
    showToast("请先筛选到具体月份，再删除该月份任务。");
    return;
  }
  const board = completedContext.board;
  const tasks = filteredCompletedTasks();
  if (!tasks.length) {
    showToast("当前筛选月份没有可删除的已完成任务。");
    return;
  }
  const label = completedRangeLabel("month", completedContext.value);
  if (!confirm(`确认删除 ${label} 筛选出的 ${tasks.length} 个已完成任务吗？删除后不可恢复。`)) return;
  completedDb[board] = completedDb[board].filter((task) => !taskMatchesCompletedRange(task, "month", completedContext.value));
  saveCompletedDb();
  renderCompletedPage();
  render();
  showToast("已删除筛选月份的已完成任务。");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((header) => String(header).trim());
  return rows.slice(1).map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index] ?? "";
    });
    return item;
  });
}

async function importFile(file, board) {
  const ext = file.name.split(".").pop().toLowerCase();
  let rows = [];
  if (["xlsx", "xls"].includes(ext)) {
    if (!window.XLSX) {
      showToast("Excel 解析库未加载。请联网打开页面，或先把表格另存为 CSV 后导入。");
      return;
    }
    const data = await file.arrayBuffer();
    const workbook = window.XLSX.read(data, { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = window.XLSX.utils.sheet_to_json(sheet, { defval: "" });
  } else {
    const text = await file.text();
    rows = rowsToObjects(parseCsv(text));
  }
  importRows(rows, board);
}

function importRows(rows, board) {
  const tasks = rows.map((row) => mapRow(row, board)).filter((task) => task.sku || task.title);
  state.imported[board] = tasks;
  state.tablePage[board] = 1;
  state.taskSearch[board] = "";
  state.highlightedTask[board] = "";
  autoSchedule(board, { preserveTempSchedule: true, silent: true });
  saveState();
  render();
  showToast(`已刷新导入 ${tasks.length} 个${boardMeta[board].label}任务，并自动更新排期。`);
}

function downloadTemplate(board) {
  const person = boardMeta[board].personLabel;
  const headers =
    board === "video"
      ? ["sku别名", "任务语种", "任务类型", "摄像师", "任务状态", "优先级", "创建时间", "关联sku", "时长"]
      : ["sku别名", "产品标题", "产品类型", "样品", "预计到港时间", "最早交期", person, "拍摄内容"];
  const sample =
    board === "video"
      ? ["615969 Light Gray/Black", "英", "场景视频", "吕皇勇", "待拍摄", "高", "2026-06-02 10:28:32", "", "2"]
      : ["SKU1001", "示例产品标题", "家居", "已到样", "2026-06-03", "2026-06-10", "张三", "AMAZON出图"];
  const csv = `\uFEFF${headers.join(",")}\n${sample.join(",")}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${boardMeta[board].label}任务导入模板.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function seedDemo() {
  state.imported.photo = [
    createImportedTask("photo", { sku: "SKU1001", title: "桌面收纳盒", productType: "家居", sample: "已到样", eta: "2026-06-02", earliestDue: "2026-06-08", assignee: "陈琳", content: "AMAZON出图" }),
    createImportedTask("photo", { sku: "SKU1001-B", title: "桌面收纳盒套装", productType: "家居", sample: "已到样", earliestDue: "2026-07-02", assignee: "陈琳", content: "AMAZON&NPC出图" }),
    createImportedTask("photo", { sku: "SKU2048", title: "露营灯", productType: "户外", sample: "样品在库", eta: "2026-06-01", earliestDue: "2026-06-05", assignee: "周航", content: "重点项目" })
  ];
  state.imported.video = [
    createImportedTask("video", { sku: "VID2201", title: "折叠推车", productType: "户外", sample: "已到样", eta: "2026-06-03", earliestDue: "2026-06-12", assignee: "李哲", content: "安装视频" }),
    createImportedTask("video", { sku: "VID5088", title: "智能香薰机", productType: "家电", sample: "样品在库", earliestDue: "2026-07-15", assignee: "王珂", content: "AI视频" })
  ];
  state.temp.photo = [createTempTask("photo", { sku: "TMP-P01", contact: "李想", note: "临时补拍细节", assignee: "陈琳", estimateDays: 1 })];
  state.temp.video = [createTempTask("video", { sku: "TMP-V01", contact: "赵敏", note: "临时口播素材", assignee: "李哲", estimateDays: 1 })];
  state.tablePage.photo = 1;
  state.tablePage.video = 1;
  autoSchedule("photo");
  autoSchedule("video");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function locateSearchResult(board) {
  const query = state.taskSearch[board].trim().toLowerCase();
  const task = query ? allTasks(board).find((item) => String(item.sku).toLowerCase().includes(query)) : null;
  state.highlightedTask[board] = task?.id || "";
  if (task?.start) state.monthCursor[board] = toMonthKey(toDate(task.start));
  const importedIndex = filteredImported(board).findIndex((item) => item.id === task?.id);
  state.tablePage[board] = importedIndex >= 0 ? Math.floor(importedIndex / PAGE_SIZE) + 1 : 1;
}

function bindEvents() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentView = button.dataset.view;
      render();
    });
  });

  $("#seedBtn").addEventListener("click", seedDemo);
  $("#downloadTemplatePhoto").addEventListener("click", (event) => {
    event.preventDefault();
    downloadTemplate("photo");
  });
  $("#downloadTemplateVideo").addEventListener("click", (event) => {
    event.preventDefault();
    downloadTemplate("video");
  });

  $$("[data-import]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      await importFile(file, input.dataset.import);
      input.value = "";
    });
  });

  $$("[data-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const board = form.dataset.form;
      const data = Object.fromEntries(new FormData(form));
      state.temp[board].push(createTempTask(board, data));
      autoSchedule(board, { preserveTempSchedule: true, silent: true });
      form.reset();
      render();
      showToast("临时任务已添加，并自动生成排期。");
    });
  });

  $$("[data-fill-demo]").forEach((button) => {
    button.addEventListener("click", () => {
      const board = button.dataset.fillDemo;
      const form = $(`form[data-form="${board}"]`);
      form.sku.value = board === "photo" ? "TMP-P02" : "TMP-V02";
      form.contact.value = board === "photo" ? "王宁" : "许诺";
      form.note.value = board === "photo" ? "临时补拍主图" : "临时补录视频";
      form.assignee.value = board === "photo" ? "吕皇勇" : "汤崇武";
      form.estimateDays.value = board === "photo" ? 0.5 : 1;
    });
  });

  document.addEventListener("input", (event) => {
    const ruleContent = event.target.dataset.ruleContent;
    const ruleDays = event.target.dataset.ruleDays;
    const importField = event.target.dataset.importField;
    const tempField = event.target.dataset.tempField;
    const taskSearch = event.target.dataset.taskSearch;
    const capacityLimit = event.target.dataset.capacityLimit;

    if (ruleContent) {
      const [board, index] = ruleContent.split(":");
      state.rules[board][Number(index)].content = event.target.value.trim() || "未命名内容";
      state.imported[board].forEach(updateImportedDuration);
      saveState();
    }

    if (ruleDays) {
      const [board, index] = ruleDays.split(":");
      state.rules[board][Number(index)].days = Math.max(1, Number(event.target.value) || 1);
      state.imported[board].forEach(updateImportedDuration);
      render();
    }

    if (importField) {
      const [board, taskId, field] = importField.split(":");
      const task = state.imported[board].find((item) => item.id === taskId);
      if (!task) return;
      const lockedFields = board === "photo" ? ["sku", "title", "productType", "earliestDue"] : ["sku", "language", "taskType", "priority", "createdTime", "relatedSku"];
      if (lockedFields.includes(field)) return;
      if (["eta", "earliestDue"].includes(field)) {
        task[field] = toDateKey(event.target.value);
      } else if (field === "duration") {
        task.duration = normalizeHalfDay(event.target.value);
        task.manualDuration = true;
        refreshTaskRangeFromStart(task);
      } else {
        task[field] = event.target.value;
      }
      if (field === "taskType") {
        task.content = task.taskType;
        if (!task.manualDuration) updateImportedDuration(task);
      }
      if (field === "content") updateImportedDuration(task);
      if (board === "video") {
        autoSchedule(board, { preserveTempSchedule: true, silent: true });
      }
      saveState();
      renderCalendar(board);
      renderCapacity();
    }

    if (tempField) {
      const [board, taskId, field] = tempField.split(":");
      const task = state.temp[board].find((item) => item.id === taskId);
      if (!task) return;
      task[field] = field === "estimateDays" ? normalizeHalfDay(event.target.value) : event.target.value;
      task.duration = normalizeHalfDay(task.estimateDays);
      if (field === "estimateDays") refreshTaskRangeFromStart(task);
      saveState();
      renderCalendar(board);
      renderCapacity();
    }

    if (taskSearch) {
      state.taskSearch[taskSearch] = event.target.value;
      locateSearchResult(taskSearch);
      renderBoard(taskSearch);
    }

    if (capacityLimit) {
      const [board, person, monthKey] = capacityLimit.split(":");
      setCapacityLimit(board, person, monthKey, event.target.value);
      saveState();
    }
  });

  document.addEventListener("change", (event) => {
    const completeTemp = event.target.dataset.completeTemp;
    const capacityLimit = event.target.dataset.capacityLimit;
    const tempField = event.target.dataset.tempField;
    if (completeTemp && event.target.checked) {
      const [board, taskId] = completeTemp.split(":");
      archiveTempTask(board, taskId);
    }
    if (tempField) {
      const [board, taskId, field] = tempField.split(":");
      const task = state.temp[board].find((item) => item.id === taskId);
      if (!task) return;
      task[field] = field === "estimateDays" ? normalizeHalfDay(event.target.value) : event.target.value;
      task.duration = normalizeHalfDay(task.estimateDays);
      if (field === "estimateDays") refreshTaskRangeFromStart(task);
      saveState();
      renderCalendar(board);
      renderCapacity();
    }
    if (capacityLimit) {
      renderCapacity();
      saveState();
    }
  });

  document.addEventListener("click", (event) => {
    const addRule = event.target.dataset.addRule;
    const deleteRule = event.target.dataset.deleteRule;
    const deleteImport = event.target.dataset.deleteImport;
    const deleteTemp = event.target.dataset.deleteTemp;
    const monthPrev = event.target.dataset.monthPrev;
    const monthNext = event.target.dataset.monthNext;
    const pagePrev = event.target.dataset.pagePrev;
    const pageNext = event.target.dataset.pageNext;
    const clearSearch = event.target.dataset.clearSearch;
    const person = event.target.closest("[data-person]");
    const openPaste = event.target.dataset.openPaste;
    const openCompleted = event.target.dataset.openCompleted;

    if (addRule) {
      state.rules[addRule].push({ content: "自定义拍摄内容", days: 1 });
      render();
    }
    if (deleteRule) {
      const [board, index] = deleteRule.split(":");
      if (state.rules[board].length <= 1) return;
      state.rules[board].splice(Number(index), 1);
      render();
    }
    if (deleteImport) {
      const [board, taskId] = deleteImport.split(":");
      state.imported[board] = state.imported[board].filter((task) => task.id !== taskId);
      render();
    }
    if (deleteTemp) {
      const [board, taskId] = deleteTemp.split(":");
      state.temp[board] = state.temp[board].filter((task) => task.id !== taskId);
      render();
    }
    if (monthPrev) {
      state.monthCursor[monthPrev] = addMonths(state.monthCursor[monthPrev], -1);
      render();
    }
    if (monthNext) {
      state.monthCursor[monthNext] = addMonths(state.monthCursor[monthNext], 1);
      render();
    }
    if (pagePrev) {
      state.tablePage[pagePrev] -= 1;
      renderImportedTable(pagePrev);
      saveState();
    }
    if (pageNext) {
      state.tablePage[pageNext] += 1;
      renderImportedTable(pageNext);
      saveState();
    }
    if (clearSearch) {
      state.taskSearch[clearSearch] = "";
      state.highlightedTask[clearSearch] = "";
      state.tablePage[clearSearch] = 1;
      renderBoard(clearSearch);
    }
    if (person && !event.target.closest("[data-capacity-limit]")) {
      const [board, ...nameParts] = person.dataset.person.split(":");
      state.personal = { board, person: nameParts.join(":") };
      state.personalMonthOffset = state.capacityMonthOffset;
      state.currentView = "capacity";
      render();
      $("#personalPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (openPaste) {
      pasteTargetBoard = openPaste;
      $("#pasteText").value = "";
      $("#pasteDialog").showModal();
    }
    if (openCompleted) {
      openCompletedDialog(openCompleted);
    }
  });

  $("#capacityPrev").addEventListener("click", () => {
    state.capacityMonthOffset = clampMonthOffset(state.capacityMonthOffset - 1);
    renderCapacity();
    saveState();
  });
  $("#capacityNext").addEventListener("click", () => {
    state.capacityMonthOffset = clampMonthOffset(state.capacityMonthOffset + 1);
    renderCapacity();
    saveState();
  });
  $("#personalPrev").addEventListener("click", () => {
    state.personalMonthOffset = clampPersonalMonthOffset(state.personalMonthOffset - 1);
    renderCapacity();
    saveState();
  });
  $("#personalNext").addEventListener("click", () => {
    state.personalMonthOffset = clampPersonalMonthOffset(state.personalMonthOffset + 1);
    renderCapacity();
    saveState();
  });
  $("#closePersonalBtn").addEventListener("click", () => {
    state.personal = null;
    $("#personalPanel").hidden = true;
    saveState();
  });
  $("#confirmPasteBtn").addEventListener("click", () => {
    const text = $("#pasteText").value.trim();
    if (!text) return;
    const delimiter = text.includes("\t") ? "\t" : ",";
    importRows(rowsToObjects(text.split(/\r?\n/).map((line) => line.split(delimiter))), pasteTargetBoard);
    $("#pasteDialog").close();
  });
  $("#completedRangeType").addEventListener("change", populateCompletedTimeOptions);
  $("#viewCompletedBtn").addEventListener("click", showCompletedPage);
  $("#backToBoardBtn").addEventListener("click", () => {
    $("#completedPage").hidden = true;
    $(".app-shell").hidden = false;
    render();
  });
  $("#deleteSelectedCompletedBtn").addEventListener("click", deleteSelectedCompleted);
  $("#deleteMonthCompletedBtn").addEventListener("click", deleteCurrentMonthCompleted);

  document.addEventListener("dragstart", (event) => {
    const source = event.target.closest("[data-drag-task]");
    if (!source) return;
    personalEdgeSwitchedThisDrag = false;
    event.dataTransfer.setData("text/plain", source.dataset.dragTask);
    event.dataTransfer.effectAllowed = "move";
  });
  document.addEventListener("dragover", (event) => {
    const target = event.target.closest("[data-drop-date]");
    if (!target) return;
    event.preventDefault();
    target.classList.add("drop-target");
    if (target.dataset.personalEdgePrev && state.personal && state.personalMonthOffset > -1 && !personalEdgeSwitchTimer && !personalEdgeSwitchedThisDrag) {
      personalEdgeSwitchTimer = setTimeout(() => {
        state.personalMonthOffset = clampPersonalMonthOffset(state.personalMonthOffset - 1);
        personalEdgeSwitchedThisDrag = true;
        personalEdgeSwitchTimer = 0;
        renderCapacity();
        saveState();
        showToast("已切换到上个月，可继续拖到目标日期。");
      }, 180);
    }
    if (target.dataset.personalEdgeNext && state.personal && state.personalMonthOffset < 1 && !personalEdgeSwitchTimer && !personalEdgeSwitchedThisDrag) {
      personalEdgeSwitchTimer = setTimeout(() => {
        state.personalMonthOffset = clampPersonalMonthOffset(state.personalMonthOffset + 1);
        personalEdgeSwitchedThisDrag = true;
        personalEdgeSwitchTimer = 0;
        renderCapacity();
        saveState();
        showToast("已切换到下个月，可继续拖到目标日期。");
      }, 180);
    }
  });
  document.addEventListener("dragleave", (event) => {
    event.target.closest("[data-drop-date]")?.classList.remove("drop-target");
  });
  document.addEventListener("drop", (event) => {
    clearTimeout(personalEdgeSwitchTimer);
    personalEdgeSwitchTimer = 0;
    const target = event.target.closest("[data-drop-date]");
    if (!target) return;
    event.preventDefault();
    target.classList.remove("drop-target");
    const [sourceBoard, kind, taskId] = event.dataTransfer.getData("text/plain").split(":");
    const [targetBoard, dateKey] = target.dataset.dropDate.split(":");
    if (sourceBoard !== targetBoard) return;
    const list = kind === "temp" ? state.temp[sourceBoard] : state.imported[sourceBoard];
    const task = list.find((item) => item.id === taskId);
    if (!task || isWeekend(toDate(dateKey))) {
      showToast("请拖到工作日。");
      return;
    }
    reflowPersonScheduleFromDrop(sourceBoard, task, dateKey);
    if (state.personal && sourceBoard === state.personal.board) {
      state.personalMonthOffset = clampPersonalMonthOffset(monthOffsetFromCurrent(toMonthKey(toDate(dateKey))));
    }
    saveState();
    render();
    showToast("任务排期已调整。");
  });
  document.addEventListener("dragend", () => {
    clearTimeout(personalEdgeSwitchTimer);
    personalEdgeSwitchTimer = 0;
    personalEdgeSwitchedThisDrag = false;
  });
}

bindEvents();
render();
