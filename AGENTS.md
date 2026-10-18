# AGENTS.md — 协作契约

本仓库是 Human-in-the-Loop 开发工作区的**唯一权威上下文**。任何 Agent 开始工作前先读本文件，任务看 `TASKS.md`。

## 当前状态

- 产品：**Roadster 2 3D — Neon Run**，单文件 Three.js 高速竞速游戏（变道 + 起跳/长按飞行 + 桶滚 + 金币与道具）。
- 主文件 **`game/ROADSTER-特斯拉.html`**（4653 行，HTML+CSS+JS 一体），md5 `dc4fcb28…` 与 `D:\ORCA Workspace\computer use\ROADSTER-特斯拉.html` 一致；**以本仓库为准**。
- 历史：早期的 `roadster.html`（2277 行轻量版）已被此版本取代，仅留在 git 历史里，不要再改它。
- 无构建步骤、无依赖安装：Three.js 0.128 走 CDN，字体走 Google Fonts，离线不可用。
- 无测试框架；验证靠本地静态服务 + 浏览器冒烟。

## 游戏结构（`game/ROADSTER-特斯拉.html`）

| 区段 | 行号（约） | 内容 |
|---|---|---|
| Helpers / 渲染器 | 473–592 | 工具函数、renderer、scene、camera |
| 程序化纹理与环境 | 540–762 | canvas 纹理、PMREM 环境贴图、灯光、天空 |
| 场景道具 | 763–1266 | 路面护栏、城市楼群、树、路灯、广告牌、龙门架、隧道、远山 |
| 云层与天空门 | 1267–1322 | 高空云、光环门 |
| 车模 | 1323–1818 | Roadster 车体、冷气推进器、灯组与接触阴影 |
| 障碍 / 粒子 | 1819–2393 | 障碍物、自定义 Points 着色器粒子 |
| 金币 / 道具 | 2394–2721 | 金币、道具拾取（含 NITRO） |
| 状态与 UI | 2722–2944 | `state`、HUD 引用与刷新 |
| 音频 | 2945–3316 | 引擎、推进器、拾取、撞击音效 |
| 世界推进 / 生成 / 碰撞 | 3317–3547 | 路面滚动、障碍生成、碰撞判定 |
| 流程 / 相机 | 3548–3760 | 开始、结算、重开、镜头 |
| 飞行物理 / 车辆更新 | 3761–4246 | 起跳、长按飞行、桶滚、落地、车辆姿态 |
| FX / 速度线 | 4247–4345 | 烟雾、速度线画布 |
| 输入 / 初始化 / 主循环 | 4346–4653 | 键盘事件、`init`、逐帧 `loop` |

当前没有：触屏/移动端操作、暂停、BGM、离线包。

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
# http://127.0.0.1:8321/game/ROADSTER-特斯拉.html
```

必须重启/刷新页面后验证，浏览器缓存会掩盖改动。

冒烟验收（每次改动后都要做，逐条给证据）：

1. 打开页面，无 console error、无未捕获异常，`title` 为 `Tesla Roadster — Neon Run`。
2. 点击 `#startBtn` 后 `document.body.dataset.state` 变为 `playing`，`#distanceVal` 与 `#speedVal` 持续增长，`#scoreVal` 同步上升。
3. ←/→ 变道生效；SPACE 起跳后 `#flightState` 由 `GROUND` 变为飞行态；Q/E 触发桶滚；F 切换自动驾驶按钮文案。
4. 撞障碍 → `document.body.dataset.state` 依次为 `crashing` → `over`，结算屏出现，最高分写入 `localStorage['roadster-neon-best']`。
5. 刷新后最高分保留。
6. 进攻手段：`__ROADSTER_DEBUG.spawnCar(1, -16)` + 按住 W → `ramCount` 递增、`mode` 仍为 `playing`；不按 W 撞同一辆车 → `mode` 变 `crashing`。`spawnCone(1, -14)` 任何速度都撞飞。跳跃后按住 S/↓ 落地 → `slamCount` 递增。
7. 直播模式：`?director=1` 时 `snapshot().broadcastMode === true`，`setShot(name)` 能切换机位；真实 RAM 触发 `slow=true`、`replayActive=true` 且 `#replayVideo.src` 为 blob；`#subtitle` 有中文文案。
8. 天气/事件：`setWeather('neonRain'|'sandstorm'|'day')` 画面与雾切换；`spawnSkyRoad()` 生成光环链；`startRocket()` 后 `rocketActive=true`、`carY` 上升到 10m 以上。
9. overlay：`node stream/server.mjs` 后 POST `/event` 能出现在 `overlay.html` 事件条，游戏内 RAM 事件能实时同步。
10. 无人值守：`?autorestart=1` 撞车后 3s 自动回到 `playing`；`__ROADSTER_DEBUG.simulateStall()` 与 `loseContext()` 会在 ~4s 内触发 reload；60s 内二次触发被抑制。
11. 自动驾驶安全：`autoPilot` 下强行在三条车道刷车、Boss、追捕、塌陷、龙卷风，`mode` 始终为 `playing`。

不要在未实际执行时声称"已验证"。
