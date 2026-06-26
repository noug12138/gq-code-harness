export const meta = {
  name: 'init-bootstrap',
  description: '给新项目铺底：并行测绘各子系统 → critic 自检查漏(绕回有上限) → writer 起草落盘(待人审) + 汇总 ≤7 待问',
  phases: [
    { title: 'Survey', detail: '每子系统一个测绘 agent，只回压缩小结' },
    { title: 'Self-check', detail: 'critic 查漏，绕回补扫（≤2 轮）' },
    { title: 'Draft', detail: 'writer agent 把草稿写盘（待人审）' },
  ],
}

// args 可能以对象或 JSON 字符串到达（不同触发路径），统一归一为对象
let A = args || {};
if (typeof A === 'string') { try { A = JSON.parse(A); } catch { A = {}; } }
const projectRoot = A.projectRoot;
const units = A.units || [];

const SURVEY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'techStack', 'keyModules', 'dataFlows', 'entryPoints', 'candidateContracts', 'openQuestions'],
  properties: {
    name: { type: 'string' },
    techStack: { type: 'string' },
    keyModules: { type: 'array', items: { type: 'string' } },
    dataFlows: { type: 'array', items: { type: 'string' } },
    entryPoints: { type: 'array', items: { type: 'string' } },
    candidateContracts: { type: 'array', items: { type: 'string' } },
    openQuestions: { type: 'array', items: { type: 'string' } },
  },
}

const CRITIC_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['gaps', 'looksGuessed'],
  properties: {
    gaps: { type: 'array', items: { type: 'object', required: ['unit', 'what'], properties: { unit: { type: 'string' }, what: { type: 'string' } } } },
    looksGuessed: { type: 'array', items: { type: 'string' } },
  },
}

function surveyPrompt(u, extra) {
  return `你是"测绘"助手。深入读下面这个子系统，**只回一份压缩小结**（绝不要回贴原始代码——你读过的内容留在你自己上下文里）。
子系统：${u.name}（${u.kind}），路径：${u.path}（在项目根 ${projectRoot} 下）。
读它的关键入口、目录结构、配置、代表性文件，产出字段：
- techStack：技术栈一句话
- keyModules：关键模块/目录（≤8，每条一句）
- dataFlows：主要数据流/调用链（≤5）
- entryPoints：对外入口（接口/页面/任务，≤8）
- candidateContracts：值得固化的"坑/约定"候选（≤5，每条一句）
- openQuestions：读不懂、需人确认的问题（≤3；没有就空数组）
- name 字段请原样回 "${u.name}"
${extra || ''}`;
}

phase('Survey');
let surveys = (await parallel(units.map((u) => () =>
  agent(surveyPrompt(u), { label: `survey:${u.name}`, phase: 'Survey', schema: SURVEY_SCHEMA })
    .then((r) => (r ? { ...r, name: u.name } : null))
))).filter(Boolean);

phase('Self-check');
let round = 0;
let looksGuessed = [];
while (round < 2) { // §13 授权的保护上限
  const critic = await agent(
    `你是审查者。下面是各子系统测绘小结的 JSON 数组。指出：
- gaps：需要补扫的子系统（信息有缺口、或结论像在猜，且能定位到具体子系统），格式 {unit, what}；
- looksGuessed：定位不到具体子系统的整体存疑（仅提示，会并入待问，不触发补扫）。
只回 JSON。\n` + JSON.stringify(surveys),
    { label: `critic:r${round + 1}`, phase: 'Self-check', schema: CRITIC_SCHEMA }
  );
  if (!critic) break;
  looksGuessed = critic.looksGuessed || [];
  if (!critic.gaps || critic.gaps.length === 0) break;
  const names = [...new Set(critic.gaps.map((g) => g.unit))];
  const gapUnits = names.map((n) => units.find((u) => u.name === n)).filter(Boolean);
  if (gapUnits.length === 0) break;
  log(`第 ${round + 1} 轮补扫 ${gapUnits.length} 个子系统`);
  const redo = (await parallel(gapUnits.map((u) => () =>
    agent(surveyPrompt(u, `上一轮被指出有缺口/像猜，重点补全：` + critic.gaps.filter((g) => g.unit === u.name).map((g) => g.what).join('；')),
      { label: `resurvey:${u.name}`, phase: 'Self-check', schema: SURVEY_SCHEMA })
      .then((r) => (r ? { ...r, name: u.name } : null))
  ))).filter(Boolean);
  for (const r of redo) { const i = surveys.findIndex((s) => s.name === r.name); if (i >= 0) surveys[i] = r; else surveys.push(r); }
  round++;
}

// 汇总待问：survey 的 openQuestions + critic 整体存疑，去重 + 压到 ≤7（纯 JS）
const questions = [...new Set([...surveys.flatMap((s) => s.openQuestions || []), ...looksGuessed])].slice(0, 7);

phase('Draft');
const draft = await agent(
  `你是"起草"助手。下面是各子系统测绘小结 JSON。整理成草稿文档并用 **Write 工具落盘**，每个文件**顶部第一行**写 \`> 机器起草·待人审\`：
1. ${projectRoot}/docs/architecture/module-map.md：子系统 + 关键模块 + 数据流 + 对外入口的汇总表。
2. 候选契约：把各 candidateContracts 汇成一节，追加到上面 module-map.md 末尾的「候选防复发契约（待定）」段（不要直接建 Cxxx，避免臆造编号）。
拿不准/缺口的内容放进文档「待确认」段，不要编业务规则。写完只回 JSON：{filesWritten:[相对项目根的路径...]}。
小结 JSON：\n` + JSON.stringify(surveys),
  { label: 'draft-writer', phase: 'Draft', schema: { type: 'object', additionalProperties: false, required: ['filesWritten'], properties: { filesWritten: { type: 'array', items: { type: 'string' } } } } }
);

return {
  units: units.map((u) => u.name),
  questions,
  filesWritten: (draft && draft.filesWritten) || [],
  selfCheckRounds: round,
};
