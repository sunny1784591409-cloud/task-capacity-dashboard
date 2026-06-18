const STORAGE_KEY = "photo-video-capacity-board-v3";
const COMPLETED_STORAGE_KEY = "photo-video-temp-completed-db-v1";
const WORKBENCH_STORAGE_KEY = "project-workbench-v2";
const LEGACY_KEYS = ["photo-video-capacity-board-v2", "photo-video-capacity-board-v1"];
const PAGE_SIZE = 10;
const DAY_MS = 24 * 60 * 60 * 1000;
const PROJECT_TYPES = ["老品风格优化项目", "品牌向优化项目-店铺/VI", "设计款营销项目", "重点视频", "TK项目"];
const PROJECT_STATUSES = ["待开始", "进行中", "暂停", "已完成"];
const TASK_MODULES = ["方案制定", "Amazon出图", "NPC出图", "平面排版", "NPC排版", "视频", "TK视频"];
const TASK_STATUSES = ["待开始", "已分配", "进行中", "已完成", "延期", "暂停"];
const PRIORITIES = ["高", "中", "低"];
const DELIVERY_MODULES = ["Amazon出图", "NPC出图", "平面排版", "NPC排版", "视频", "TK视频"];
const DELIVERY_STATUSES = ["待提交", "待验收", "验收通过", "已驳回", "已完成"];
const REVIEW_STATUSES = ["草稿", "待提交", "已归档"];

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

const viewMeta = {
  dashboard: { eyebrow: "Command Center", title: "工作台" },
  projects: { eyebrow: "Project Gantt", title: "项目甘特" },
  taskpool: { eyebrow: "Task Pool", title: "任务池" },
  load: { eyebrow: "Capacity Load", title: "产能负载" },
  delivery: { eyebrow: "Delivery", title: "素材交付" },
  review: { eyebrow: "Review", title: "数据复盘" },
  completedDb: { eyebrow: "Completed Database", title: "完成数据库" },
  capacity: { eyebrow: "Capacity", title: "SKU 产能看板" }
};

const viewGroups = {
  workbench: {
    views: ["dashboard", "projects", "load", "delivery", "review", "completedDb"],
    defaultView: "dashboard",
    brandEyebrow: "Project Ops",
    brandTitle: "重点项目工作台"
  },
  capacity: {
    views: ["photo", "video", "capacity"],
    defaultView: "capacity",
    brandEyebrow: "Production Board",
    brandTitle: "摄影摄像产能看板"
  }
};

const routeModule = getRouteModule();

const WORKBENCH_SEED_TSV = `614643 Black		推背椅	老品风格优化项目	2025-09-15	2025-10-28	已完成	图片定稿,视频定稿	李芳芳	2025-09-26	2025-09-26		✅正常	肖杰	2025-10-17	2025-10-17	✅正常			程颖	2025-10-29	2025-10-28	✅正常		李锦禧	2025-11-14	2025-11-10		✅正常	2026-01-05
春季大促			品牌向优化项目-店铺/VI	2025-12-29	2026-02-12	已完成	图片定稿	程颖					庄钟榕						程颖	2026-02-12	2026-02-11	✅正常							2026-02-13
春季主题			品牌向优化项目-店铺/VI	2025-12-19	2026-02-09	已完成	图片定稿	程颖	2025-12-25	2025-12-23		✅正常	庄钟榕,肖杰,娄健	2026-01-04	2026-01-04	✅正常			程颖	2026-01-09	2026-02-12	❗️延期34天		郑雨豪	2026-01-16	2026-01-19	12/29已提交脚本安排生图; 1/3收到场景图片素材;1/19输出初稿， 1/21收到修改意见	❗️延期3天	2026-02-13
593156 Brown*2		沙发椅/围椅	老品风格优化项目	2025-09-15	2025-10-31	已完成	图片定稿,视频定稿	李芳芳	2025-09-26	2025-09-26		✅正常	吕皇勇	2025-10-10	2025-09-26	✅正常			程颖	2025-10-29	2025-10-31	❗️延期2天		郑雨豪	2025-11-14	2025-11-07		✅正常	2026-01-05
614722 Beige(queen)		软包床	老品风格优化项目	2025-09-15	2025-11-12	已完成	图片定稿	辜锡宏	2025-09-26	2025-09-24		✅正常	娄健	2025-10-17	2025-10-14	✅正常			金加静	2025-10-29	2025-11-12	❗️延期14天							2026-01-05
614722 Light Gray(queen)		软包床	老品风格优化项目	2025-09-15	2025-11-12	已完成	图片定稿,视频定稿	辜锡宏	2025-09-26	2025-09-24		✅正常	娄健,庄钟榕	2025-10-17	2025-10-31	❗️延期14天			金加静	2025-10-29	2025-11-12	❗️延期14天			2025-11-14	2025-11-13		✅正常	2026-01-05
615207 Ivory(queen)		软包床	老品风格优化项目	2025-09-15	2025-11-12	已完成	图片定稿,视频定稿	辜锡宏	2025-09-26	2025-09-24		✅正常	娄健	2025-10-17	2025-10-14	✅正常			金加静	2025-10-29	2025-11-12	❗️延期14天		郑雨豪	2025-11-14	2025-11-04		✅正常	2026-01-05
592162 Green(6ft)		圣诞树	老品风格优化项目	2025-10-28	2025-11-20	已完成	图片定稿,视频定稿	辜锡宏	2025-11-05	2025-10-31		✅正常	邹栩欣						邹栩欣	2025-11-28	2025-11-20	✅正常		郑雨豪	2025-11-04	2025-11-04		✅正常	2026-01-05
593433 Espresso		宠物边桌	老品风格优化项目	2025-12-11	2026-01-07	已完成	图片定稿	辜锡宏,李芳芳,程颖,廖朗,张佩雯	2025-12-16	2025-12-16		✅正常	辜锡宏-Vincent Gu,陈夕佳	2025-12-29	2025-12-30	❗️延期1天			杨吉利	2026-01-09	2026-01-14	❗️延期5天							2026-01-15
592992 Light Gray		猫树	老品风格优化项目	2025-12-11	2026-01-28	已完成	图片定稿	辜锡宏,李芳芳,程颖,廖朗,张佩雯	2025-12-16	2025-12-16		✅正常	李芳芳	2025-12-29	2025-12-31	❗️延期2天			程颖	2026-01-16	2026-01-28	❗️延期12天							2026-01-28
592938 Green/Brown		猫树	老品风格优化项目	2025-12-11	2026-01-29	已完成	图片定稿	辜锡宏,李芳芳,程颖,廖朗,张佩雯	2025-12-16	2025-12-16		✅正常	李芳芳	2025-12-29	2025-12-26	✅正常			陈越,程颖	2026-01-09	2026-01-29	❗️延期20天							2026-01-29
615079 Black-田园		云朵款铁艺床	老品风格优化项目	2026-01-19	2026-02-13	已完成	图片定稿	陈夕佳	2026-01-21	2026-01-21		✅正常	陈夕佳,庄钟榕	2026-01-30	2026-01-29	✅正常			彭怡	2026-02-11	2026-02-13	❗️延期2天							2026-02-24
615337 AI视频		铁艺床	重点视频	2026-02-27	2026-03-11	已完成	视频定稿	马华敏	2026-02-28	2026-02-28		✅正常	李芳芳,肖杰											郑雨豪	2026-03-11	2026-03-11		✅正常	2026-04-09
593129 Blue		海洋款猫树	老品风格优化项目	2026-02-24	2026-03-13	已完成	图片定稿	李芳芳	2026-02-28			❗️延期108天	李芳芳	2026-03-06		❗️延期102天			张海彬	2026-03-17	2026-03-13	✅正常							2026-03-17
614722 Dark Gray(queen)		软包床	老品风格优化项目	2026-03-02	2026-03-26	已完成	图片定稿	陈夕佳	2026-03-06	2026-03-09		❗️延期3天	代紫薇	2026-03-20	2026-03-19	✅正常			谭逸纯	2026-04-03	2026-03-26	✅正常							2026-03-30
615079 White-田园		云朵款铁艺床	老品风格优化项目	2026-03-02	2026-04-06	已完成	图片定稿	辜锡宏	2026-01-21	2026-01-21		✅正常	娄健	2026-03-20	2026-03-18	✅正常			彭怡	2026-04-03	2026-04-06	❗️延期3天							2026-04-06
615144 Black-现代简约		V型款铁艺床	老品风格优化项目	2026-03-02	2026-04-09	已完成	图片定稿	李芳芳	2026-01-21	2026-01-21		✅正常	肖杰	2026-03-20	2026-02-25	✅正常			彭怡	2026-04-03	2026-04-09	❗️延期6天							2026-04-09
615207 Dark Gray(queen)		软包床	老品风格优化项目	2026-03-02	2026-04-07	已完成	图片定稿	陈夕佳	2026-03-06	2026-03-11		❗️延期5天	代紫薇	2026-03-20	2026-03-19	✅正常			谭逸纯,程颖	2026-04-07	2026-04-07	✅正常							2026-04-08
夏季主题视频			重点视频	2026-03-23	2026-04-22	已完成	视频定稿	马华敏	2026-03-27	2026-03-26		✅正常	辜锡宏	2026-04-08	2026-04-13	❗️延期5天								郑雨豪	2026-04-20	2026-04-22		❗️延期2天	2026-04-29
615144 White		V型款铁艺床	老品风格优化项目	2026-04-13	2026-05-13	已完成	图片定稿	陈夕佳	2026-04-17	2026-04-22		❗️延期5天	代紫薇	2026-04-28	2026-05-06	❗️延期8天			彭怡	2026-05-13	2026-05-13	✅正常							2026-05-18
614823 Dark Gray		猫树	老品风格优化项目	2025-10-28		暂停	图片定稿,视频定稿	李芳芳	2025-11-05	2025-11-05		✅正常	吕皇勇	2025-11-13	2025-11-14	❗️延期1天			陈越	2025-11-28		❗️延期200天		郑雨豪	2025-12-12	2025-12-12		✅正常	2025-12-30
615138 Dark Gray(queen)		软包床	老品风格优化项目	2026-03-02		暂停	方案制定	辜锡宏	2026-02-06	2026-01-21		✅正常	庄钟榕	2026-03-20		❗️延期88天			彭豪放	2026-04-03		❗️延期74天							2026-03-03
夏季主题页面			品牌向优化项目-店铺/VI	2026-03-13		已完成	图片定稿	宦欣妍,辜锡宏	2026-03-20	2026-03-20		✅正常	庄钟榕,辜锡宏	2026-04-07		❗️延期70天			宦欣妍										2026-06-12
办公家具系列页面视频			重点视频	2026-04-13		进行中	摄影/3D/AI出图	马华敏	2026-04-30	2026-04-30		✅正常																	2026-04-30
Prime Day 会员日大促			品牌向优化项目-店铺/VI	2026-05-25		待开始																							2025-12-30
返校季			品牌向优化项目-店铺/VI	2026-06-15		待开始																							2025-12-30
秋季促销			品牌向优化项目-店铺/VI	2026-08-10		待开始																							2025-12-30
万圣节			品牌向优化项目-店铺/VI	2026-08-31		待开始																							2025-12-30
黑五网一大促			品牌向优化项目-店铺/VI	2026-08-31		待开始																							2025-12-30
圣诞节			品牌向优化项目-店铺/VI	2026-10-19		待开始																							2025-12-30
第一批设计款营销物料			设计款营销项目			待开始													程颖										2026-03-17
615079 Pink		云朵款铁艺床	老品风格优化项目			待开始													彭怡										2026-02-13
615079 Antique Gold		云朵款铁艺床	老品风格优化项目			待开始													彭怡										2026-02-13
616033 White&Light Natural Wood		旋转书柜	设计款营销项目	2026-05-07	2026-06-11	进行中	平面排版	李芳芳,程颖,马华敏,郑雨豪	2026-05-12	2026-05-22		❗️延期10天	李芳芳	2026-05-28	2026-05-29	❗️延期1天	吕皇勇	2026-05-18	程颖	2026-06-08	2026-06-11	❗️延期3天		郑雨豪,李锦禧					2026-06-15
615238 Light Brown		铁扶手单人休闲椅	重点视频	2026-05-05		已完成	视频定稿	马华敏	2026-05-05	2026-05-05		✅正常	陈夕佳	2026-05-20	2026-05-20	✅正常								郑雨豪	2026-05-29	2026-06-03		❗️延期5天	2026-06-04
616332--2 color		转角装饰书柜	设计款营销项目	2026-05-28		进行中	摄影/3D/AI出图	陈夕佳	2026-06-04	2026-06-12		❗️延期8天	代紫薇	2026-06-15		❗️延期1天	陈夕佳		彭梦蕓	2026-06-24		✅正常		李锦禧	2026-06-23			✅正常	2026-06-15
616376		休闲盘腿椅	设计款营销项目	2026-06-03		进行中	方案制定	辜锡宏	2026-06-09	2026-06-12		❗️延期3天	娄健,辜锡宏	2026-06-15	2026-06-15	✅正常	辜锡宏		张海彬	2026-06-23		✅正常		郑雨豪					2026-06-16
593940--3 color		多用途窄型边桌	设计款营销项目	2026-06-08		进行中	方案制定	李芳芳	2026-06-15			❗️延期1天	娄健	2026-06-24		✅正常	李芳芳		金加静	2026-07-03		✅正常		李锦禧					2026-06-15
594027		欧标可储物搁脚凳	设计款营销项目	2026-06-16		进行中		辜锡宏					肖杰				辜锡宏		杨吉利										2026-06-15
615153 Black		皇冠款铁艺床	老品风格优化项目	2026-04-13		已完成	图片定稿	辜锡宏	2026-04-17	2026-04-22		❗️延期5天	庄钟榕	2026-04-28	2026-05-08	❗️延期10天			刘文辉	2026-05-13	2026-05-28	❗️延期15天							2026-06-01
615153 White		皇冠款铁艺床	老品风格优化项目	2026-04-13		已完成	图片定稿	李芳芳	2026-04-17	2026-04-17		✅正常	庄钟榕	2026-04-28	2026-05-12	❗️延期14天			刘文辉	2026-05-13	2026-05-28	❗️延期15天							2026-06-01
615161 Antique Gold		皇冠款铁艺床	老品风格优化项目			待开始													刘文辉										2026-02-13
家庭家具系列页面视频			重点视频	2026-04-20		待开始		马华敏																					2026-04-07
运动系列页面视频			重点视频	2026-04-27		待开始		马华敏																					2026-04-07
616415--2 color		折叠旋转扩展咖啡桌	设计款营销项目	2026-06-29		待开始		辜锡宏											程颖										2026-06-01
616416--2 color		折叠扩展抽屉咖啡桌	设计款营销项目	2026-06-29		待开始		李芳芳											梁加仪										2026-06-01
594023--2 color		人宠换鞋凳	设计款营销项目	2026-07-03		待开始		陈夕佳																					2026-05-26
616429--2 color		带三层置物宠物边桌	设计款营销项目	2026-07-08		待开始		李芳芳																					2026-05-26
616449		可调节展示架&书架	设计款营销项目	2026-07-20		待开始																							2026-05-21
616450		带洞洞板窄高款2翻斗鞋柜	设计款营销项目	2026-08-03		待开始																							2026-05-21
616456		带毛毡窄高款3翻斗鞋柜	设计款营销项目	2026-08-03		待开始																							2026-05-21
616474-2 color		玄关收纳衣帽鞋架	设计款营销项目	2026-08-21		待开始																							2026-05-21`;

