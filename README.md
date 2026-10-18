# Roadster2-3D · NEON RUN

驾驶第二代 Tesla Roadster 冲出霓虹高速：变道躲车流、起跳越障、长按飞行、桶滚翻腾，一路收集金币与道具。单文件 Three.js 实现，无构建、无依赖安装。

## 玩法

- 高速无尽跑：变道 + 起跳 + 长按飞行，撞到障碍即结束。
- 金币与高空光环计入分数，道具提供 NITRO 等临时增益。
- 距离、当前分、金币、个人最高分在 HUD 实时显示。
- 内置自动驾驶（AUTOPILOT）演示模式。
- 最高分存浏览器 `localStorage`。

## 操作

| 按键 | 作用 |
|---|---|
| ← → | 变道 |
| SPACE | 起跳；长按飞行；菜单/结算时开始或重开 |
| Q / E | 桶滚（左右） |
| W / SHIFT | 加速 |
| F | 自动驾驶开关 |
| M | 音效开关 |

## 运行

```bash
python -m http.server 8321 --bind 127.0.0.1
# 打开 http://127.0.0.1:8321/game/ROADSTER-特斯拉.html
```

直接双击 `game/ROADSTER-特斯拉.html` 也能玩，但 Three.js 与字体走 CDN，需要联网。

## 目录

```
game/ROADSTER-特斯拉.html   游戏本体（HTML + CSS + JS 一体，4653 行）
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
