# Roadster2-3D · NEON RUN

驾驶第二代 Tesla Roadster 冲出霓虹高速：变道躲车流、起跳越障、长按飞行、桶滚翻腾，一路收集金币与道具。单文件 Three.js 实现，无构建、无依赖安装。

## 玩法

- 高速无尽跑：变道 + 起跳 + 长按飞行，撞到障碍即结束。
- 金币与高空光环计入分数，道具提供 NITRO 等临时增益。
- **进攻**：加速中撞上车辆把它直接撞飞（RAM +250）；锥桶任何速度都能撞飞（+50）；空中按 ↓ 俯冲落地（SLAM）砸飞周围车辆（每辆 +150）。路障和水泥墩撞了照样结束。
- 距离、当前分、金币、个人最高分在 HUD 实时显示。
- 内置自动驾驶（AUTOPILOT）演示模式。
- **直播模式**：`?director=1` 或按 F 开自动驾驶后自动启用导播——6 机位自动切换、RAM/SLAM 慢放、高光回放、中英双语字幕。
- **内容事件**：5 种天气每 1500m 过渡切换；每 1400m 一条 8 连天路光环；每 5km 一次 18 秒火箭段（低重力、星空、无障碍）。
- 最高分存浏览器 `localStorage`。

## 操作

| 按键 | 作用 |
|---|---|
| ← → | 变道 |
| SPACE | 起跳；长按飞行；菜单/结算时开始或重开 |
| Q / E | 桶滚（左右） |
| W / SHIFT | 加速；加速/氮气中撞击车辆 = 撞飞（RAM） |
| ↓ / S | 空中俯冲，落地触发砸击（SLAM） |
| F | 自动驾驶开关 |
| M | 音效开关 |

## 运行

```bash
python -m http.server 8321 --bind 127.0.0.1
# 打开 http://127.0.0.1:8321/game/ROADSTER-特斯拉.html
```

直接双击 `game/ROADSTER-特斯拉.html` 也能玩，但 Three.js 与字体走 CDN，需要联网。

## 直播

```bash
node stream/server.mjs        # 事件服务 + 静态服务，127.0.0.1:8790
```

- 游戏画面：`http://127.0.0.1:8790/game/ROADSTER-特斯拉.html?director=1`
- OBS 浏览器源：`http://127.0.0.1:8790/overlay.html`（1920×1080，透明背景）
- overlay 显示里程/分数/金币/速度与最近事件；离开本地服务时游戏会自动跳过事件上报，不影响游玩。

## 目录

```
game/ROADSTER-特斯拉.html   游戏本体（HTML + CSS + JS 一体）
stream/server.mjs           零依赖 SSE 事件服务 + 静态服务
stream/overlay.html         OBS 叠加层（透明）
stream/README.md            启动与 OBS 配置
AGENTS.md                   协作契约：角色、环境、开发循环、验收命令
TASKS.md                    任务队列与已知问题
```

## 技术栈

Three.js 0.128（CDN）、原生 Canvas 程序化纹理与自定义 Points 着色器、WebAudio 程序化引擎/推进器/道具音效，无前端框架。

## 开发

开发流程、验收清单与协作规范见 [AGENTS.md](AGENTS.md)，任务进度见 [TASKS.md](TASKS.md)。

## 已知限制

- Three.js 与字体依赖 CDN，离线不可用。
- 只有桌面键盘操作，无触屏适配。
- 无暂停、无 BGM。
