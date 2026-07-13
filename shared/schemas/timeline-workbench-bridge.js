(function () {
  const WORKBENCH_STORAGE_KEY = "project-workbench-v2";
  const PROJECT_TYPES = ["老品风格优化项目", "品牌向优化项目-店铺/VI", "设计款营销项目", "重点视频", "TK项目"];
  const PROJECT_STATUSES = ["待开始", "进行中", "暂停", "已完成"];
  const TASK_MODULES = ["方案制定", "AMAZON出图", "NPC出图", "AMAZON排版", "NPC排版", "脚本制定", "视频拍摄", "视频剪辑", "视频修改定稿"];
  const TASK_STATUSES = ["待开始", "进行中", "已完成", "延期", "暂停"];
  const PRIORITIES = ["高", "中", "低"];
  const MEMBER_GROUPS = ["摄影", "摄像", "软装", "3D", "平面"];

  const LEGACY_TASK_MODULE_MAP = {
    "Amazon出图": "AMAZON出图",
    "平面排版": "AMAZON排版",
    "视频": "视频修改定稿",
    "TK视频": "视频剪辑"
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function text(value) {
    return String(value || "").trim();
  }

  function hasAny(value, terms) {
    const source = text(value).toLowerCase();
    return terms.some((term) => source.includes(term.toLowerCase()));
  }

  function toDateKey(value) {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return String(value);
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function todayKey() {
    return toDateKey(new Date());
  }

  function stableId(prefix, value) {
    let hash = 2166136261;
    Array.from(String(value || "")).forEach((char) => {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    });
    return `${prefix}_${Math.abs(hash >>> 0).toString(36)}`;
  }

  function inferProjectType(types) {
    const labels = types.map((item) => item.label).join(" ");
    const hasTk = hasAny(labels, ["TK", "TikTok"]);
    const hasVideo = hasAny(labels, ["视频", "拍摄", "剪辑"]);
    const hasImage = hasAny(labels, ["图片", "出图", "平面", "排版", "NPC", "Amazon", "3D", "AI"]);
    if (hasTk && types.every((item) => hasAny(item.label, ["TK", "TikTok"]))) return "TK项目";
    if (hasVideo && !hasImage) return "重点视频";
    return "设计款营销项目";
  }

  function isNpcContext(nodeName, typeLabel) {
    return hasAny(`${nodeName} ${typeLabel}`, ["NPC"]);
  }

  function inferModules(item, typeLabel) {
    const nodeName = item.name;
    const context = `${nodeName} ${typeLabel}`;
    const npc = isNpcContext(nodeName, typeLabel);
    const amazon = hasAny(context, ["Amazon", "AMAZON", "亚马逊"]);
    const bothMarketplaces = (amazon && npc) || hasAny(typeLabel, ["Amazon&NPC", "AMAZON&NPC", "亚马逊&新平台", "亚马逊/NPC"]);
    if (hasAny(nodeName, ["方案"])) return ["方案制定"];
    if (hasAny(nodeName, ["平面", "排版"])) {
      if (bothMarketplaces) return ["AMAZON排版", "NPC排版"];
      return [npc && !amazon ? "NPC排版" : "AMAZON排版"];
    }
    if (hasAny(nodeName, ["图片", "出图", "3D", "AI"])) {
      if (bothMarketplaces) return ["AMAZON出图", "NPC出图"];
      return [npc && !amazon ? "NPC出图" : "AMAZON出图"];
    }
    if (hasAny(nodeName, ["脚本"])) return ["脚本制定"];
    if (hasAny(nodeName, ["拍摄", "分镜", "生成"])) return ["视频拍摄"];
    if (hasAny(nodeName, ["剪辑"])) return ["视频剪辑"];
    if (hasAny(nodeName, ["视频", "审核", "修改", "定稿", "COPY"])) return ["视频修改定稿"];
    return [];
  }

  function inferModule(item, typeLabel) {
    return inferModules(item, typeLabel)[0] || "";
  }

  function shouldImportByDefault(item) {
    return true;
  }

  function moduleGroup(module) {
    if (module === "方案制定") return "软装";
    if (["脚本制定", "视频拍摄", "视频剪辑", "视频修改定稿"].includes(module)) return "摄像";
    if (module === "AMAZON排版" || module === "NPC排版") return "平面";
    if (module === "AMAZON出图" || module === "NPC出图") return "摄影";
    return "摄影";
  }

  function normalizeTaskModule(module) {
    const normalized = LEGACY_TASK_MODULE_MAP[module] || module;
    return TASK_MODULES.includes(normalized) ? normalized : "";
  }

  function buildDraft({ state, items, getTypeLabel }) {
    const selectedTypes = (state.selectedTypes || []).map((type) => ({
      type,
      label: getTypeLabel(type)
    }));
    const activeItems = items.filter((item) => Array.isArray(item.dates) && item.dates.length);
    const startDate = activeItems.map((item) => item.dates[0]).sort()[0] || "";
    const finishDate = state.deliveryDate || activeItems.flatMap((item) => item.dates).sort().at(-1) || "";
    const project = {
      title: text(state.projectName) || "未命名项目",
      image: "",
      series: "",
      projectType: inferProjectType(selectedTypes),
      status: "待开始",
      currentNode: "",
      startDate,
      finishDate,
      lastUpdated: todayKey()
    };

    const tasks = activeItems.map((item, index) => {
      const typeLabel = item.type === "common" ? "共用环节" : getTypeLabel(item.type);
      const modules = inferModules(item, typeLabel);
      const module = modules[0] || "";
      const shouldImport = shouldImportByDefault(item);
      const sourceKey = `${item.type}|${index}|${item.name}`;
      return {
        sourceKey,
        shouldImport,
        sourceType: item.type,
        sourceTypeLabel: typeLabel,
        sourceNode: item.name,
        startDate: item.dates[0],
        plannedDate: item.dates.at(-1),
        duration: item.duration || item.dates.length,
        modules,
        module,
        owner: "",
        status: "待开始",
        priority: "中",
        needsReview: shouldImport && !modules.length,
        excludedReason: shouldImport ? "" : "默认不单独录入，可勾选后手动选择模块",
        note: `来源：排期模板 / ${typeLabel} / ${item.name}；排期：${item.dates[0]} 至 ${item.dates.at(-1)}；工期：${item.duration || item.dates.length}天`
      };
    });

    return { project, tasks };
  }

  function defaultWorkbenchData() {
    return { members: [], projects: [], tasks: [], deliverables: [], reviews: [] };
  }

  function normalizeProject(project) {
    const title = text(project.title || project.name) || "未命名项目";
    return {
      id: project.id || stableId("p", title),
      title,
      name: title,
      image: text(project.image),
      series: text(project.series),
      projectType: PROJECT_TYPES.includes(project.projectType) ? project.projectType : "设计款营销项目",
      status: PROJECT_STATUSES.includes(project.status) ? project.status : "待开始",
      currentNode: text(project.currentNode),
      startDate: toDateKey(project.startDate),
      finishDate: toDateKey(project.finishDate),
      lastUpdated: toDateKey(project.lastUpdated) || todayKey(),
      phases: Array.isArray(project.phases) && project.phases.length ? project.phases : TASK_MODULES.map((module) => ({ name: module, status: "plan", width: Math.floor(100 / TASK_MODULES.length) }))
    };
  }

  function normalizeTask(task) {
    const module = normalizeTaskModule(task.module) || "方案制定";
    const owner = text(task.owner || task.assignee);
    const plannedDate = toDateKey(task.plannedDate || task.dueDate);
    const status = TASK_STATUSES.includes(task.status) ? task.status : "待开始";
    return {
      id: task.id || stableId("t", `${task.projectId}|${task.sourceKey || task.title}|${module}`),
      projectId: task.projectId || "",
      title: text(task.title) || "未命名任务",
      module,
      type: module,
      status,
      owner,
      assignee: owner,
      plannedDate,
      actualDate: toDateKey(task.actualDate),
      ganttStartDate: toDateKey(task.ganttStartDate || task.startDate),
      baselinePlannedDate: toDateKey(task.baselinePlannedDate || plannedDate),
      dueDate: plannedDate,
      note: text(task.note),
      progress: text(task.progress || task.note),
      points: Math.max(1, Number(task.points) || 1),
      priority: PRIORITIES.includes(task.priority) ? task.priority : "中"
    };
  }

  function normalizeMember(member) {
    const name = text(member.name);
    const group = MEMBER_GROUPS.includes(member.group) ? member.group : moduleGroup(member.skills);
    return {
      id: member.id || stableId("m", name),
      name: name || "未命名成员",
      group,
      weeklyCapacity: Math.max(0, Number(member.weeklyCapacity) || 40),
      skills: text(member.skills)
    };
  }

  function loadWorkbenchData() {
    try {
      const parsed = JSON.parse(localStorage.getItem(WORKBENCH_STORAGE_KEY) || "null");
      const source = parsed && typeof parsed === "object" ? parsed : defaultWorkbenchData();
      return {
        members: Array.isArray(source.members) ? source.members.map(normalizeMember) : [],
        projects: Array.isArray(source.projects) ? source.projects.map(normalizeProject) : [],
        tasks: Array.isArray(source.tasks) ? source.tasks.map(normalizeTask) : [],
        deliverables: Array.isArray(source.deliverables) ? clone(source.deliverables) : [],
        reviews: Array.isArray(source.reviews) ? clone(source.reviews) : []
      };
    } catch {
      return defaultWorkbenchData();
    }
  }

  function saveWorkbenchData(data) {
    localStorage.setItem(WORKBENCH_STORAGE_KEY, JSON.stringify(data));
  }

  function sameTitle(a, b) {
    return text(a).toLowerCase() === text(b).toLowerCase();
  }

  function upsertMember(data, owner, module) {
    const name = text(owner);
    if (!name) return;
    const existing = data.members.find((member) => sameTitle(member.name, name));
    if (existing) {
      if (!existing.skills.includes(module)) existing.skills = [existing.skills, module].filter(Boolean).join(" / ");
      return;
    }
    data.members.push(normalizeMember({ name, group: moduleGroup(module), skills: module }));
  }

  function taskModules(task) {
    const modules = Array.isArray(task.modules) ? task.modules : [task.module];
    return Array.from(new Set(modules.map(normalizeTaskModule).filter(Boolean)));
  }

  function minDate(left, right) {
    if (!left) return right;
    if (!right) return left;
    return left < right ? left : right;
  }

  function maxDate(left, right) {
    if (!left) return right;
    if (!right) return left;
    return left > right ? left : right;
  }

  function priorityRank(priority) {
    return { "高": 3, "中": 2, "低": 1 }[priority] || 2;
  }

  function buildFinalTasks(draft) {
    const grouped = new Map();
    const finalTaskOwners = draft.finalTaskOwners || {};
    draft.tasks
      .filter((task) => task.shouldImport)
      .forEach((task) => {
        taskModules(task).forEach((module) => {
          const key = module;
          if (!grouped.has(key)) {
            grouped.set(key, {
              sourceKey: module,
              module,
              shouldImport: true,
              sourceNodes: [],
              sourceTypeLabels: [],
              startDate: "",
              plannedDate: "",
              owner: "",
              status: task.status || "待开始",
              priority: task.priority || "中",
              note: ""
            });
          }
          const finalTask = grouped.get(key);
          finalTask.sourceNodes.push(task.sourceNode);
          finalTask.sourceTypeLabels.push(task.sourceTypeLabel);
          finalTask.startDate = minDate(finalTask.startDate, task.startDate);
          finalTask.plannedDate = maxDate(finalTask.plannedDate, task.plannedDate);
          finalTask.priority = priorityRank(task.priority) > priorityRank(finalTask.priority) ? task.priority : finalTask.priority;
          finalTask.owner = Array.from(new Set([finalTask.owner, task.owner].flatMap((owner) => text(owner).split(/[、,，/]/)).map(text).filter(Boolean))).join("、");
        });
      });

    return Array.from(grouped.values()).map((task) => {
      const nodes = Array.from(new Set(task.sourceNodes.filter(Boolean)));
      const labels = Array.from(new Set(task.sourceTypeLabels.filter(Boolean)));
      return {
        ...task,
        owner: text(finalTaskOwners[task.module]) || task.owner,
        sourceNode: nodes.join("、"),
        sourceTypeLabel: labels.join("、"),
        note: `来源：排期模板 / ${labels.join("、") || "-"} / ${nodes.join("、") || "-"}；排期：${task.startDate || "-"} 至 ${task.plannedDate || "-"}`
      };
    });
  }

  function applyDraftToWorkbench(draft) {
    const invalidTasks = draft.tasks.filter((task) => task.shouldImport && !taskModules(task).length);
    if (invalidTasks.length) {
      throw new Error(`存在未完成模块校对的任务：${invalidTasks.map((task) => task.sourceNode || task.title).join("、")}`);
    }
    const data = loadWorkbenchData();
    const cleanProject = normalizeProject(draft.project);
    const projectIndex = data.projects.findIndex((project) => sameTitle(project.title, cleanProject.title));
    const existingProject = projectIndex >= 0 ? data.projects[projectIndex] : null;
    const project = normalizeProject({
      ...existingProject,
      ...cleanProject,
      id: existingProject?.id || cleanProject.id,
      image: cleanProject.image || existingProject?.image || "",
      series: cleanProject.series || existingProject?.series || ""
    });
    if (projectIndex >= 0) data.projects[projectIndex] = project;
    else data.projects.unshift(project);

    let createdTasks = 0;
    let updatedTasks = 0;
    buildFinalTasks(draft)
      .forEach((task) => {
        const module = normalizeTaskModule(task.module) || "方案制定";
        const taskId = stableId("t", `${project.id}|${module}`);
        const existingIndex = data.tasks.findIndex((item) => item.id === taskId);
        const existingTask = existingIndex >= 0 ? data.tasks[existingIndex] : null;
        const next = normalizeTask({
          ...existingTask,
          id: taskId,
          projectId: project.id,
          title: `${project.title} · ${module}`,
          module,
          owner: task.owner,
          plannedDate: task.plannedDate,
          startDate: task.startDate,
          ganttStartDate: task.startDate,
          baselinePlannedDate: existingTask?.baselinePlannedDate || task.plannedDate,
          status: existingTask?.status === "已完成" ? existingTask.status : task.status || "待开始",
          actualDate: existingTask?.actualDate || "",
          priority: task.priority || "中",
          note: task.note,
          progress: existingTask?.status === "已完成" ? existingTask.progress : task.note
        });
        if (existingIndex >= 0) {
          data.tasks[existingIndex] = next;
          updatedTasks += 1;
        } else {
          data.tasks.push(next);
          createdTasks += 1;
        }
        upsertMember(data, task.owner, module);
      });

    saveWorkbenchData(data);
    return {
      projectId: project.id,
      projectCreated: projectIndex < 0,
      createdTasks,
      updatedTasks,
      totalTasks: createdTasks + updatedTasks
    };
  }

  window.TimelineWorkbenchBridge = {
    WORKBENCH_STORAGE_KEY,
    PROJECT_TYPES,
    PROJECT_STATUSES,
    TASK_MODULES,
    TASK_STATUSES,
    buildDraft,
    buildFinalTasks,
    applyDraftToWorkbench
  };
})();
