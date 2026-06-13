# 《旦仔煎蛋挑战》H5 Demo

一个本地运行的手机竖屏 H5 小游戏 Demo，使用原生 HTML、CSS、JavaScript、Canvas 和 Vite。

## 当前核心玩法

- 每关 10 秒，开局 3 颗心。
- 每颗蛋只需要一次操作：看准火候，点击“出锅”。
- 绿色区域命中成功，分为 `Good` 和 `Perfect`。
- 黄色区域、太早、太晚或读条烧到底会扣 1 颗心。
- `Good` 和 `Perfect` 都会维持成功连击，Miss 才会清空连击。
- 第 3 连开始，主反馈显示 `Good x3`、`Perfect x4` 等当前连击数。
- 第 5 连进入更热闹的狂欢反馈。
- 倒计时结束时仍有生命即可进入下一关。
- 每过一关选择 1 张强化，强化保留到本局结束。
- 暂停界面可以查看当前已获得强化。
- 金币狂击事件中可以连续点击获得金币，结束后有短暂保护期避免误点扣心。
- 本局获得的金币可用于商城衣柜购买旦仔造型。

当前循环：

`看准火候 -> 点击出锅 -> 过关选强化 -> 继续挑战 -> 结算金币 -> 解锁造型`

## Windows 启动

```powershell
git clone https://github.com/freddouyf/danzai-egg-fry-demo.git
cd danzai-egg-fry-demo
npm install
npm run dev
```

本机已有项目时，也可以在项目目录运行：

```powershell
npm run dev
```

手机试玩可运行：

```powershell
npm run dev:host
```

然后在同一 Wi-Fi 下，用手机浏览器打开终端显示的 `Network` 地址。

## 操作

- 手机 / 鼠标：点击“出锅”。
- `Space`：执行当前主按钮操作。
- `R`：重新开始。
- `Esc`：暂停或继续。

## 文件结构

```text
danzai-egg-fry-demo/
├─ index.html
├─ package.json
├─ src/
│  ├─ main.js          页面流程、输入和 DOM UI
│  ├─ game.js          生命、计时、事件、强化和结算规则
│  ├─ renderer.js      Canvas 场景和动画表现
│  ├─ assets.js        PNG 素材映射与回退
│  ├─ skins.js         角色造型、价格和被动
│  ├─ progression.js   本地金币、战绩和收藏
│  └─ style.css        手机竖屏样式
├─ public/assets/      旦仔、锅具、鸡蛋和事件图片
└─ test/               自动测试
```

## 替换旦仔 PNG

设计师素材放到 `public/assets/`。

推荐命名：

```text
danzai_idle.png
danzai_happy.png
danzai_action.png
danzai_fail.png
pan.png
egg.png
logo.png
```

如果素材实际文件名不同，可以在 `src/assets.js` 和 `src/skins.js` 中集中适配。

## 测试与构建

```powershell
npm test
npm run build
```

构建结果生成在 `dist/`。

## 隐私与安全

- 当前 Demo 没有后端、账号、支付或远程 API。
- 仓库不应包含 API Key、访问令牌或密码。
- 金币、衣柜和战绩只保存在当前浏览器的 `localStorage`。
- 公开仓库中的代码和图片都可以被他人下载；旦仔角色和设计师素材授权请以 `ASSET_LICENSE.md` 为准。
