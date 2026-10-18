# 直播叠加层与事件服务

零依赖本地服务：把游戏的直播事件推给 OBS 浏览器源。只新增 `stream/` 目录，不改动游戏代码。

## 启动

```bash
node stream/server.mjs
# 自定义端口
PORT=8791 node stream/server.mjs
```

启动后监听 `http://127.0.0.1:8790`：

| 路径 | 用途 |
|---|---|
| `/overlay.html` | OBS 叠加层 |
| `/events` | SSE 事件流（游戏端订阅/调试用） |
| `POST /event` | 事件上报（JSON，≤64KB） |
| `POST /viewer` | 上报观众昵称（`{"name":"xxx"}`，保存最近 50 个不重复名字，204） |
| `GET /viewers` | 返回 `{"names":[...]}`，游戏启动时读取 |
| 其它 GET | 静态文件（仓库根目录） |

## OBS 配置

1. 来源 → `+` → **浏览器**
2. URL：`http://127.0.0.1:8790/overlay.html`
3. 宽度 `1920`，高度 `1080`
4. 勾选 **关闭源时关闭页面**
5. 自定义 CSS 留空（页面自带透明背景）

叠加层内容：左上 `LIVE` 状态灯（断线变灰、收到事件闪烁），右上 `DISTANCE / SCORE / COINS / SPEED`，中央 `IMPACT / SLAM / CRASH / FINISH` 高亮（0.8 秒淡出），底部最近 6 条事件（8 秒后淡出）。

## 打开游戏

```
http://127.0.0.1:8790/game/ROADSTER-特斯拉.html?director=1
```

必须走 HTTP（`http://127.0.0.1:8790/...`），**不要用 `file://` 打开**，否则事件的跨域上报会被浏览器拦掉。

## 事件格式

```json
{ "type": "ram|slam|near|crash|over|start|milestone|pickup|trackEvent|viewerHit", "ts": 1234567890,
  "score": 1234, "distance": 900, "coins": 12, "speed": 88, "count": 3, "kind": "ufo|tornado|collapse", "name": "NEON_RIDER" }
```

字段可能缺失，服务端补 `serverTs`，叠加层逐项容错。新连接的客户端会先收到最近 10 条事件；服务端每 15 秒发一次 `: ping` 心跳。
