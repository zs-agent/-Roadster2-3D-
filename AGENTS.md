# AGENTS.md — 协作契约

本仓库是 Human-in-the-Loop 开发工作区的**唯一权威上下文**。任何 Agent 开始工作前先读本文件，任务看 `TASKS.md`。

## 当前状态

- 产品：**Tesla Roadster II — NEON RUN**，单文件 Three.js 霓虹无尽赛车游戏。
- 主文件 `game/roadster.html`（2277 行，HTML+CSS+JS 一体）。原始副本在 `D:\ORCA Workspace\computer use\roadster.html`，已确认与本仓库副本 md5 一致；**以本仓库为准**，原目录副本待用户确认后清理。
- 无构建步骤、无依赖安装：Three.js 0.128 走 CDN，字体走 Google Fonts，离线不可用。
- 无测试框架；验证靠本地静态服务 + 浏览器冒烟。

## 游戏结构（`game/roadster.html`）

| 区段 | 行号（约） | 内容 |
|---|---|---|
| CSS / HUD 样式 | 12–290 | 主题变量、开始屏、HUD、结算屏、响应式 |
| 工具函数与状态 | 299–336 | `state`/`speed`/`distance`/`bonus`/`lane`/`best` 等全局 |
| 渲染器与纹理 | 338–640 | `makeCanvas` 程序化纹理：沥青、霓虹广告、窗户、路面 |
| 场景 | 642–1026 | 灯光、天空、星、建筑、护栏、灯柱、隧道、棕榈 |
| 车模 | 1028–1470 | `loftGeometry` 车体、座舱、轮毂、灯、辉光 |
| 障碍与生成 | 1471–1600 | 锥桶/路障/水泥墩，`spawnRow` 按难度调间隔 |
| 粒子/尾迹 | 1668–1800 | 轮胎烟、火花、速度线 |
| 音频 | 1817–1885 | WebAudio 程序化引擎声 + 撞击音，localStorage 记忆静音 |
| HUD/流程 | 1884–1980 | 分数=距离×2+擦身奖励，结算、最高分 |
| 输入 | 1981–1998 | 仅键盘：←/→ 或 A/D 换道，Enter/Space 开始，M 静音 |
| 世界/物理/碰撞 | 2002–2215 | `updateWorld`、`updateCar`、`updateObstacles`（碰撞→`crashWith`）、速度递增 |
| 主循环 | 2223–2277 | `animate` 逐帧调度 |

当前没有：触屏/移动端操作、暂停、设置项、道具或加速、音效音乐、离线包。

## 角色

| 角色 | 承担者 | 职责 |
|---|---|---|
| 主 Agent | omp（默认 `deepseek/deepseek-flash`，经 magpie 网关 `127.0.0.1:3425`） | 需求分析、架构、拆解、调度、审查、对外沟通 |
| 执行 Agent | `pi` CLI 1.0.4 | 编码、重构、修复、跑验证 |
| 维护 Subagent | `task` 工具的 smol 角色（`deepseek-v4-flash`） | Issue/PR 分类、进度追踪、异常汇报 |

用户负责提出需求、体验产品、最终决策。

## 环境事实

- OS: Windows 10.0.26200，shell: bash (MSYS)，cwd: `D:/workspace2`
- 可用: git、node v24.14、npm 11.9、python、pi、omp
- 不可用: `gh`、`op`，本会话无 github 工具 → **GitHub Issue/PR 自动维护暂未启用**，不要声称在后台运行
- 模型网关: magpie（`D:\magpie\magpie.exe`，`http://127.0.0.1:3425/v1`）。网关未启动时 omp 报 `Couldn't connect to 127.0.0.1:3425`
- `task.isolation.enabled=false` → 并行任务需手动 `git worktree`，且并行任务之间必须有明确的文件边界
- 远端: `https://github.com/zs-agent/-Roadster2-3D-.git`，`main` 跟踪 `origin/main`。远端已有 README，push 前先 `git rebase origin/main`
- 推送/合并：仅在用户明确授权后执行；本仓库用户已授权 push

## 调用 pi 的强制规范

**用户必须能实时看到 pi 的工作过程**，禁止静默后台执行（`pi -p` 只用于用户同意的纯查询类小任务）。

标准方式：在当前 Orca 标签页**右侧分栏**开 pi（用户实时可见）

```bash
orca terminal split --direction vertical --command "pi --name <任务名> @tmp/<brief>.md"
```

- 任务简报先写到 `tmp/<task>.md`，用 `@tmp/<brief>.md` 传入，避免长提示词转义问题。
- 主 Agent 跟进：`orca terminal read --terminal <handle> --screen`，或直接看右侧面板。
- 收尾：`orca terminal close --terminal <handle>` 关掉该面板；开新任务前先关旧面板，避免右侧堆叠。
- 主 Agent 在面板外验收：浏览器冒烟、`git diff`、语法检查，结论写回 `TASKS.md`。
- 同一文件同一时间只允许一个 pi 会话改动。
- 不要再用独立 Windows Terminal 窗口（`wt`）或静默 `pi -p`；已实测 `--direction vertical` 即出现在右侧。

## 标准循环

1. **分析** — 先理解要解决的实际问题，检查是否已有实现；对明显有问题的方案提出质疑和替代。
2. **拆解** — 拆成可独立验证的小任务，写入 `TASKS.md`（ID、优先级、涉及文件、验收条件、状态）。
3. **实施** — 交给 pi；独立工作目录用 worktree + 任务分支。
4. **验证** — 真实运行 lint/build/测试；**未实际运行的不许写成通过**。
5. **审查** — 主 Agent 检查是否解决原问题、是否破坏既有功能、是否引入冗余依赖、是否满足验收条件。
6. **人工验收** — 汇报改动、命令输出、需要人看的交互点；自动测试通过 ≠ 体验合格。
7. **合并** — 仅在用户明确授权后合并到 main / 推送。

## 授权边界

- 未经明确授权：不合并到 main、不 push、不删数据、不部署生产。
- 涉及产品方向、关键架构、高风险操作的决策，停下来问用户。
- 同一问题连续失败两次：换方案或标阻塞，不无限重试。

## 文档纪律

- 本文件是唯一契约；`TASKS.md` 是唯一任务队列。
- 产品目标、架构、技术决策文档在产品确定后再建立，**不创建空壳文档**。
- 决策一旦做出，写回本文件或 TASKS.md，减少对会话上下文的依赖。

## 运行与验证

本地预览（无构建）：

```bash
"$USERPROFILE/.workbuddy/binaries/python/versions/3.13.12/python.exe" -m http.server 8321 --bind 127.0.0.1
# http://127.0.0.1:8321/game/roadster.html
```

必须重启/刷新页面后验证，浏览器缓存会掩盖改动。

冒烟验收（每次改动后都要做，逐条给证据）：

1. 打开页面，无 console error、无未捕获异常。
2. 点击 START 后 HUD 出现，`#hud-distance` 随时间递增，速度读数上升。
3. ←/→（或 A/D）换道生效，车辆位置随之改变。
4. 撞障碍 → 结算屏出现，分数与最高分正确写入 `localStorage.roadster2_best`。
5. 刷新后最高分保留。

不要在未实际执行时声称"已验证"。
