# 《旦仔煎蛋挑战》H5 Demo

这是一个使用原生 HTML、CSS、JavaScript、Canvas 和 Vite 制作的手机竖屏小游戏。

## 当前核心玩法

- 每关 10 秒，开局拥有 3 颗心。
- 每颗蛋只需一次出锅操作：浅绿色区域为 `Good`，深绿色核心为 `Perfect`。
- `Good` 稳定出锅，`Perfect` 奖励更高；点早、点晚或糊锅会扣 1 颗心。
- `Perfect` 连中 3 次进入活力状态，连中 5 次进入大狂欢状态。
- 倒计时结束时仍有生命即可过关，不再要求完成指定数量。
- 每过一关选择 1 张强化，强化会保留到本轮结束。
- 普通关卡会直接开始倒计时，不再重复弹出固定目标说明。
- 煎锅当前保持基础款，不会随关卡自动升级或附加隐藏加成。
- 随机事件会改变目标区、火速、金币、回血或容错。
- “金币狂欢”事件会暂停关卡倒计时，玩家可连续狂点按钮爆金币。
- 本轮获得的金币可在商城永久购买旦仔造型。
- 每个旦仔造型都有独立被动，例如扩大目标区、增加生命或强化金币狂欢。

当前循环是：

`看准火候 -> 点击出锅 -> 获得强化 -> 赚金币 -> 解锁角色`

## Windows 启动

安装 Node.js 24 LTS 后，在 PowerShell 中运行：

```powershell
git clone https://github.com/freddouyf/danzai-egg-fry-demo.git
cd danzai-egg-fry-demo
npm install
npm run dev
```

本机已有项目时也可以双击 `启动手机试玩.cmd`。手机试玩要求电脑和手机连接同一个 Wi-Fi：

```powershell
npm run dev:host
```

在手机浏览器打开终端显示的 `Network` 地址。若 Windows 防火墙询问，只需允许专用网络。

## 操作

- 手机、鼠标：看准火候，点击一次“出锅”。
- `Space`：执行当前动作或金币狂点。
- `R`：重新开始。
- `Esc`：暂停或继续。

## 文件结构

```text
danzai-egg-fry-demo/
├─ index.html
├─ package.json
├─ src/
│  ├─ main.js          页面流程、输入和界面更新
│  ├─ game.js          生命、计时、事件和强化规则
│  ├─ renderer.js      Canvas 场景和动画
│  ├─ assets.js        PNG 素材映射与回退
│  ├─ skins.js         角色、价格和角色被动
│  ├─ progression.js   本地金币、战绩和收藏
│  └─ style.css        手机竖屏样式
├─ public/assets/      旦仔、锅具、鸡蛋和事件图片
└─ test/               自动测试
```

## 替换旦仔 PNG

设计师素材放在 `public/assets/`。

推荐的通用文件名：

```text
danzai_idle.png
danzai_happy.png
danzai_action.png
danzai_fail.png
pan.png
egg.png
logo.png
```

现有不同文件名已经可以在 `src/assets.js` 和 `src/skins.js` 中集中适配，不需要强制改名。详细规则见 `public/assets/README.md`。

## 测试与构建

```powershell
npm test
npm run build
```

构建结果生成在 `dist/`。

## 隐私与安全

- 游戏没有后端、账号、支付或远程 API，不包含 API Key、访问令牌或密码。
- 金币、衣柜和战绩仅保存在当前浏览器的 `localStorage`，清理浏览器数据会丢失。
- `启动ChatGPT试玩.cmd` 会临时创建公网地址，仅用于短时试玩；窗口关闭后地址失效。
- 公开仓库中的代码和图片都可以被任何人下载。旦仔角色及设计师素材不随代码授权，详见 `ASSET_LICENSE.md`。