const prdMembers = [];
const prdProjects = [];
const prdTasks = [];
const prdDeliverables = [];
const prdReviews = [];

let workbenchDb;

const initialState = {
  currentView: "dashboard",
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
  videoScheduleSchemaVersion: 0,
  completedDbSearch: "",
  completedDbType: "",
  workbenchMonthCursor: toMonthKey(new Date())
};

let state = loadState();
let completedDb = loadCompletedDb();
let pasteTargetBoard = "photo";
let completedContext = { board: "photo", type: "month", value: toMonthKey(new Date()) };
let personalEdgeSwitchTimer = 0;
let personalEdgeSwitchedThisDrag = false;
let ganttResizeDrag = null;
let ganttDragSource = null;
let pendingConfirmAction = null;
cleanupLegacyPastCalendarTasks();
migrateVideoScheduleDefaults();
state.currentView = normalizeRouteView(state.currentView);

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function getRouteModule() {
  const moduleName = new URLSearchParams(window.location.search).get("module");
  return Object.hasOwn(viewGroups, moduleName) ? moduleName : "capacity";
}

function routeGroup() {
  return viewGroups[routeModule] || viewGroups.capacity;
}

function isRouteView(view) {
  return routeGroup().views.includes(view);
}

function normalizeRouteView(view) {
  return isRouteView(view) ? view : routeGroup().defaultView;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const WORKBENCH_COLUMNS = [
  "title",
  "image",
  "series",
  "projectType",
  "startDate",
  "finishDate",
  "status",
  "currentNode",
  "planOwner",
  "planDue",
  "planActual",
  "planNote",
  "planProgress",
  "amazonOwner",
  "amazonDue",
  "amazonActual",
  "amazonProgress",
  "npcOwner",
  "npcActual",
  "layoutOwner",
  "layoutDue",
  "layoutActual",
  "layoutProgress",
  "npcLayoutActual",
  "videoOwner",
  "videoDue",
  "videoActual",
  "videoNote",
  "videoProgress",
  "lastUpdated"
];

const WORKBENCH_TASK_MAP = [
  { module: "方案制定", owner: "planOwner", plannedDate: "planDue", actualDate: "planActual", note: "planNote", progress: "planProgress", group: "方案" },
  { module: "Amazon出图", owner: "amazonOwner", plannedDate: "amazonDue", actualDate: "amazonActual", progress: "amazonProgress", group: "出图" },
  { module: "NPC出图", owner: "npcOwner", actualDate: "npcActual", progress: "npcActual", group: "出图" },
  { module: "平面排版", owner: "layoutOwner", plannedDate: "layoutDue", actualDate: "layoutActual", progress: "layoutProgress", group: "平面" },
  { module: "NPC排版", owner: "layoutOwner", actualDate: "npcLayoutActual", progress: "npcLayoutActual", group: "平面" },
  { module: "视频", owner: "videoOwner", plannedDate: "videoDue", actualDate: "videoActual", note: "videoNote", progress: "videoProgress", group: "视频" }
];

function parseWorkbenchSeedRows(tsv) {
  return tsv
    .trim()
    .split(/\r?\n/)
    .map((line) => rowArrayToWorkbenchRow(line.split("\t")));
}

function rowArrayToWorkbenchRow(values) {
  const row = {};
  WORKBENCH_COLUMNS.forEach((key, index) => {
    row[key] = String(values[index] || "").trim();
  });
  return row;
}

function buildWorkbenchSeedFromRows(rows, options = {}) {
  const projects = [];
  const tasks = [];
  const memberMap = new Map();
  const deliverables = [];
  const reviews = [];

  rows.forEach((row, index) => {
    if (!row.title) return;
    const project = normalizeWorkbenchProject({
      id: stableWorkbenchId("p", `${index + 1}-${row.title}`),
      title: row.title,
      name: row.title,
      image: row.image,
      series: row.series,
      projectType: row.projectType,
      startDate: row.startDate,
      finishDate: row.finishDate,
      status: row.status,
      currentNode: row.currentNode,
      lastUpdated: row.lastUpdated
    });
    projects.push(project);

    WORKBENCH_TASK_MAP.forEach((definition) => {
      const task = taskFromWorkbenchRow(row, project, definition);
      if (!task) return;
      tasks.push(task);
      splitPeople(task.owner).forEach((name) => addWorkbenchMember(memberMap, name, definition.group, definition.module));
      if (DELIVERY_MODULES.includes(task.module) && task.status === "已完成") {
        deliverables.push(deliverableFromTask(task, project));
      }
    });

    if (project.status === "已完成" || project.status === "进行中") {
      reviews.push(reviewFromProject(project, tasks.filter((task) => task.projectId === project.id)));
    }
  });

  if (options.includeTkTemplates) {
    appendTkTemplates(projects, tasks, memberMap);
  }

  return {
    members: Array.from(memberMap.values()),
    projects,
    tasks,
    deliverables,
    reviews
  };
}

function taskFromWorkbenchRow(row, project, definition) {
  const owner = row[definition.owner] || "";
  const plannedDate = definition.plannedDate ? row[definition.plannedDate] : "";
  const actualDate = definition.actualDate ? row[definition.actualDate] : "";
  const note = definition.note ? row[definition.note] : "";
  const progress = definition.progress ? row[definition.progress] : "";
  if (![owner, plannedDate, actualDate, note, progress].some(Boolean)) return null;
  return normalizeWorkbenchTask({
    id: stableWorkbenchId("t", `${project.id}-${definition.module}`),
    projectId: project.id,
    module: definition.module,
    title: `${project.title} · ${definition.module}`,
    owner,
    plannedDate,
    actualDate,
    note,
    progress,
    status: deriveWorkbenchTaskStatus({ owner, actualDate, progress, projectStatus: project.status })
  });
}

function deriveWorkbenchTaskStatus({ owner, actualDate, progress, projectStatus }) {
  const text = String(progress || "");
  if (projectStatus === "暂停") return "暂停";
  if (actualDate) return "已完成";
  if (text.includes("延期")) return "延期";
  if (owner) return "已分配";
  return "待开始";
}

function splitPeople(value) {
  return String(value || "")
    .split(/[、,，/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function addWorkbenchMember(memberMap, name, group, module) {
  if (!memberMap.has(name)) {
    memberMap.set(name, {
      id: slugId("m", name),
      name,
      group,
      weeklyCapacity: 40,
      skills: module
    });
    return;
  }
  const member = memberMap.get(name);
  if (!member.group.includes(group)) member.group = `${member.group}/${group}`;
  if (!member.skills.includes(module)) member.skills = `${member.skills} / ${module}`;
}

function deliverableFromTask(task, project) {
  return normalizeWorkbenchDeliverable({
    id: stableWorkbenchId("d", task.id),
    projectId: project.id,
    taskId: task.id,
    name: `${project.title} · ${task.module}`,
    spec: task.module.includes("视频") ? "视频素材/成片" : "图片/页面素材",
    status: "验收通过",
    link: ""
  });
}

function reviewFromProject(project, relatedTasks) {
  const completed = relatedTasks.filter((task) => task.status === "已完成").length;
  const delayed = relatedTasks.filter((task) => task.status === "延期").length;
  return normalizeWorkbenchReview({
    id: stableWorkbenchId("r", project.id),
    projectId: project.id,
    platform: project.projectType,
    status: project.status === "已完成" ? "待提交" : "草稿",
    planDays: daysBetween(project.startDate, project.finishDate),
    actualDays: daysBetween(project.startDate, project.finishDate),
    sessions: 0,
    orders: 0,
    conclusion: `共 ${relatedTasks.length} 个任务，已完成 ${completed} 个，延期 ${delayed} 个。`
  });
}

function appendTkTemplates(projects, tasks, memberMap) {
  ["A", "B"].forEach((suffix, projectIndex) => {
    const project = normalizeWorkbenchProject({
      id: `p_tk_202606_${suffix.toLowerCase()}`,
      title: `2026年6月 TK项目 ${suffix}`,
      series: "TikTok短视频",
      projectType: "TK项目",
      startDate: "2026-06-01",
      finishDate: "2026-06-30",
      status: "待开始",
      currentNode: "TK视频策划",
      lastUpdated: "2026-06-16"
    });
    projects.push(project);
    ["脚本策划", "拍摄剪辑", "发布复盘"].forEach((stage, taskIndex) => {
      const owner = taskIndex === 0 ? "马华敏" : projectIndex === 0 ? "郑雨豪" : "李锦禧";
      const task = normalizeWorkbenchTask({
        id: `t_${project.id}_${taskIndex + 1}`,
        projectId: project.id,
        module: "TK视频",
        title: `${project.title} · TK视频${taskIndex + 1} ${stage}`,
        owner,
        plannedDate: `2026-06-${String(10 + taskIndex * 5 + projectIndex * 2).padStart(2, "0")}`,
        actualDate: "",
        note: stage,
        progress: "待开始",
        status: "已分配"
      });
      tasks.push(task);
      addWorkbenchMember(memberMap, owner, taskIndex === 0 ? "方案" : "视频", "TK视频");
    });
  });
}

function daysBetween(start, end) {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate || !endDate) return 0;
  return Math.max(0, Math.round((endDate - startDate) / DAY_MS));
}

function stableWorkbenchId(prefix, value) {
  return slugId(prefix, value).slice(0, 80);
}

const WORKBENCH_SEED = buildWorkbenchSeedFromRows(parseWorkbenchSeedRows(WORKBENCH_SEED_TSV), { includeTkTemplates: true });
workbenchDb = loadWorkbenchData();
applyWorkbenchData(workbenchDb);

function workbenchDefaults() {
  return {
    members: clone(WORKBENCH_SEED.members),
    projects: clone(WORKBENCH_SEED.projects),
    tasks: clone(WORKBENCH_SEED.tasks),
    deliverables: clone(WORKBENCH_SEED.deliverables),
    reviews: clone(WORKBENCH_SEED.reviews)
  };
}

function loadWorkbenchData() {
  try {
    const cached = JSON.parse(localStorage.getItem(WORKBENCH_STORAGE_KEY) || "null");
    const source = cached && typeof cached === "object" ? cached : workbenchDefaults();
    return normalizeWorkbenchData(source);
  } catch {
    localStorage.removeItem(WORKBENCH_STORAGE_KEY);
    return normalizeWorkbenchData(workbenchDefaults());
  }
}

function normalizeWorkbenchData(source) {
  const defaults = workbenchDefaults();
  return {
    members: (Array.isArray(source.members) ? source.members : defaults.members).map(normalizeWorkbenchMember),
    projects: (Array.isArray(source.projects) ? source.projects : defaults.projects).map(normalizeWorkbenchProject),
    tasks: (Array.isArray(source.tasks) ? source.tasks : defaults.tasks).map(normalizeWorkbenchTask),
    deliverables: (Array.isArray(source.deliverables) ? source.deliverables : defaults.deliverables).map(normalizeWorkbenchDeliverable),
    reviews: (Array.isArray(source.reviews) ? source.reviews : defaults.reviews).map(normalizeWorkbenchReview)
  };
}

function applyWorkbenchData(data) {
  prdMembers.splice(0, prdMembers.length, ...data.members);
  prdProjects.splice(0, prdProjects.length, ...data.projects);
  prdTasks.splice(0, prdTasks.length, ...data.tasks);
  prdDeliverables.splice(0, prdDeliverables.length, ...data.deliverables);
  prdReviews.splice(0, prdReviews.length, ...data.reviews);
}

function saveWorkbenchData() {
  applyWorkbenchScheduleCascade();
  syncWorkbenchDeliverables();
  workbenchDb = {
    members: clone(prdMembers),
    projects: clone(prdProjects),
    tasks: clone(prdTasks),
    deliverables: clone(prdDeliverables),
    reviews: clone(prdReviews)
  };
  localStorage.setItem(WORKBENCH_STORAGE_KEY, JSON.stringify(workbenchDb));
}

function syncWorkbenchDeliverables() {
  const eligibleTasks = prdTasks.filter((task) => task.status === "已完成" && DELIVERY_MODULES.includes(task.module));
  const eligibleIds = new Set(eligibleTasks.map((task) => task.id));
  for (let index = prdDeliverables.length - 1; index >= 0; index -= 1) {
    const item = prdDeliverables[index];
    if (item.taskId && !eligibleIds.has(item.taskId)) prdDeliverables.splice(index, 1);
  }
  eligibleTasks.forEach((task) => {
    if (prdDeliverables.some((item) => item.taskId === task.id)) return;
    const project = projectById(task.projectId);
    if (project) prdDeliverables.push(deliverableFromTask(task, project));
  });
}

function normalizeWorkbenchMember(member) {
  return {
    id: member.id || slugId("m", member.name || "member"),
    name: String(member.name || "未命名成员").trim(),
    group: String(member.group || "摄影").trim(),
    weeklyCapacity: Math.max(1, Number(member.weeklyCapacity) || 40),
    skills: String(member.skills || "").trim()
  };
}

function normalizeWorkbenchProject(project) {
  const title = String(project.title || project.name || "未命名项目").trim();
  return {
    id: project.id || uniqueWorkbenchId("p"),
    title,
    name: title,
    image: String(project.image || "").trim(),
    series: String(project.series || "").trim(),
    projectType: PROJECT_TYPES.includes(project.projectType) ? project.projectType : "设计款营销项目",
    status: PROJECT_STATUSES.includes(project.status) ? project.status : "待开始",
    currentNode: String(project.currentNode || "").trim(),
    startDate: toDateKey(project.startDate) || "",
    finishDate: toDateKey(project.finishDate) || "",
    lastUpdated: toDateKey(project.lastUpdated) || todayKey(),
    phases: Array.isArray(project.phases) && project.phases.length ? project.phases : defaultProjectPhases()
  };
}

function normalizeWorkbenchTask(task) {
  const owner = String(task.owner || task.assignee || "").trim();
  const progress = String(task.progress || "").trim();
  const actualDate = toDateKey(task.actualDate) || "";
  let status = TASK_STATUSES.includes(task.status) ? task.status : "";
  if (!status) status = deriveWorkbenchTaskStatus({ owner, actualDate, progress, projectStatus: projectById(task.projectId)?.status });
  return {
    id: task.id || uniqueWorkbenchId("t"),
    projectId: task.projectId || prdProjects[0]?.id || "",
    title: String(task.title || "未命名任务").trim(),
    module: TASK_MODULES.includes(task.module || task.type) ? task.module || task.type : "方案制定",
    type: TASK_MODULES.includes(task.module || task.type) ? task.module || task.type : "方案制定",
    status,
    owner,
    assignee: owner,
    plannedDate: toDateKey(task.plannedDate || task.dueDate) || "",
    actualDate,
    ganttStartDate: toDateKey(task.ganttStartDate) || "",
    baselinePlannedDate: toDateKey(task.baselinePlannedDate || task.plannedDate || task.dueDate) || "",
    dueDate: toDateKey(task.plannedDate || task.dueDate) || "",
    note: String(task.note || "").trim(),
    progress,
    points: Math.max(1, Number(task.points) || 1),
    priority: PRIORITIES.includes(task.priority) ? task.priority : task.status === "延期" ? "高" : "中"
  };
}

function normalizeWorkbenchDeliverable(item) {
  return {
    id: item.id || uniqueWorkbenchId("d"),
    projectId: item.projectId || prdProjects[0]?.id || "",
    taskId: item.taskId || "",
    name: String(item.name || "未命名素材").trim(),
    spec: String(item.spec || "").trim(),
    status: DELIVERY_STATUSES.includes(item.status) ? item.status : "待提交",
    link: String(item.link || "").trim()
  };
}

function normalizeWorkbenchReview(review) {
  return {
    id: review.id || uniqueWorkbenchId("r"),
    projectId: review.projectId || prdProjects[0]?.id || "",
    platform: String(review.platform || "").trim(),
    status: REVIEW_STATUSES.includes(review.status) ? review.status : "草稿",
    planDays: Math.max(0, Number(review.planDays) || 0),
    actualDays: Math.max(0, Number(review.actualDays) || 0),
    sessions: Math.max(0, Number(review.sessions) || 0),
    orders: Math.max(0, Number(review.orders) || 0),
    conclusion: String(review.conclusion || "").trim()
  };
}

function defaultProjectPhases() {
  return TASK_MODULES.map((module) => ({ name: module, status: "plan", width: Math.floor(100 / TASK_MODULES.length) }));
}

function slugId(prefix, value) {
  const safe = String(value || "").replace(/\s+/g, "_").replace(/[^\w\u4e00-\u9fa5-]/g, "");
  return `${prefix}_${safe || Date.now()}`;
}

function uniqueWorkbenchId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
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

function displayFullDate(value) {
  const date = toDate(value);
  return date ? `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日` : "";
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
  renderPrdViews();
  renderBoard("photo");
  renderBoard("video");
  renderCapacity();
  saveState();
}

function renderChrome() {
  state.currentView = normalizeRouteView(state.currentView);
  const group = routeGroup();
  $("#appBrandEyebrow").textContent = group.brandEyebrow;
  $("#appBrandTitle").textContent = group.brandTitle;
  $("#todayText").textContent = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date());
  $$(".nav-item").forEach((button) => {
    const visible = isRouteView(button.dataset.view);
    button.hidden = !visible;
    button.classList.toggle("active", visible && button.dataset.view === state.currentView);
  });
  $$(".board-view").forEach((view) => view.classList.remove("active"));
  $(`#${state.currentView}View`)?.classList.add("active");
  const meta = viewMeta[state.currentView] || boardMeta[state.currentView] || viewMeta.dashboard;
  $("#viewEyebrow").textContent = meta.eyebrow;
  $("#viewTitle").textContent = boardMeta[state.currentView] ? `${boardMeta[state.currentView].label}任务后台` : meta.title;
  const seedButton = $("#seedBtn");
  if (seedButton) seedButton.textContent = routeModule === "workbench" ? "管理项目" : "载入示例";
}

function renderPrdViews() {
  renderDashboardView();
  renderProjectCenterView();
  renderTaskPoolView();
  renderLoadView();
  renderDeliveryView();
  renderReviewView();
  renderCompletedDbView();
}

function projectById(id) {
  return prdProjects.find((project) => project.id === id);
}

function activeProjects() {
  return prdProjects.filter((project) => project.status !== "已完成");
}

function completedProjects() {
  return prdProjects.filter((project) => project.status === "已完成");
}

function activeProjectIds() {
  return new Set(activeProjects().map((project) => project.id));
}

function activeTasks() {
  const ids = activeProjectIds();
  return prdTasks.filter((task) => ids.has(task.projectId) && task.status !== "已完成");
}

function taskBelongsToActiveProject(task) {
  const project = projectById(task.projectId);
  return project && project.status !== "已完成";
}

function taskStatusClass(status) {
  if (["延期", "已驳回", "超载"].includes(status)) return "danger";
  if (["待开始", "待验收", "待提交", "暂停"].includes(status)) return "warning";
  if (["已完成", "验收通过", "已归档", "已分配"].includes(status)) return "success";
  return "neutral";
}

function memberLoad(member) {
  const owned = activeTasks().filter((task) => splitPeople(task.owner).includes(member.name));
  const unfinished = owned.filter((task) => !["已完成"].includes(task.status)).length;
  const delayed = owned.filter((task) => task.status === "延期").length;
  const completed = owned.filter((task) => task.status === "已完成").length;
  const rate = Math.round((unfinished / member.weeklyCapacity) * 100);
  return { assigned: unfinished, unfinished, delayed, completed, rate };
}

function renderDashboardView() {
  const stats = PROJECT_TYPES.map((type) => {
    const projects = activeProjects().filter((project) => project.projectType === type);
    const projectIds = new Set(projects.map((project) => project.id));
    return {
      label: type,
      value: projects.length,
      doing: projects.filter((project) => project.status === "进行中").length,
      pending: projects.filter((project) => project.status === "待开始").length,
      delayed: prdTasks.filter((task) => projectIds.has(task.projectId) && task.status === "延期").length
    };
  });
  const statsRoot = $("#dashboardStats");
  if (statsRoot) {
    statsRoot.innerHTML = stats
      .map(
        (item) => `
          <article class="prd-metric-card">
            <span>${escapeHtml(item.label)}</span>
            <strong>${item.value}</strong>
            <small>进行中 ${item.doing} · 待开始 ${item.pending} · 延期任务 ${item.delayed}</small>
          </article>
        `
      )
      .join("");
  }

  const projectRoot = $("#dashboardProjects");
  if (projectRoot) {
    projectRoot.innerHTML = prdProjects
      .filter((project) => project.status === "进行中" || project.status === "暂停")
      .slice(0, 8)
      .map((project) => prdProjectMiniCard(project))
      .join("") || `<p class="empty-copy">当前没有进行中或暂停项目。</p>`;
  }

  const loadRoot = $("#dashboardLoad");
  if (loadRoot) {
    loadRoot.innerHTML = prdMembers
      .slice(0, 4)
      .map((member) => prdLoadRow(member))
      .join("");
  }

  const todayRoot = $("#dashboardToday");
  if (todayRoot) {
    const dueTasks = prdTasks
      .filter((task) => taskBelongsToActiveProject(task) && (task.status === "延期" || (task.plannedDate && task.plannedDate <= todayKey() && task.status !== "已完成")))
      .slice(0, 5);
    todayRoot.innerHTML = dueTasks.length
      ? dueTasks.map((task) => prdTaskLine(task)).join("")
      : `<p class="empty-copy">今天没有到期任务。</p>`;
  }
}

function prdProjectMiniCard(project) {
  return `
    <article class="prd-list-card prd-clickable" data-workbench-project="${escapeHtml(project.id)}" role="button" tabindex="0">
      <div>
        <strong>${escapeHtml(project.title)}</strong>
        <small>${escapeHtml(project.projectType)} · ${escapeHtml(project.currentNode || "未设置节点")} · 启动 ${displayDate(project.startDate) || "-"}</small>
      </div>
      <span class="prd-tag ${taskStatusClass(project.status)}">${project.status}</span>
    </article>
  `;
}

function prdTaskLine(task) {
  const project = projectById(task.projectId);
  return `
    <article class="prd-list-card prd-clickable" data-workbench-task="${escapeHtml(task.id)}" role="button" tabindex="0">
      <div>
        <strong>${escapeHtml(task.owner || "待分配")} · ${escapeHtml(task.module)}</strong>
        <small>${escapeHtml(project?.title || "未关联项目")} · 预计 ${displayDate(task.plannedDate) || "-"} · 实际 ${displayDate(task.actualDate) || "-"}</small>
      </div>
      <span class="prd-tag ${taskStatusClass(task.status)}">${task.status}</span>
    </article>
  `;
}

function renderProjectCenterView() {
  const gantt = $("#projectGantt");
  const monthTitle = $("#projectGanttMonth");
  if (!gantt) return;
  applyWorkbenchScheduleCascade();
  const monthKey = workbenchMonthKey();
  state.workbenchMonthCursor = monthKey;
  const days = daysOfMonth(monthKey);
  const projects = activeProjects().filter((project) => projectInGanttMonth(project, monthKey));
  if (monthTitle) {
    monthTitle.innerHTML = `
      <div>
        <strong>${monthLabel(monthKey)}</strong>
        <span>${projects.length} 个项目 · ${days.length} 天</span>
      </div>
      ${ganttLegend()}
    `;
  }
  gantt.innerHTML = projects.length
    ? `
      <div class="project-gantt" style="--gantt-days:${days.length}">
        <div class="gantt-left-head">
          <span>项目标题</span>
          <span>图片</span>
          <span>项目类型</span>
        </div>
        <div class="gantt-date-head">
          ${days.map((day) => ganttDayHeader(day)).join("")}
        </div>
        ${projects.map((project) => ganttProjectRow(project, days)).join("")}
      </div>
    `
    : `<p class="empty-copy">当前月份没有实际进行或预计进行的项目。</p>`;
  scrollGanttToToday();
}

function prdProjectCard(project) {
  const taskCount = prdTasks.filter((task) => task.projectId === project.id).length;
  return `
    <article class="prd-project-card prd-clickable" data-workbench-project="${escapeHtml(project.id)}" role="button" tabindex="0">
      <div class="prd-card-head">
        <span class="prd-tag ${taskStatusClass(project.status)}">${project.status}</span>
        <span>${escapeHtml(project.projectType)}</span>
      </div>
      <h3>${escapeHtml(project.title)}</h3>
      <p>${escapeHtml(project.series || "未填系列")} · 当前节点 ${escapeHtml(project.currentNode || "未设置")}</p>
      <div class="prd-card-foot">
        <span>启动 ${displayDate(project.startDate) || "-"}</span>
        <span>完成 ${displayDate(project.finishDate) || "-"}</span>
        <span>${taskCount} 个任务</span>
      </div>
    </article>
  `;
}

function daysOfMonth(monthKey) {
  const start = fromMonthKey(monthKey);
  const days = [];
  const cursor = new Date(start);
  while (cursor.getMonth() === start.getMonth()) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function workbenchMonthKey() {
  const raw = state.workbenchMonthCursor;
  if (/^\d{4}-\d{2}$/.test(String(raw || ""))) return raw;
  const date = toDate(raw) || new Date();
  return toMonthKey(date);
}

function monthRange(monthKey) {
  const days = daysOfMonth(monthKey);
  return { start: days[0], end: days[days.length - 1] };
}

function dateInRange(date, start, end) {
  return date && start && end && date >= start && date <= end;
}

function rangesOverlap(leftStart, leftEnd, rightStart, rightEnd) {
  if (!leftStart || !leftEnd || !rightStart || !rightEnd) return false;
  return leftStart <= rightEnd && leftEnd >= rightStart;
}

function taskDisplayDate(task) {
  return toDate(task.actualDate || task.plannedDate);
}

function taskDateField(task) {
  return task.actualDate ? "actualDate" : "plannedDate";
}

function displayPlannedDate(task) {
  return task.displayPlannedDate || task.plannedDate;
}

function taskGanttDate(task) {
  return toDate(task.actualDate || displayPlannedDate(task));
}

function workbenchTaskOrder(module) {
  const order = {
    "方案制定": 1,
    "Amazon出图": 2,
    "NPC出图": 2,
    "平面排版": 3,
    "NPC排版": 3,
    "视频": 4,
    "TK视频": 1
  };
  return order[module] || 99;
}

function projectScheduleSequences(project) {
  const tasks = prdTasks.filter((task) => task.projectId === project.id);
  if (project.projectType === "TK项目") return [];
  if (["设计款营销项目", "老品风格优化项目"].includes(project.projectType)) {
    return [
      tasks.filter((task) => ["方案制定", "Amazon出图", "平面排版"].includes(task.module)).sort((a, b) => workbenchTaskOrder(a.module) - workbenchTaskOrder(b.module)),
      tasks.filter((task) => ["方案制定", "NPC出图", "NPC排版"].includes(task.module)).sort((a, b) => workbenchTaskOrder(a.module) - workbenchTaskOrder(b.module))
    ].filter((sequence) => sequence.length > 1);
  }
  return [tasks.filter((task) => task.module !== "TK视频").sort((a, b) => workbenchTaskOrder(a.module) - workbenchTaskOrder(b.module))].filter((sequence) => sequence.length > 1);
}

function applyWorkbenchScheduleCascade() {
  prdTasks.forEach((task) => {
    task.displayPlannedDate = task.plannedDate;
    if (!task.baselinePlannedDate && task.plannedDate) task.baselinePlannedDate = task.plannedDate;
  });
  activeProjects().forEach((project) => {
    projectScheduleSequences(project).forEach((sequence) => {
      sequence.forEach((task, index) => {
        if (!index || task.actualDate) return;
        const previous = sequence[index - 1];
        if (!previous.actualDate) return;
        const previousBase = toDate(previous.baselinePlannedDate || previous.plannedDate);
        const currentBase = toDate(task.baselinePlannedDate || task.plannedDate);
        const previousActual = toDate(previous.actualDate);
        if (!previousBase || !currentBase || !previousActual) return;
        const originalGap = Math.max(1, Math.round((currentBase - previousBase) / DAY_MS));
        const shifted = addDays(previousActual, originalGap);
        const existing = toDate(task.displayPlannedDate || task.plannedDate);
        if (!existing || shifted > existing) {
          task.displayPlannedDate = toDateKey(shifted);
          task.plannedDate = toDateKey(shifted);
          task.dueDate = task.plannedDate;
        }
      });
    });
  });
}

function projectGanttRange(project) {
  const tasks = prdTasks.filter((task) => task.projectId === project.id);
  const dates = [project.startDate, project.finishDate, ...tasks.flatMap((task) => [displayPlannedDate(task), task.actualDate])].map(toDate).filter(Boolean);
  if (!dates.length) return { start: null, end: null };
  return {
    start: new Date(Math.min(...dates.map((date) => date.getTime()))),
    end: new Date(Math.max(...dates.map((date) => date.getTime())))
  };
}

function projectInGanttMonth(project, monthKey) {
  const range = projectGanttRange(project);
  const month = monthRange(monthKey);
  if (rangesOverlap(range.start, range.end, month.start, month.end)) return true;
  return prdTasks.some((task) => task.projectId === project.id && dateInRange(taskGanttDate(task), month.start, month.end));
}

function ganttDayHeader(day) {
  const isToday = toDateKey(day) === todayKey();
  return `
    <div class="gantt-day-head ${isWeekend(day) ? "weekend" : ""} ${isToday ? "today" : ""}" data-gantt-head-date="${toDateKey(day)}">
      <span>${day.getDate()}</span>
      <small>${["日", "一", "二", "三", "四", "五", "六"][day.getDay()]}</small>
    </div>
  `;
}

function ganttLegend() {
  return `
    <div class="gantt-legend" aria-label="甘特图颜色说明">
      <span><i class="plan"></i>待开始</span>
      <span><i class="doing"></i>已分配/进行中</span>
      <span><i class="done"></i>已完成</span>
      <span><i class="risk"></i>延期</span>
      <span><i class="paused"></i>暂停</span>
    </div>
  `;
}

function compareGanttTasks(left, right) {
  const leftDate = toDate(left.actualDate || displayPlannedDate(left) || left.baselinePlannedDate || "");
  const rightDate = toDate(right.actualDate || displayPlannedDate(right) || right.baselinePlannedDate || "");
  const dateDiff = (leftDate?.getTime() || 0) - (rightDate?.getTime() || 0);
  if (dateDiff) return dateDiff;
  const baselineDiff = (toDate(left.baselinePlannedDate)?.getTime() || 0) - (toDate(right.baselinePlannedDate)?.getTime() || 0);
  if (baselineDiff) return baselineDiff;
  return String(left.title || left.module).localeCompare(String(right.title || right.module), "zh-CN");
}

function ganttProjectRow(project, days) {
  const lanes = projectGanttLanes(project, days);
  const rowCount = Math.max(1, lanes.length);
  return `
    <div class="gantt-project-left prd-clickable" data-workbench-project-manage="${escapeHtml(project.id)}" role="button" tabindex="0" style="--task-rows:${rowCount}">
      <div class="gantt-project-title">
        <strong>${escapeHtml(project.title)}</strong>
        <small>${escapeHtml(project.series || "未填系列")} · ${project.status}</small>
      </div>
      ${ganttProjectImage(project)}
      <span class="prd-tag ${taskStatusClass(project.status)}">${escapeHtml(project.projectType)}</span>
    </div>
    <div class="gantt-project-timeline" data-workbench-gantt-project="${escapeHtml(project.id)}" style="--task-rows:${rowCount}">
      ${days.map((day) => ganttDropCell(day, rowCount)).join("")}
      ${lanes.map((lane, index) => ganttLaneLabel(lane, index + 1)).join("")}
      ${lanes.flatMap((lane, index) => lane.segments.map((segment) => ganttTaskBar(segment, days, index + 1, lane.label))).join("")}
      ${lanes.some((lane) => lane.segments.length) ? "" : `<span class="gantt-empty-row">本月暂无子任务节点</span>`}
    </div>
  `;
}

function projectGanttFocusDate(projectId) {
  const tasks = prdTasks
    .filter((task) => task.projectId === projectId)
    .filter((task) => taskGanttDate(task))
    .sort(compareGanttTasks);
  const pending = tasks.find((task) => !task.actualDate && taskGanttDate(task));
  return toDateKey(taskGanttDate(pending || tasks[0]));
}

function scrollGanttToDate(dateKey, behavior = "auto") {
  const container = $("#projectGantt .project-gantt");
  if (!container || !dateKey) return;
  window.requestAnimationFrame(() => {
    const timeline = $("[data-workbench-gantt-project]", container);
    const cell = timeline?.querySelector(`[data-workbench-gantt-date="${dateKey}"]`);
    const headerCell = container.querySelector(`[data-gantt-head-date="${dateKey}"]`);
    const base = cell && timeline ? timeline.offsetLeft : $(".gantt-date-head", container)?.offsetLeft || 0;
    const target = cell || headerCell;
    if (!target) return;
    container.scrollTo({ left: Math.max(0, base + target.offsetLeft - 160), behavior });
  });
}

function scrollGanttToToday() {
  const range = monthRange(workbenchMonthKey());
  const today = toDate(todayKey());
  if (!dateInRange(today, range.start, range.end)) return;
  scrollGanttToDate(todayKey());
}

function scrollGanttToProjectDate(projectId) {
  const container = $("#projectGantt .project-gantt");
  const dateKey = projectGanttFocusDate(projectId);
  if (!container || !dateKey) return;
  window.requestAnimationFrame(() => {
    const timeline = $$("[data-workbench-gantt-project]").find((item) => item.dataset.workbenchGanttProject === projectId);
    const cell = timeline?.querySelector(`[data-workbench-gantt-date="${dateKey}"]`);
    if (!timeline || !cell) return;
    const targetLeft = timeline.offsetLeft + cell.offsetLeft - 120;
    container.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
  });
}

function ganttTaskSegmentRange(task, laneTasks, index, project, mode = "continuous") {
  const end = taskGanttDate(task);
  if (!end) return null;
  if (mode === "single") return { start: end, end };
  const previousEnd = index > 0 ? taskGanttDate(laneTasks[index - 1]) : null;
  const projectStart = toDate(project.startDate);
  let start = previousEnd || projectStart || end;
  if (start > end) start = end;
  return { start, end };
}

function canDragGanttActualDate(task) {
  return Boolean(task?.id);
}

function dateMax(left, right) {
  if (!left) return right;
  if (!right) return left;
  return left > right ? left : right;
}

function dateMin(left, right) {
  if (!left) return right;
  if (!right) return left;
  return left < right ? left : right;
}

function buildGanttLane(label, tasks, project, days, mode = "continuous") {
  const month = { start: days[0], end: days[days.length - 1] };
  const orderedTasks = tasks.filter((task) => taskGanttDate(task)).sort(compareGanttTasks);
  const allSegments = orderedTasks
    .map((task, index) => {
      const range = ganttTaskSegmentRange(task, orderedTasks, index, project, mode);
      return range ? { task, ...range } : null;
    })
    .filter(Boolean)
    .map((segment, index, list) => ({
      ...segment,
      segmentIndex: index,
      segmentCount: list.length
    }));
  const segments = allSegments
    .filter((segment) => rangesOverlap(segment.start, segment.end, month.start, month.end));
  return { label, segments };
}

function distributeGanttSegments(label, segments) {
  const sorted = segments
    .filter(Boolean)
    .sort((left, right) => {
      const startDiff = left.start - right.start;
      if (startDiff) return startDiff;
      const endDiff = left.end - right.end;
      if (endDiff) return endDiff;
      return compareGanttTasks(left.task, right.task);
    });
  const lanes = [];
  sorted.forEach((segment) => {
    const lane = lanes.find((item) => !item.segments.some((existing) => rangesOverlap(existing.start, existing.end, segment.start, segment.end)));
    if (lane) lane.segments.push(segment);
    else lanes.push({ label, segments: [segment] });
  });
  return lanes.length ? lanes : [{ label, segments: [] }];
}

function buildPackedGanttLanes(label, tasks, project, days, mode = "single") {
  const lane = buildGanttLane(label, tasks, project, days, mode);
  return distributeGanttSegments(
    label,
    lane.segments.map((segment) => ({ ...segment, segmentIndex: 0, segmentCount: 1 }))
  );
}

function projectGanttLanes(project, days) {
  const projectTasks = prdTasks
    .filter((task) => task.projectId === project.id)
    .sort(compareGanttTasks);
  if (["设计款营销项目", "老品风格优化项目"].includes(project.projectType)) {
    const common = projectTasks.filter((task) => task.module === "方案制定").sort(compareGanttTasks);
    return [
      buildGanttLane("Amazon", [...common, ...projectTasks.filter((task) => ["Amazon出图", "平面排版"].includes(task.module)).sort(compareGanttTasks)], project, days),
      buildGanttLane("NPC", [...common, ...projectTasks.filter((task) => ["NPC出图", "NPC排版"].includes(task.module)).sort(compareGanttTasks)], project, days)
    ];
  }
  if (project.projectType === "TK项目") {
    const tkTasks = projectTasks.filter((task) => task.module === "TK视频").sort(compareGanttTasks);
    return buildPackedGanttLanes("TK视频", tkTasks, project, days, "single");
  }
  return [buildGanttLane("项目主线", projectTasks, project, days)];
}

function ganttLaneLabel(lane, rowIndex) {
  return `<span class="gantt-lane-label" style="grid-row:${rowIndex}">${escapeHtml(lane.label)}</span>`;
}

function ganttProjectImage(project) {
  const image = String(project.image || "").trim();
  if (!image) return `<span class="gantt-project-image fallback">${escapeHtml(project.title.slice(0, 1) || "-")}</span>`;
  return `<span class="gantt-project-image"><img src="${escapeHtml(image)}" alt="${escapeHtml(project.title)}" /></span>`;
}

function ganttDropCell(day, rowCount) {
  return `<div class="gantt-drop-cell ${isWeekend(day) ? "weekend" : ""} ${toDateKey(day) === todayKey() ? "today" : ""}" style="grid-row:1 / span ${rowCount}" data-workbench-gantt-date="${toDateKey(day)}"></div>`;
}

function ganttTaskBar(segment, days, rowIndex, laneLabel = "") {
  const { task } = segment;
  const startDate = dateMax(segment.start, days[0]);
  const endDate = dateMin(segment.end, days[days.length - 1]);
  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);
  const startIndex = days.findIndex((day) => toDateKey(day) === startKey);
  const endIndex = days.findIndex((day) => toDateKey(day) === endKey);
  if (startIndex < 0 || endIndex < 0) return "";
  const span = Math.max(1, endIndex - startIndex + 1);
  const completionKey = toDateKey(segment.end);
  const dateLabel = `${task.actualDate ? "实际完成" : "预计完成"} ${displayDate(completionKey)}`;
  const rangeLabel = `${displayDate(toDateKey(segment.start)) || "-"} 至 ${displayDate(completionKey) || "-"}`;
  const ownerLabel = task.owner || "待分配";
  const chainClass = segment.segmentCount <= 1 ? "chain-single" : segment.segmentIndex === 0 ? "chain-start" : segment.segmentIndex === segment.segmentCount - 1 ? "chain-end" : "chain-middle";
  const resizeHandles = canDragGanttActualDate(task)
    ? `<span class="gantt-resize-handle right" draggable="true" data-workbench-gantt-resize="${escapeHtml(task.id)}:end" aria-label="调整实际完成日期"></span>`
    : "";
  return `
    <button class="gantt-task-bar ${ganttTaskClass(task)} ${chainClass}" type="button" draggable="true" data-workbench-gantt-task="${escapeHtml(task.id)}" data-workbench-task="${escapeHtml(task.id)}" title="${escapeHtml(`${laneLabel ? `${laneLabel} · ` : ""}${task.title} · ${rangeLabel} · ${dateLabel} · ${ownerLabel}`)}" style="grid-column:${startIndex + 1} / span ${span}; grid-row:${rowIndex}">
      ${resizeHandles}
      <span>${escapeHtml(task.module)}</span>
      <small>${escapeHtml(ownerLabel)}</small>
    </button>
  `;
}

function ganttTaskClass(task) {
  const status = task.status;
  if (status === "已完成") return "done";
  if (status === "延期") return "risk";
  if (status === "进行中" || status === "已分配") return "doing";
  if (status === "暂停") return "paused";
  return "plan";
}

function moveWorkbenchTaskToDate(taskId, dateKey) {
  const task = prdTasks.find((item) => item.id === taskId);
  if (!task) return;
  const targetDate = toDate(dateKey);
  if (!targetDate) return;
  task.actualDate = toDateKey(targetDate);
  saveWorkbenchData();
  renderPrdViews();
  showToast(`${task.module} 实际完成时间已调整到 ${displayDate(dateKey)}。`);
}

function resizeWorkbenchTaskActualDate(taskId, edge, dateKey) {
  const task = prdTasks.find((item) => item.id === taskId);
  const targetDate = toDate(dateKey);
  if (!task || !targetDate || !canDragGanttActualDate(task)) return;
  if (edge !== "end") return;
  task.actualDate = toDateKey(targetDate);
  saveWorkbenchData();
  renderPrdViews();
  showToast(`${task.module} 实际完成时间已调整到 ${displayDate(task.actualDate)}。`);
}

function clearGanttResizePreview() {
  $$(".gantt-resize-preview").forEach((item) => item.remove());
  document.body.classList.remove("gantt-is-resizing");
}

function updateGanttResizePreview(taskId, dateKey) {
  const bar = $(`[data-workbench-gantt-task="${CSS.escape(taskId)}"]`);
  const targetCell = bar?.closest("[data-workbench-gantt-project]")?.querySelector(`[data-workbench-gantt-date="${dateKey}"]`);
  if (!bar || !targetCell) return;
  clearGanttResizePreview();
  const timeline = bar.closest("[data-workbench-gantt-project]");
  const startColumn = Number(String(bar.style.gridColumn || "").match(/^(\d+)/)?.[1] || 1);
  const targetColumn = Number(String(targetCell.style.gridColumn || "").match(/^(\d+)/)?.[1] || 0) || Array.from(targetCell.parentElement.children).indexOf(targetCell) + 1;
  const endColumn = Math.max(startColumn, targetColumn);
  const preview = document.createElement("span");
  preview.className = "gantt-resize-preview";
  preview.style.gridColumn = `${startColumn} / span ${Math.max(1, endColumn - startColumn + 1)}`;
  preview.style.gridRow = bar.style.gridRow || "1";
  preview.textContent = `实际 ${displayDate(dateKey)}`;
  timeline.appendChild(preview);
  document.body.classList.add("gantt-is-resizing");
}

function renderTaskPoolView() {
  const root = $("#taskPoolColumns");
  if (!root) return;
  const columns = TASK_STATUSES;
  root.innerHTML = columns
    .map((status) => {
      const tasks = prdTasks.filter((task) => task.status === status && taskBelongsToActiveProject(task));
      return `
        <section class="prd-kanban-column">
          <h3>${status} <span>${tasks.length}</span></h3>
          ${tasks.map((task) => prdTaskCard(task)).join("") || `<p class="empty-copy">暂无任务</p>`}
        </section>
      `;
    })
    .join("");
}

function prdTaskCard(task) {
  const project = projectById(task.projectId);
  return `
    <article class="prd-task-card prd-clickable" data-workbench-task="${escapeHtml(task.id)}" role="button" tabindex="0">
      <div class="prd-card-head">
        <span>${escapeHtml(task.module)}</span>
        <span class="prd-tag ${taskStatusClass(task.status)}">${task.status}</span>
      </div>
      <strong>${escapeHtml(task.title)}</strong>
      <small>${escapeHtml(project?.title || "未关联项目")}</small>
      <div class="prd-card-foot">
        <span>预计 ${displayDate(task.plannedDate) || "-"}</span>
        <span>实际 ${displayDate(task.actualDate) || "-"}</span>
      </div>
      <p>${task.owner ? `负责人：${escapeHtml(task.owner)}` : "负责人：待分配"}${task.progress ? ` · ${escapeHtml(task.progress)}` : ""}</p>
    </article>
  `;
}

function renderLoadView() {
  const root = $("#loadTable");
  if (!root) return;
  root.innerHTML = `
    <div class="prd-load-head"><span>成员</span><span>组别</span><span>未完成</span><span>延期</span><span>负载</span><span>擅长模块</span></div>
    ${prdMembers.map((member) => prdLoadRow(member, true)).join("")}
  `;
}

function prdLoadRow(member, detailed = false) {
  const load = memberLoad(member);
  const level = load.rate >= 100 ? "danger" : load.rate >= 85 ? "warning" : "success";
  return `
    <div class="prd-load-row ${detailed ? "prd-clickable" : ""}" ${detailed ? `data-workbench-member="${escapeHtml(member.id)}" role="button" tabindex="0"` : ""}>
      <strong>${escapeHtml(member.name)}</strong>
      <span>${member.group}</span>
      <span>${load.unfinished} 项</span>
      <span>${load.delayed} 项</span>
      <div class="prd-load-bar"><i class="${level}" style="width:${Math.min(load.rate, 100)}%"></i><b>${load.rate}%</b></div>
      ${detailed ? `<span>${escapeHtml(member.skills)}</span>` : ""}
    </div>
  `;
}

function renderDeliveryView() {
  const root = $("#deliveryList");
  if (!root) return;
  syncWorkbenchDeliverables();
  root.innerHTML = prdDeliverables
    .filter((item) => {
      const project = projectById(item.projectId);
      return project && project.status !== "已完成";
    })
    .map((item) => {
      const project = projectById(item.projectId);
      return `
        <article class="prd-list-card prd-clickable" data-workbench-delivery="${escapeHtml(item.id)}" role="button" tabindex="0">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <small>${escapeHtml(project?.title || project?.name || "-")} · ${escapeHtml(item.spec)} · ${escapeHtml(item.link || "暂无链接")}</small>
          </div>
          <span class="prd-tag ${taskStatusClass(item.status)}">${item.status}</span>
        </article>
      `;
    })
    .join("");
}

function renderReviewView() {
  const root = $("#reviewList");
  if (!root) return;
  root.innerHTML = prdReviews
    .filter((review) => {
      const project = projectById(review.projectId);
      return project && project.status !== "已完成";
    })
    .map((review) => {
      const project = projectById(review.projectId);
      return `
        <article class="prd-review-card prd-clickable" data-workbench-review="${escapeHtml(review.id)}" role="button" tabindex="0">
          <span class="prd-tag ${taskStatusClass(review.status)}">${review.status}</span>
          <h3>${escapeHtml(project?.title || project?.name || "未命名项目")}</h3>
          <p>${escapeHtml(review.platform)} · 计划 ${review.planDays} 天 · 实际 ${review.actualDays || "待回填"} 天</p>
          <div class="prd-review-metrics">
            <span>Sessions ${review.sessions || "-"}</span>
            <span>Orders ${review.orders || "-"}</span>
          </div>
          <small>${escapeHtml(review.conclusion)}</small>
        </article>
      `;
    })
    .join("");
}

function renderCompletedDbView() {
  const root = $("#completedDbTable");
  if (!root) return;
  const searchInput = $("[data-completed-db-search]");
  const typeSelect = $("[data-completed-db-type]");
  if (searchInput && searchInput.value !== state.completedDbSearch) searchInput.value = state.completedDbSearch || "";
  if (typeSelect && typeSelect.value !== state.completedDbType) typeSelect.value = state.completedDbType || "";
  const projects = filteredCompletedProjects();
  const taskTotal = projects.reduce((sum, project) => sum + prdTasks.filter((task) => task.projectId === project.id).length, 0);
  const count = $("#completedDbCount");
  if (count) count.textContent = `${projects.length} 个项目 / ${taskTotal} 个任务`;
  root.innerHTML = projects.length
    ? `
      <table class="database-table">
        <thead>
          <tr>
            <th>层级</th>
            <th>项目 / 任务</th>
            <th>类型 / 模块</th>
            <th>系列 / 负责人</th>
            <th>启动 / 预计</th>
            <th>完成 / 实际</th>
            <th>节点 / 备注</th>
            <th>状态</th>
            <th>更新</th>
          </tr>
        </thead>
        <tbody>
          ${projects.map((project) => completedProjectRows(project)).join("")}
        </tbody>
      </table>
    `
    : `<p class="empty-copy">没有匹配的已完成项目。</p>`;
}

function filteredCompletedProjects() {
  const query = String(state.completedDbSearch || "").trim().toLowerCase();
  const type = String(state.completedDbType || "").trim();
  return completedProjects().filter((project) => {
    if (type && project.projectType !== type) return false;
    if (!query) return true;
    const tasks = prdTasks.filter((task) => task.projectId === project.id);
    const haystack = [
      project.title,
      project.series,
      project.projectType,
      project.currentNode,
      project.startDate,
      project.finishDate,
      project.lastUpdated,
      ...tasks.flatMap((task) => [task.title, task.module, task.owner, task.plannedDate, task.actualDate, task.note, task.progress, task.status])
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

function completedProjectRows(project) {
  const tasks = prdTasks.filter((task) => task.projectId === project.id);
  return `
    <tr class="database-project-row prd-clickable" data-workbench-project="${escapeHtml(project.id)}">
      <td><span class="database-level">项目</span></td>
      <td><strong>${escapeHtml(project.title)}</strong></td>
      <td>${escapeHtml(project.projectType)}</td>
      <td>${escapeHtml(project.series || "-")}</td>
      <td>${displayDate(project.startDate) || "-"}</td>
      <td>${displayDate(project.finishDate) || "-"}</td>
      <td>${escapeHtml(project.currentNode || "-")}</td>
      <td><span class="prd-tag ${taskStatusClass(project.status)}">${project.status}</span></td>
      <td>${displayDate(project.lastUpdated) || "-"}</td>
    </tr>
    ${tasks.map((task) => completedTaskRow(task)).join("")}
  `;
}

function completedTaskRow(task) {
  return `
    <tr class="database-task-row prd-clickable" data-workbench-task="${escapeHtml(task.id)}">
      <td><span class="database-level child">任务</span></td>
      <td><span class="database-indent">${escapeHtml(task.title)}</span></td>
      <td>${escapeHtml(task.module)}</td>
      <td>${escapeHtml(task.owner || "待分配")}</td>
      <td>${displayDate(task.plannedDate) || "-"}</td>
      <td>${displayDate(task.actualDate) || "-"}</td>
      <td>${escapeHtml(task.note || task.progress || "-")}</td>
      <td><span class="prd-tag ${taskStatusClass(task.status)}">${task.status}</span></td>
      <td>-</td>
    </tr>
  `;
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
                  ${[task.assignee, ...tempAssigneeOptions(board)]
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

function tempAssigneeOptions(board) {
  return board === "video" ? ["郑雨豪", "李锦禧"] : ["吕皇勇", "汤崇武"];
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

async function importWorkbenchFile(file) {
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
    rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false, dateNF: "yyyy-mm-dd" });
  } else {
    rows = parseCsv(await file.text());
  }
  const workbookRows = importWorkbenchRows(rows);
  const next = normalizeWorkbenchData(buildWorkbenchSeedFromRows(workbookRows, { includeTkTemplates: false }));
  applyWorkbenchData(next);
  saveWorkbenchData();
  renderPrdViews();
  showToast(`已导入 ${next.projects.length} 个项目，生成 ${next.tasks.length} 个子任务。`);
}

function importWorkbenchRows(rows) {
  const cleanRows = rows.filter((row) => Array.isArray(row) && row.some((cell) => String(cell || "").trim()));
  const headerIndex = cleanRows.findIndex((row, index) => index < 8 && row.some((cell) => String(cell).includes("标题")) && row.some((cell) => String(cell).includes("项目类型")));
  if (headerIndex < 0) return cleanRows.map(rowArrayToWorkbenchRow).filter((row) => row.title);
  const headers = cleanRows[headerIndex].map((cell) => String(cell || "").trim());
  return cleanRows
    .slice(headerIndex + 1)
    .map((row) => rowArrayToWorkbenchRowByHeader(row, headers))
    .filter((row) => row.title);
}

const WORKBENCH_IMPORT_ALIASES = {
  title: ["标题", "项目标题", "产品标题"],
  image: ["产品图片", "图片"],
  series: ["系列"],
  projectType: ["项目类型"],
  startDate: ["项目启动时间", "启动时间"],
  finishDate: ["项目完成时间", "完成时间"],
  status: ["项目状态", "状态"],
  currentNode: ["项目节点", "当前项目节点", "当前节点"],
  planOwner: ["方案负责人"],
  planDue: ["方案预计完成时间"],
  planActual: ["方案实际完成时间"],
  planNote: ["方案进度更新", "方案备注"],
  planProgress: ["方案进度"],
  amazonOwner: ["出图负责人", "Amazon出图负责人", "amazon出图负责人"],
  amazonDue: ["出图预计完成时间", "Amazon出图预计完成时间", "amazon出图预计完成时间"],
  amazonActual: ["出图实际完成时间", "Amazon出图实际完成时间", "amazon出图实际完成时间"],
  amazonProgress: ["amazon出图进度", "Amazon出图进度"],
  npcOwner: ["npc出图负责人", "NPC出图负责人"],
  npcActual: ["npc出图实际完成时间", "NPC出图实际完成时间"],
  layoutOwner: ["平面负责人"],
  layoutDue: ["排版预计完成时间", "平面排版预计完成时间"],
  layoutActual: ["排版实际完成时间", "平面排版实际完成时间"],
  layoutProgress: ["amazon平面进度", "Amazon平面进度", "平面进度"],
  npcLayoutActual: ["npc排版实际完成时间", "NPC排版实际完成时间"],
  videoOwner: ["视频负责人"],
  videoDue: ["视频预计完成时间"],
  videoActual: ["视频实际完成时间"],
  videoNote: ["视频进度备注", "视频备注"],
  videoProgress: ["视频进度"],
  lastUpdated: ["最后更新时间"]
};

function rowArrayToWorkbenchRowByHeader(values, headers) {
  const row = {};
  WORKBENCH_COLUMNS.forEach((key, fallbackIndex) => {
    const columnIndex = findWorkbenchColumnIndex(headers, key);
    row[key] = String(values[columnIndex >= 0 ? columnIndex : fallbackIndex] || "").trim();
  });
  return row;
}

function findWorkbenchColumnIndex(headers, key) {
  const aliases = WORKBENCH_IMPORT_ALIASES[key] || [key];
  return headers.findIndex((header) => aliases.some((alias) => normalizedHeader(header).includes(normalizedHeader(alias))));
}

function normalizedHeader(value) {
  return String(value || "").replace(/[()\[\]（）【】\s:：/\\-]/g, "").toLowerCase();
}

function downloadTemplate(board) {
  const person = boardMeta[board].personLabel;
  const headers =
    board === "video"
      ? ["sku别名", "任务语种", "任务类型", "摄像师", "任务状态", "优先级", "创建时间", "关联sku", "时长"]
      : ["sku别名", "产品标题", "产品类型", "样品", "预计到港时间", "最早交期", person, "拍摄内容"];
  const sample =
    board === "video"
      ? ["615969 Light Gray/Black", "英", "场景视频", "郑雨豪", "待拍摄", "高", "2026-06-02 10:28:32", "", "2"]
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
    createImportedTask("video", { sku: "VID2201", title: "折叠推车", productType: "户外", sample: "已到样", eta: "2026-06-03", earliestDue: "2026-06-12", assignee: "郑雨豪", content: "安装视频" }),
    createImportedTask("video", { sku: "VID5088", title: "智能香薰机", productType: "家电", sample: "样品在库", earliestDue: "2026-07-15", assignee: "李锦禧", content: "AI视频" })
  ];
  state.temp.photo = [createTempTask("photo", { sku: "TMP-P01", contact: "李想", note: "临时补拍细节", assignee: "陈琳", estimateDays: 1 })];
  state.temp.video = [createTempTask("video", { sku: "TMP-V01", contact: "赵敏", note: "临时口播素材", assignee: "郑雨豪", estimateDays: 1 })];
  state.tablePage.photo = 1;
  state.tablePage.video = 1;
  autoSchedule("photo");
  autoSchedule("video");
}

function seedWorkbenchDemo() {
  workbenchDb = normalizeWorkbenchData(workbenchDefaults());
  applyWorkbenchData(workbenchDb);
  saveWorkbenchData();
  renderPrdViews();
  showToast("重点项目工作台示例数据已载入。");
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

function openWorkbenchDialog({ eyebrow, title, body, actions }) {
  $("#workbenchDialogEyebrow").textContent = eyebrow;
  $("#workbenchDialogTitle").textContent = title;
  $("#workbenchDialogBody").innerHTML = body;
  $("#workbenchDialogActions").innerHTML = actions;
  $("#workbenchDialog").showModal();
}

function closeWorkbenchDialog() {
  $("#workbenchDialog").close();
}

function optionList(values, selected = "") {
  return values.map((value) => `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
}

function projectOptionList(selected = "") {
  return prdProjects
    .filter((project) => project.status !== "已完成" || project.id === selected)
    .map((project) => `<option value="${escapeHtml(project.id)}" ${project.id === selected ? "selected" : ""}>${escapeHtml(project.title || project.name)}</option>`)
    .join("");
}

function memberOptionList(selected = "", includeBlank = true) {
  return `${includeBlank ? `<option value="">待分配</option>` : ""}${prdMembers
    .map((member) => `<option value="${escapeHtml(member.name)}" ${member.name === selected ? "selected" : ""}>${escapeHtml(member.name)} · ${escapeHtml(member.group)}</option>`)
    .join("")}`;
}

function taskOptionList(selected = "", projectId = "") {
  const tasks = projectId ? prdTasks.filter((task) => task.projectId === projectId) : prdTasks;
  return `<option value="">不关联具体任务</option>${tasks
    .map((task) => `<option value="${escapeHtml(task.id)}" ${task.id === selected ? "selected" : ""}>${escapeHtml(task.module)} · ${escapeHtml(task.title)}</option>`)
    .join("")}`;
}

function formValue(name) {
  const field = $(`[name="${name}"]`, $("#workbenchDialog"));
  return field ? field.value.trim() : "";
}

function fieldRow(label, control) {
  return `<label class="workbench-field"><span>${label}</span>${control}</label>`;
}

function workbenchSummary(title, items) {
  return `
    <div class="workbench-summary">
      <strong>${escapeHtml(title)}</strong>
      ${items.length ? items.map((item) => `<small>${escapeHtml(item)}</small>`).join("") : `<small>暂无关联内容</small>`}
    </div>
  `;
}

function openConfirmDialog({ title = "确认操作", message = "确认继续吗？", confirmText = "确认", onConfirm }) {
  pendingConfirmAction = typeof onConfirm === "function" ? onConfirm : null;
  openWorkbenchDialog({
    eyebrow: "Confirm",
    title,
    body: `<p class="confirm-copy">${escapeHtml(message)}</p>`,
    actions: `
      <button class="ghost-button" value="cancel" type="submit">取消</button>
      <button class="delete-button text-delete" type="button" data-confirm-action>${escapeHtml(confirmText)}</button>
    `
  });
}

function openProjectManager(projectId = "") {
  const project = prdProjects.find((item) => item.id === projectId);
  if (!project) {
    openWorkbenchDialog({
      eyebrow: "Project Manager",
      title: "管理项目",
      body: `
        <div class="project-manager-toolbar">
          <span>已有项目按状态分组，默认折叠。</span>
          <button class="primary-button" type="button" data-open-workbench-project>+ 新建项目</button>
        </div>
        <div class="project-manager-list">
          ${PROJECT_STATUSES.map((status) => projectManagerGroup(status)).join("")}
        </div>
      `,
      actions: `
        <button class="ghost-button" value="cancel" type="submit">关闭</button>
      `
    });
    return;
  }
  const tasks = prdTasks.filter((task) => task.projectId === project.id);
  openWorkbenchDialog({
    eyebrow: "Project Tasks",
    title: project.title,
    body: `
      <div class="workbench-summary">
        <strong>${escapeHtml(project.projectType)}</strong>
        <small>系列：${escapeHtml(project.series || "未填")}</small>
        <small>节点：${escapeHtml(project.currentNode || "未设置")}</small>
        <small>启动：${displayDate(project.startDate) || "-"} · 完成：${displayDate(project.finishDate) || "-"}</small>
      </div>
      <div class="project-task-list">
        ${tasks.map((task) => `
          <button class="project-task-item" type="button" data-workbench-task="${escapeHtml(task.id)}">
            <span>
              <strong>${escapeHtml(task.module)}</strong>
              <small>${escapeHtml(task.owner || "待分配")} · 预计 ${displayDate(task.plannedDate) || "-"} · 实际 ${displayDate(task.actualDate) || "-"}</small>
            </span>
            <span class="prd-tag ${taskStatusClass(task.status)}">${task.status}</span>
          </button>
        `).join("") || `<p class="empty-copy">该项目暂无子任务。</p>`}
      </div>
    `,
    actions: `
      <button class="ghost-button" value="cancel" type="submit">关闭</button>
      <button class="ghost-button" type="button" data-workbench-edit-project="${escapeHtml(project.id)}">编辑项目</button>
      <button class="primary-button" type="button" data-open-task-for-project="${escapeHtml(project.id)}">+ 新建子任务</button>
    `
  });
}

function projectManagerGroup(status) {
  const projects = prdProjects.filter((project) => project.status === status);
  return `
    <details class="project-manager-group">
      <summary>
        <span>${escapeHtml(status)}</span>
        <b>${projects.length}</b>
      </summary>
      <div class="project-manager-items">
        ${projects.map((item) => `
          <div class="project-manager-item">
            <span>
              <strong>${escapeHtml(item.title)}</strong>
              <small>${escapeHtml(item.series || "未填系列")} · ${escapeHtml(item.projectType)} · 更新 ${displayDate(item.lastUpdated) || "-"}</small>
            </span>
            <button class="delete-button" type="button" data-workbench-delete-project="${escapeHtml(item.id)}">删除</button>
          </div>
        `).join("") || `<p class="empty-copy">暂无${escapeHtml(status)}项目。</p>`}
      </div>
    </details>
  `;
}

function openProjectDialog(projectId = "") {
  const project = prdProjects.find((item) => item.id === projectId);
  const value = project || normalizeWorkbenchProject({});
  const linkedTasks = project ? prdTasks.filter((task) => task.projectId === project.id) : [];
  const linkedDeliverables = project ? prdDeliverables.filter((item) => item.projectId === project.id) : [];
  const linkedReviews = project ? prdReviews.filter((item) => item.projectId === project.id) : [];
  openWorkbenchDialog({
    eyebrow: "Project",
    title: project ? "编辑项目" : "新建项目",
    body: `
      <div class="workbench-form-grid">
        ${fieldRow("标题", `<input name="projectTitle" value="${escapeHtml(value.title)}" required />`)}
        ${fieldRow("产品图片", `<input name="projectImage" value="${escapeHtml(value.image)}" placeholder="图片链接或文件名" />`)}
        ${fieldRow("系列", `<input name="projectSeries" value="${escapeHtml(value.series)}" />`)}
        ${fieldRow("项目类型", `<select name="projectType">${optionList(PROJECT_TYPES, value.projectType)}</select>`)}
        ${fieldRow("项目状态", `<select name="projectStatus">${optionList(PROJECT_STATUSES, value.status)}</select>`)}
        ${fieldRow("当前项目节点", `<input name="projectCurrentNode" value="${escapeHtml(value.currentNode)}" />`)}
        ${fieldRow("项目启动时间", `<input name="projectStartDate" type="date" value="${escapeHtml(value.startDate)}" />`)}
        ${fieldRow("项目完成时间", `<input name="projectFinishDate" type="date" value="${escapeHtml(value.finishDate)}" />`)}
        ${fieldRow("最后更新时间", `<input name="projectLastUpdated" type="date" value="${escapeHtml(value.lastUpdated)}" />`)}
      </div>
      ${project ? workbenchSummary("关联概览", [
        `${linkedTasks.length} 个任务`,
        `${linkedDeliverables.length} 个交付素材`,
        `${linkedReviews.length} 条复盘记录`
      ]) : ""}
    `,
    actions: `
      <button class="ghost-button" value="cancel" type="submit">取消</button>
      ${project ? `<button class="delete-button text-delete" type="button" data-workbench-delete-project="${escapeHtml(project.id)}">删除项目</button>` : ""}
      <button class="primary-button" type="button" data-workbench-save-project="${escapeHtml(project?.id || "")}">保存项目</button>
    `
  });
}

function saveProjectDialog(projectId = "") {
  const next = normalizeWorkbenchProject({
    id: projectId || uniqueWorkbenchId("p"),
    title: formValue("projectTitle"),
    image: formValue("projectImage"),
    series: formValue("projectSeries"),
    projectType: formValue("projectType"),
    status: formValue("projectStatus"),
    currentNode: formValue("projectCurrentNode"),
    startDate: formValue("projectStartDate"),
    finishDate: formValue("projectFinishDate"),
    lastUpdated: formValue("projectLastUpdated"),
    phases: prdProjects.find((project) => project.id === projectId)?.phases || defaultProjectPhases()
  });
  if (!next.title) {
    showToast("请填写项目标题。");
    return;
  }
  const index = prdProjects.findIndex((project) => project.id === projectId);
  if (index >= 0) prdProjects[index] = next;
  else prdProjects.unshift(next);
  saveWorkbenchData();
  renderPrdViews();
  closeWorkbenchDialog();
  showToast(index >= 0 ? "项目已保存。" : "项目已创建。");
}

function deleteProject(projectId) {
  const project = prdProjects.find((item) => item.id === projectId);
  if (!project) return;
  const taskCount = prdTasks.filter((task) => task.projectId === projectId).length;
  openConfirmDialog({
    title: "删除项目",
    message: `确认删除项目「${project.title || project.name}」？将同时删除 ${taskCount} 个关联子任务及相关交付/复盘记录，删除后不可恢复。`,
    confirmText: "确认删除",
    onConfirm: () => {
      prdProjects.splice(prdProjects.findIndex((item) => item.id === projectId), 1);
      for (let index = prdTasks.length - 1; index >= 0; index -= 1) {
        if (prdTasks[index].projectId === projectId) prdTasks.splice(index, 1);
      }
      for (let index = prdDeliverables.length - 1; index >= 0; index -= 1) {
        if (prdDeliverables[index].projectId === projectId) prdDeliverables.splice(index, 1);
      }
      for (let index = prdReviews.length - 1; index >= 0; index -= 1) {
        if (prdReviews[index].projectId === projectId) prdReviews.splice(index, 1);
      }
      saveWorkbenchData();
      renderPrdViews();
      showToast("项目已删除。");
    }
  });
}

function openTaskDialog(taskId = "", defaults = {}) {
  const task = prdTasks.find((item) => item.id === taskId);
  const value = task || normalizeWorkbenchTask({ projectId: defaults.projectId || prdProjects[0]?.id || "", module: defaults.module || "方案制定" });
  const project = projectById(value.projectId);
  openWorkbenchDialog({
    eyebrow: "Task",
    title: task ? "编辑任务" : "新建任务",
    body: `
      <div class="workbench-form-grid">
        ${fieldRow("所属项目", `<select name="taskProjectId">${projectOptionList(value.projectId)}</select>`)}
        ${fieldRow("任务标题", `<input name="taskTitle" value="${escapeHtml(value.title)}" required />`)}
        ${fieldRow("任务模块", `<select name="taskModule">${optionList(TASK_MODULES, value.module)}</select>`)}
        ${fieldRow("负责人", `<select name="taskOwner">${memberOptionList(value.owner)}</select>`)}
        ${fieldRow("预计完成时间", `<input name="taskPlannedDate" type="date" value="${escapeHtml(value.plannedDate)}" />`)}
        ${fieldRow("实际完成时间", `<input name="taskActualDate" type="date" value="${escapeHtml(value.actualDate)}" />`)}
        ${fieldRow("进度状态", `<select name="taskStatus">${optionList(TASK_STATUSES, value.status)}</select>`)}
        <label class="workbench-field workbench-field-wide"><span>进度备注</span><textarea name="taskNote">${escapeHtml(value.note || value.progress || "")}</textarea></label>
      </div>
      ${task ? workbenchSummary("关联信息", [`项目：${project?.title || project?.name || "未关联项目"}`, `当前负责人：${value.owner || "待分配"}`]) : ""}
    `,
    actions: `
      <button class="ghost-button" value="cancel" type="submit">取消</button>
      ${task ? `<button class="delete-button text-delete" type="button" data-workbench-delete-task="${escapeHtml(task.id)}">删除任务</button>` : ""}
      <button class="primary-button" type="button" data-workbench-save-task="${escapeHtml(task?.id || "")}">保存任务</button>
    `
  });
}

function saveTaskDialog(taskId = "") {
  const existingTask = prdTasks.find((task) => task.id === taskId);
  const owner = formValue("taskOwner");
  const plannedDate = formValue("taskPlannedDate");
  const actualDate = formValue("taskActualDate");
  const note = formValue("taskNote");
  const project = projectById(formValue("taskProjectId"));
  const suggestedStatus = deriveWorkbenchTaskStatus({ owner, actualDate, progress: note, projectStatus: project?.status });
  const selectedStatus = formValue("taskStatus");
  const next = normalizeWorkbenchTask({
    id: taskId || uniqueWorkbenchId("t"),
    projectId: formValue("taskProjectId"),
    title: formValue("taskTitle"),
    module: formValue("taskModule"),
    owner,
    plannedDate,
    baselinePlannedDate: plannedDate && plannedDate !== existingTask?.plannedDate ? plannedDate : existingTask?.baselinePlannedDate || plannedDate,
    actualDate,
    note,
    progress: note,
    status: selectedStatus === "待开始" && suggestedStatus !== "待开始" ? suggestedStatus : selectedStatus || suggestedStatus
  });
  if (!next.title) {
    showToast("请填写任务标题。");
    return;
  }
  const index = prdTasks.findIndex((task) => task.id === taskId);
  if (index >= 0) prdTasks[index] = next;
  else prdTasks.unshift(next);
  saveWorkbenchData();
  renderPrdViews();
  closeWorkbenchDialog();
  showToast(index >= 0 ? "任务已保存。" : "任务已创建。");
}

function deleteTask(taskId) {
  const task = prdTasks.find((item) => item.id === taskId);
  if (!task) return;
  openConfirmDialog({
    title: "删除任务",
    message: `确认删除任务「${task.title}」？删除后不可恢复。`,
    confirmText: "确认删除",
    onConfirm: () => {
      prdTasks.splice(prdTasks.findIndex((item) => item.id === taskId), 1);
      prdDeliverables.forEach((item) => {
        if (item.taskId === taskId) item.taskId = "";
      });
      saveWorkbenchData();
      renderPrdViews();
      showToast("任务已删除。");
    }
  });
}

function openMembersDialog(memberId = "") {
  const members = memberId ? prdMembers.filter((member) => member.id === memberId) : prdMembers;
  openWorkbenchDialog({
    eyebrow: "Capacity",
    title: memberId ? "编辑成员档案" : "产能档案设置",
    body: `<div class="workbench-member-list">${members.map(memberEditorRow).join("")}</div>`,
    actions: `
      <button class="ghost-button" value="cancel" type="submit">取消</button>
      <button class="primary-button" type="button" data-workbench-save-members>保存档案</button>
    `
  });
}

function memberEditorRow(member) {
  return `
    <div class="workbench-member-row" data-member-row="${escapeHtml(member.id)}">
      <strong>${escapeHtml(member.name)}</strong>
      <input name="memberName:${escapeHtml(member.id)}" value="${escapeHtml(member.name)}" aria-label="成员姓名" />
      <input name="memberGroup:${escapeHtml(member.id)}" value="${escapeHtml(member.group)}" aria-label="组别" />
      <input name="memberCapacity:${escapeHtml(member.id)}" type="number" min="1" value="${escapeHtml(member.weeklyCapacity)}" aria-label="周产能" />
      <input name="memberSkills:${escapeHtml(member.id)}" value="${escapeHtml(member.skills)}" aria-label="擅长标签" />
    </div>
  `;
}

function saveMembersDialog() {
  $$(".workbench-member-row", $("#workbenchDialog")).forEach((row) => {
    const id = row.dataset.memberRow;
    const member = prdMembers.find((item) => item.id === id);
    if (!member) return;
    const oldName = member.name;
    member.name = formValue(`memberName:${id}`) || member.name;
    if (oldName !== member.name) {
      prdTasks.forEach((task) => {
        if (task.owner === oldName) task.owner = member.name;
        if (task.assignee === oldName) task.assignee = member.name;
      });
    }
    member.group = formValue(`memberGroup:${id}`) || member.group;
    member.weeklyCapacity = Math.max(1, Number(formValue(`memberCapacity:${id}`)) || member.weeklyCapacity);
    member.skills = formValue(`memberSkills:${id}`);
  });
  saveWorkbenchData();
  renderPrdViews();
  closeWorkbenchDialog();
  showToast("产能档案已保存。");
}

function openDeliveryDialog(deliveryId) {
  const item = prdDeliverables.find((delivery) => delivery.id === deliveryId);
  if (!item) return;
  openWorkbenchDialog({
    eyebrow: "Delivery",
    title: "编辑交付素材",
    body: `
      <div class="workbench-form-grid">
        ${fieldRow("所属项目", `<select name="deliveryProjectId">${projectOptionList(item.projectId)}</select>`)}
        ${fieldRow("关联任务", `<select name="deliveryTaskId">${taskOptionList(item.taskId, item.projectId)}</select>`)}
        ${fieldRow("素材名称", `<input name="deliveryName" value="${escapeHtml(item.name)}" />`)}
        ${fieldRow("规格", `<input name="deliverySpec" value="${escapeHtml(item.spec)}" />`)}
        ${fieldRow("状态", `<select name="deliveryStatus">${optionList(DELIVERY_STATUSES, item.status)}</select>`)}
        ${fieldRow("链接", `<input name="deliveryLink" value="${escapeHtml(item.link)}" />`)}
      </div>
    `,
    actions: `
      <button class="ghost-button" value="cancel" type="submit">取消</button>
      <button class="primary-button" type="button" data-workbench-save-delivery="${escapeHtml(item.id)}">保存交付</button>
    `
  });
}

function saveDeliveryDialog(deliveryId) {
  const index = prdDeliverables.findIndex((item) => item.id === deliveryId);
  if (index < 0) return;
  prdDeliverables[index] = normalizeWorkbenchDeliverable({
    id: deliveryId,
    projectId: formValue("deliveryProjectId"),
    taskId: formValue("deliveryTaskId"),
    name: formValue("deliveryName"),
    spec: formValue("deliverySpec"),
    status: formValue("deliveryStatus"),
    link: formValue("deliveryLink")
  });
  saveWorkbenchData();
  renderPrdViews();
  closeWorkbenchDialog();
  showToast("交付素材已保存。");
}

function openReviewDialog(reviewId) {
  const review = prdReviews.find((item) => item.id === reviewId);
  if (!review) return;
  openWorkbenchDialog({
    eyebrow: "Review",
    title: "编辑数据复盘",
    body: `
      <div class="workbench-form-grid">
        ${fieldRow("所属项目", `<select name="reviewProjectId">${projectOptionList(review.projectId)}</select>`)}
        ${fieldRow("平台", `<input name="reviewPlatform" value="${escapeHtml(review.platform)}" />`)}
        ${fieldRow("状态", `<select name="reviewStatus">${optionList(REVIEW_STATUSES, review.status)}</select>`)}
        ${fieldRow("计划周期", `<input name="reviewPlanDays" type="number" min="0" value="${escapeHtml(review.planDays)}" />`)}
        ${fieldRow("实际周期", `<input name="reviewActualDays" type="number" min="0" value="${escapeHtml(review.actualDays)}" />`)}
        ${fieldRow("Sessions", `<input name="reviewSessions" type="number" min="0" value="${escapeHtml(review.sessions)}" />`)}
        ${fieldRow("Orders", `<input name="reviewOrders" type="number" min="0" value="${escapeHtml(review.orders)}" />`)}
        <label class="workbench-field workbench-field-wide"><span>复盘结论</span><textarea name="reviewConclusion">${escapeHtml(review.conclusion)}</textarea></label>
      </div>
    `,
    actions: `
      <button class="ghost-button" value="cancel" type="submit">取消</button>
      <button class="primary-button" type="button" data-workbench-save-review="${escapeHtml(review.id)}">保存复盘</button>
    `
  });
}

function saveReviewDialog(reviewId) {
  const index = prdReviews.findIndex((item) => item.id === reviewId);
  if (index < 0) return;
  prdReviews[index] = normalizeWorkbenchReview({
    id: reviewId,
    projectId: formValue("reviewProjectId"),
    platform: formValue("reviewPlatform"),
    status: formValue("reviewStatus"),
    planDays: formValue("reviewPlanDays"),
    actualDays: formValue("reviewActualDays"),
    sessions: formValue("reviewSessions"),
    orders: formValue("reviewOrders"),
    conclusion: formValue("reviewConclusion")
  });
  saveWorkbenchData();
  renderPrdViews();
  closeWorkbenchDialog();
  showToast("复盘记录已保存。");
}

function downloadTextFile(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function exportDeliveryList() {
  const rows = [["项目", "任务模块", "任务", "素材名称", "规格", "状态", "链接"]];
  prdDeliverables
    .filter((item) => {
      const project = projectById(item.projectId);
      return project && project.status !== "已完成";
    })
    .forEach((item) => {
    const project = projectById(item.projectId);
    const task = prdTasks.find((task) => task.id === item.taskId);
    rows.push([
      project?.title || project?.name || "",
      task?.module || "",
      task?.title || "",
      item.name,
      item.spec,
      item.status,
      item.link
    ]);
  });
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
  downloadTextFile(`重点项目交付清单-${todayKey()}.csv`, csv, "text/csv;charset=utf-8");
  showToast("交付清单已导出。");
}

function exportReviewReport() {
  const body = prdReviews
    .filter((review) => {
      const project = projectById(review.projectId);
      return project && project.status !== "已完成";
    })
    .map((review) => {
      const project = projectById(review.projectId);
      return `## ${project?.title || project?.name || "未命名项目"}\n\n- 项目类型：${review.platform || project?.projectType || "-"}\n- 状态：${review.status}\n- 计划周期：${review.planDays} 天\n- 实际周期：${review.actualDays || "待回填"} 天\n- Sessions：${review.sessions || "-"}\n- Orders：${review.orders || "-"}\n- 结论：${review.conclusion || "-"}\n`;
    })
    .join("\n");
  downloadTextFile(`重点项目复盘报告-${todayKey()}.md`, `# 重点项目复盘报告\n\n${body}`);
  showToast("复盘报告已导出。");
}

function completedDatabaseRows() {
  const rows = [["层级", "项目标题", "任务标题", "项目类型", "任务模块", "系列", "负责人", "启动时间", "项目完成时间", "预计完成时间", "实际完成时间", "当前节点", "进度备注", "项目状态", "任务状态", "最后更新时间"]];
  filteredCompletedProjects().forEach((project) => {
    rows.push(["项目", project.title, "", project.projectType, "", project.series, "", project.startDate, project.finishDate, "", "", project.currentNode, "", project.status, "", project.lastUpdated]);
    prdTasks
      .filter((task) => task.projectId === project.id)
      .forEach((task) => {
        rows.push(["任务", project.title, task.title, project.projectType, task.module, project.series, task.owner, project.startDate, project.finishDate, task.plannedDate, task.actualDate, project.currentNode, task.note || task.progress, project.status, task.status, project.lastUpdated]);
      });
  });
  return rows;
}

function exportCompletedDatabase() {
  const rows = completedDatabaseRows();
  if (window.XLSX) {
    const sheet = window.XLSX.utils.aoa_to_sheet(rows);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, sheet, "已完成项目数据库");
    window.XLSX.writeFile(workbook, `已完成项目数据库-${todayKey()}.xlsx`);
  } else {
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
    downloadTextFile(`已完成项目数据库-${todayKey()}.csv`, csv, "text/csv;charset=utf-8");
  }
  showToast("完成数据库已导出。");
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

  $("#seedBtn").addEventListener("click", () => {
    if (routeModule === "workbench") openProjectManager();
    else seedDemo();
  });
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

  $$("[data-workbench-import]").forEach((input) => {
    input.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      await importWorkbenchFile(file);
      input.value = "";
    });
  });

  const completedSearch = $("[data-completed-db-search]");
  if (completedSearch) {
    completedSearch.addEventListener("input", (event) => {
      state.completedDbSearch = event.target.value;
      renderCompletedDbView();
    });
  }

  const completedType = $("[data-completed-db-type]");
  if (completedType) {
    completedType.addEventListener("change", (event) => {
      state.completedDbType = event.target.value;
      renderCompletedDbView();
    });
  }

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
      form.assignee.value = board === "photo" ? "吕皇勇" : "郑雨豪";
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
    const openWorkbenchProject = event.target.closest("[data-open-workbench-project]");
    const openWorkbenchTask = event.target.closest("[data-open-workbench-task]");
    const openWorkbenchMembers = event.target.closest("[data-open-workbench-members]");
    const openWorkbenchManager = event.target.closest("[data-open-workbench-manager]");
    const exportWorkbenchDelivery = event.target.closest("[data-export-workbench-delivery]");
    const exportWorkbenchReview = event.target.closest("[data-export-workbench-review]");
    const exportWorkbenchCompleted = event.target.closest("[data-export-workbench-completed]");
    const workbenchProject = event.target.closest("[data-workbench-project]");
    const workbenchTask = event.target.closest("[data-workbench-task]");
    const workbenchProjectManage = event.target.closest("[data-workbench-project-manage]");
    const workbenchMember = event.target.closest("[data-workbench-member]");
    const workbenchDelivery = event.target.closest("[data-workbench-delivery]");
    const workbenchReview = event.target.closest("[data-workbench-review]");
    const saveProject = event.target.dataset.workbenchSaveProject;
    const deleteWorkbenchProject = event.target.dataset.workbenchDeleteProject;
    const saveTask = event.target.dataset.workbenchSaveTask;
    const deleteWorkbenchTask = event.target.dataset.workbenchDeleteTask;
    const saveMembers = event.target.dataset.workbenchSaveMembers;
    const saveDelivery = event.target.dataset.workbenchSaveDelivery;
    const saveReview = event.target.dataset.workbenchSaveReview;
    const editWorkbenchProject = event.target.dataset.workbenchEditProject;
    const openTaskForProject = event.target.dataset.openTaskForProject;
    const confirmAction = event.target.dataset.confirmAction;
    const workbenchMonthPrev = event.target.closest("[data-workbench-month-prev]");
    const workbenchMonthNext = event.target.closest("[data-workbench-month-next]");
    const workbenchMonthToday = event.target.closest("[data-workbench-month-today]");
    const addRule = event.target.dataset.addRule;
    const deleteRule = event.target.dataset.deleteRule;
    const deleteImport = event.target.dataset.deleteImport;
    const deleteTemp = event.target.dataset.deleteTemp;
    const monthPrev = event.target.dataset.monthPrev;
    const monthNext = event.target.dataset.monthNext;
    const pagePrev = event.target.dataset.pagePrev;
    const pageNext = event.target.dataset.pageNext;
    const clearSearch = event.target.dataset.clearSearch;
    const jumpView = event.target.dataset.jumpView;
    const person = event.target.closest("[data-person]");
    const openPaste = event.target.dataset.openPaste;
    const openCompleted = event.target.dataset.openCompleted;

    if (openWorkbenchProject) {
      openProjectDialog();
      return;
    }
    if (openWorkbenchTask) {
      openTaskDialog();
      return;
    }
    if (openWorkbenchMembers) {
      openMembersDialog();
      return;
    }
    if (openWorkbenchManager) {
      openProjectManager();
      return;
    }
    if (exportWorkbenchDelivery) {
      exportDeliveryList();
      return;
    }
    if (exportWorkbenchReview) {
      exportReviewReport();
      return;
    }
    if (exportWorkbenchCompleted) {
      exportCompletedDatabase();
      return;
    }
    if (saveProject !== undefined) {
      saveProjectDialog(saveProject);
      return;
    }
    if (deleteWorkbenchProject) {
      deleteProject(deleteWorkbenchProject);
      return;
    }
    if (saveTask !== undefined) {
      saveTaskDialog(saveTask);
      return;
    }
    if (deleteWorkbenchTask) {
      deleteTask(deleteWorkbenchTask);
      return;
    }
    if (saveMembers !== undefined) {
      saveMembersDialog();
      return;
    }
    if (saveDelivery) {
      saveDeliveryDialog(saveDelivery);
      return;
    }
    if (saveReview) {
      saveReviewDialog(saveReview);
      return;
    }
    if (confirmAction !== undefined) {
      const action = pendingConfirmAction;
      pendingConfirmAction = null;
      closeWorkbenchDialog();
      if (action) action();
      return;
    }
    if (editWorkbenchProject) {
      openProjectDialog(editWorkbenchProject);
      return;
    }
    if (openTaskForProject) {
      openTaskDialog("", { projectId: openTaskForProject });
      return;
    }
    if (workbenchMonthPrev) {
      state.workbenchMonthCursor = addMonths(workbenchMonthKey(), -1);
      renderProjectCenterView();
      saveState();
      return;
    }
    if (workbenchMonthNext) {
      state.workbenchMonthCursor = addMonths(workbenchMonthKey(), 1);
      renderProjectCenterView();
      saveState();
      return;
    }
    if (workbenchMonthToday) {
      state.workbenchMonthCursor = toMonthKey(new Date());
      renderProjectCenterView();
      saveState();
      return;
    }
    if (workbenchProjectManage && !event.target.closest("button[data-workbench-task], button[data-workbench-edit-project], button[data-open-task-for-project]")) {
      scrollGanttToProjectDate(workbenchProjectManage.dataset.workbenchProjectManage);
      openProjectManager(workbenchProjectManage.dataset.workbenchProjectManage);
      return;
    }
    if (workbenchProject && !event.target.closest("button, input, select, textarea, a")) {
      openProjectDialog(workbenchProject.dataset.workbenchProject);
      return;
    }
    if (workbenchTask && (!event.target.closest("button, input, select, textarea, a") || event.target.closest(".gantt-task-bar, .project-task-item"))) {
      openTaskDialog(workbenchTask.dataset.workbenchTask);
      return;
    }
    if (workbenchMember && !event.target.closest("button, input, select, textarea, a")) {
      openMembersDialog(workbenchMember.dataset.workbenchMember);
      return;
    }
    if (workbenchDelivery && !event.target.closest("button, input, select, textarea, a")) {
      openDeliveryDialog(workbenchDelivery.dataset.workbenchDelivery);
      return;
    }
    if (workbenchReview && !event.target.closest("button, input, select, textarea, a")) {
      openReviewDialog(workbenchReview.dataset.workbenchReview);
      return;
    }

    if (jumpView) {
      state.currentView = jumpView;
      render();
    }

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
    const ganttResize = event.target.closest("[data-workbench-gantt-resize]");
    if (ganttResize) {
      event.stopPropagation();
      const [taskId, edge] = ganttResize.dataset.workbenchGanttResize.split(":");
      ganttResizeDrag = { taskId, edge };
      ganttDragSource = ganttResize.closest("[data-workbench-gantt-task]");
      ganttDragSource?.classList.add("gantt-dragging");
      event.dataTransfer.setData("text/plain", `workbench-resize:${ganttResize.dataset.workbenchGanttResize}`);
      event.dataTransfer.effectAllowed = "move";
      document.body.classList.add("gantt-is-resizing");
      return;
    }
    const ganttSource = event.target.closest("[data-workbench-gantt-task]");
    if (ganttSource) {
      ganttDragSource = ganttSource;
      ganttDragSource.classList.add("gantt-dragging");
      event.dataTransfer.setData("text/plain", `workbench:${ganttSource.dataset.workbenchGanttTask}`);
      event.dataTransfer.effectAllowed = "move";
      return;
    }
    const source = event.target.closest("[data-drag-task]");
    if (!source) return;
    personalEdgeSwitchedThisDrag = false;
    event.dataTransfer.setData("text/plain", source.dataset.dragTask);
    event.dataTransfer.effectAllowed = "move";
  });
  document.addEventListener("dragover", (event) => {
    const ganttTarget = event.target.closest("[data-workbench-gantt-date]");
    if (ganttTarget) {
      event.preventDefault();
      ganttTarget.classList.add("drop-target");
      const [scope, taskId] = event.dataTransfer.getData("text/plain").split(":");
      const resizeTaskId = scope === "workbench-resize" ? taskId : ganttResizeDrag?.taskId;
      if (resizeTaskId) updateGanttResizePreview(resizeTaskId, ganttTarget.dataset.workbenchGanttDate);
      return;
    }
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
    event.target.closest("[data-workbench-gantt-date]")?.classList.remove("drop-target");
    event.target.closest("[data-drop-date]")?.classList.remove("drop-target");
  });
  document.addEventListener("drop", (event) => {
    clearTimeout(personalEdgeSwitchTimer);
    personalEdgeSwitchTimer = 0;
    const ganttTarget = event.target.closest("[data-workbench-gantt-date]");
    if (ganttTarget) {
      event.preventDefault();
      ganttTarget.classList.remove("drop-target");
      const [scope, taskId, edge] = event.dataTransfer.getData("text/plain").split(":");
      const resizeTaskId = scope === "workbench-resize" ? taskId : ganttResizeDrag?.taskId;
      const resizeEdge = scope === "workbench-resize" ? edge : ganttResizeDrag?.edge;
      clearGanttResizePreview();
      if (resizeTaskId) resizeWorkbenchTaskActualDate(resizeTaskId, resizeEdge, ganttTarget.dataset.workbenchGanttDate);
      else if (scope === "workbench") moveWorkbenchTaskToDate(taskId, ganttTarget.dataset.workbenchGanttDate);
      ganttResizeDrag = null;
      return;
    }
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
    clearGanttResizePreview();
    ganttDragSource?.classList.remove("gantt-dragging");
    ganttDragSource = null;
    ganttResizeDrag = null;
    clearTimeout(personalEdgeSwitchTimer);
    personalEdgeSwitchTimer = 0;
    personalEdgeSwitchedThisDrag = false;
  });
}

bindEvents();
render();
