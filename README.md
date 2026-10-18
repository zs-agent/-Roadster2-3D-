# Roadster2-3D · NEON RUN

霓虹夜城无尽跑酷赛车。单文件 Three.js 实现，无构建、无依赖安装，打开即玩。

## 玩法

- 四车道，躲避锥桶、路障、水泥墩；擦身（NEAR MISS）额外 +50 分。
- 距离即分数（距离 × 2），速度随时间爬升，撞车即结束。
- **NITRO**：擦身积攒能量，攒到 25% 后按空格释放，2.5 秒加速期速度 ×1.45、额外得分 ×1.5。
- 最高分存在浏览器 `localStorage`。

## 操作

| 按键 | 作用 |
|---|---|
| ← → / A D | 换道 |
| 空格 | 释放 NITRO（游戏中）；开始/重开（菜单/结算） |
| Enter | 开始 / 重开 |
| M | 静音切换 |

## 运行

无需构建，起一个静态服务即可（直接双击 `game/roadster.html` 也能跑，但字体与 Three.js 走 CDN，需要联网）：

```bash
python -m http.server 8321 --bind 127.0.0.1
# 打开 http://127.0.0.1:8321/game/roadster.html
```

## 目录

```
game/roadster.html    游戏本体（HTML + CSS + JS 一体，约 2400 行）
AGENTS.md             协作契约：角色、环境、开发循环、验收命令
TASKS.md              任务队列与已知问题
```

## 技术栈

Three.js 0.128（CDN）、原生 Canvas 程序化纹理、WebAudio 程序化引擎声与音效，无前端框架。

## 开发

改动流程、验收清单与协作规范见 [AGENTS.md](AGENTS.md)，任务进度见 [TASKS.md](TASKS.md)。

## 已知限制

- Three.js 与字体依赖 CDN，离线不可用。
- 仅桌面键盘操作，无触屏适配。
- 无暂停、无 BGM、无体力/护盾等其他道具。
