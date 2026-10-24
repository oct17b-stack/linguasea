# 法律文件：隐私政策、服务条款、删除数据页

> 这些文件按 App 和服务器**现在真实的做法**写成（2026-10-22；2026-10-24 加了邮箱登录和网页版订阅），**不是法律意见**。上线前请一位泰国律师审阅隐私政策和服务条款。

## 文件和网址

改 `.md`，网页由脚本生成，**不要手改 HTML**。服务器把 `server/public/` 放在网站根目录，所以网页在 `https://<API 域名>/legal/…`。

| 源文件（改这里） | 生成的网页 | 用途 |
|---|---|---|
| `privacy-th.md`、`privacy-en.md` | `/legal/privacy-th.html`、`privacy-en.html` | 隐私政策（PDPA） |
| `terms-th.md`、`terms-en.md` | `/legal/terms-th.html`、`terms-en.html` | 服务条款（含订阅条款、Apple 要求的最低条款） |
| `delete-account-th.md`、`delete-account-en.md` | `/legal/delete-account-th.html`、`delete-account-en.html` | 删除数据说明（Google Play 要求的网页） |
| `index.md` | `/legal/`（`index.html`） | 文件列表和联系邮箱（取消订阅、恢复购买等客服说明在网站的 `/support.html`，不在这里） |

App 里的链接由 `app/src/lib/api.ts` 的 `legalUrl()` 生成：`<EXPO_PUBLIC_API_URL>/legal/privacy-<th|en>.html` 和 `terms-<th|en>.html`。

生成网页（需要 [pandoc](https://pandoc.org/installing.html)）：

```
node docs/legal/build-html.mjs           # 重新生成 server/public/legal/*.html
node docs/legal/build-html.mjs --check   # 只列出还没填的占位符；有就返回 1（上线前应为 0）
```

网页是独立的：样式写在页面里，没有脚本和外部字体，跟随系统深色 / 浅色模式，顶部有切换语言的链接。泰文版和英文版内容要保持一致，两版不一致时以泰文版为准（文件末尾已写明）。

## 要填的占位符

英文版用 `[TBD: …]`，泰文版用 `[รอกรอก: …]`。这些信息不是机密，可以直接发给开发者替换，替换后重新生成网页。

| 英文版 | 泰文版 | 填什么 |
|---|---|---|
| `[TBD: operator legal name]` | `[รอกรอก: ชื่อผู้ให้บริการตามกฎหมาย]` | 个人账号填本人法定姓名（和商店卖家名一致）；公司填注册全称 |
| `[TBD: operator address]` | `[รอกรอก: ที่อยู่ผู้ให้บริการ]` | 联系地址；公司填注册地址 |
| `[TBD: contact email]` | `[รอกรอก: อีเมลติดต่อ]` | 隐私和客服邮箱，例如 `privacy@<域名>` |
| `[TBD: DPO name and contact, or delete this line]` | `[รอกรอก: ชื่อและช่องทางติดต่อ DPO หรือลบบรรทัดนี้]` | 任命了数据保护官（DPO）就填，否则删掉整行（是否需要 DPO 问律师） |
| `[TBD: effective date]` | `[รอกรอก: วันที่มีผลบังคับใช้]` | 生效日期（上线日）；泰文用泰国写法，例如 `1 มีนาคม 2570`（公历 2027 年 = 佛历 2570 年） |
| `[TBD: hosting and database provider]` | `[รอกรอก: ผู้ให้บริการคลาวด์และฐานข้อมูล]` | 托管平台和数据库的公司名称（只在隐私政策里） |
| `[TBD: competent court]` | `[รอกรอก: ศาลที่มีเขตอำนาจ]` | 按律师意见，例如 "the competent courts of Thailand" / "ศาลไทยที่มีเขตอำนาจ"（只在服务条款里） |

`docs/STORE-LISTING.md` 里还有品牌名和联系邮箱的 `[TBD: …]`。

## 文件依赖的事实（改了这些，要同步改文件）

| 事实 | 依据 | 写在哪 |
|---|---|---|
| 服务器只存：账号 ID、token 的哈希（每台登录的设备一个）、创建时间、最后使用日期（每次带 token 的请求更新，每天最多写一次）；登录后的邮箱；待用的登录验证码（邮箱、验证码哈希、过期时间、错误次数）；学习进度；订阅到期日和最近一次订阅事件时间；每天的功能使用次数（发音打分、AI 老师） | `server/db/schema.sql`、`server/src/app.ts`、`server/src/pg-store.ts` | 隐私 §3、§7；删除页 |
| 邮箱登录（可选）：6 位验证码经 Resend 发送，10 分钟有效，只存哈希；用过、错 5 次或重新申请后作废，过期的每天清理；每封邮箱每小时最多 5 次、每个 IP 每小时最多 20 次（计数只在内存）；每台设备一个 token，退出只撤销本机 token；匿名设备登录到已有邮箱的账号时，进度合并进去、取两者较晚的订阅到期日、删掉匿名账号（服务器保留别名，合并前的订阅续费仍记到登录账号）；删除数据会删邮箱、所有 token 和待用验证码；邮箱不用于营销 | `server/src/app.ts`（`/v1/auth/*`）、`server/src/mail.ts`、`server/src/store.ts` | 隐私摘要、§3.1、§3.2、§3.7、§4、§5、§6、§7、§8、§9；条款 §2；删除页；商店隐私问卷 |
| 网页版在 `/app/`：token 和进度存在浏览器 local storage；没有提醒；没有广告或分析 cookie | `app/src/lib/*.web.ts` | 隐私 §2、§3.1、§3.9；删除页 |
| 网页版订阅：必须先登录；RevenueCat Web Billing 收银、Stripe 处理付款，卡号不经过我们的服务器；我们是网页版的卖方；网页价格可以和商店不同；取消走收据邮件里的管理链接（customer portal）；退款由我们处理 | `app/src/lib/purchases.web.ts`、RevenueCat / Stripe 后台 | 隐私 §3.3、§5、§6、§7、§8；条款 §4、§8、§9、§12；删除页；网站 `support.html` |
| 24 个月（730 天）没用过的账号连同它的全部数据每天自动删除 | `server/src/app.ts` 的 `INACTIVE_ACCOUNT_DAYS`、`server/src/main.ts` | 隐私摘要、§3.1、§7、§8；条款 §2；删除页 |
| 录音不保存（发音打分和 AI 老师的语音回答）：服务器只在内存和临时文件里处理几秒；App 处理完删掉录音文件；Azure 没开音频日志 | `server/src/app.ts`（`/v1/pronunciation`、`/v1/transcribe`）、`server/src/transcode.ts`、`server/src/pronunciation.ts`、`app/src/lib/recording-file.ts` | 隐私 §3.4；商店隐私问卷 |
| AI 老师：每一轮 App 把本次对话（学习者的回答和老师之前的回复）、单元、目标语和界面语言发给服务器；服务器把回答里的邮箱和电话打码，把最近最多 24 行连同单元场景和规则发给 Anthropic 的 Claude API；不发账号 ID、IP、设备信息；服务器不保存对话，App 只在本次对话期间保留；第一次使用前有同意界面（写明 Anthropic 和发送内容）；不当回复可举报，举报发到客服邮箱 | `server/src/tutor.ts`、`server/src/scenarios.ts`、`server/src/app.ts`（`/v1/tutor/turn`）、App 的 AI 老师界面 | 隐私摘要、§3.5、§3.8、§3.9、§4、§5、§6、§7、§8、§9；条款 §5、§6、§8；删除页；商店隐私问卷 |
| 账号在第一次需要同步、打分或用 AI 老师时自动创建（匿名），登录是可选的；token 存在 iOS Keychain / Android Keystore（网页版是 local storage） | `app/src/lib/api.ts`、`app/src/lib/secure-store.ts`、`secure-store.web.ts` | 隐私 §3.1；条款 §2 |
| 每日提醒是本地通知，不用推送服务 | `app/src/lib/reminders.ts` | 隐私 §3.9 |
| 没有广告、数据分析、崩溃监控 SDK，没有第三方登录 | `app/package.json` | 隐私摘要、§3.10；商店隐私问卷 |
| 服务器和 Azure Speech 在新加坡（`southeastasia`），RevenueCat 和 Anthropic 在美国，Resend 和 Stripe 写的是"美国及其运营的其他国家" | `docs/LAUNCH.md` 第 6、7 步 | 隐私 §5、§6 |
| Anthropic 的 API 数据不用于训练，只保留有限时间（政策里只写概括说法，没写天数） | Anthropic 商业条款（上线前核对，见下一节） | 隐私 §3.5、§7；删除页 |
| 日志最多 90 天、备份最多 30 天、客服邮件（含 AI 回复举报）最多 2 年 | 托管和数据库的设置（`docs/LAUNCH.md` 第 7 步） | 隐私 §7；删除页 |
| 免费 = 各语言 A 阶段 + 每天有限次发音打分和 AI 老师；Premium = 付费阶段（现在是 B–F）+ 更多次数；年付 7 天免费试用 | `packages/core/src/access.ts`、`server/.env.example`（`PRONUNCIATION_*_PER_DAY`、`TUTOR_*_PER_DAY`）、商店商品设置 | 条款 §3、§4；商店文案 |
| App 里的入口文字：ตั้งค่า → ลบข้อมูลของฉัน（Settings → Delete my data）、กู้คืนการซื้อ（Restore purchases） | App 设置页和付费墙（`content/l1/th/ui.json`） | 隐私 §9；条款 §2、§4；删除页 |
| 用户 13 岁以上 | 产品决定 | 隐私 §10；条款 §1；年龄分级 |

## 待确认的决定（请律师 / 店主确认）

加网页版订阅时写进条款的四条承诺，是起草时替你定的，上线前请确认或改掉（改了要同步改条款泰文和英文版）：

1. **网页版由我们自己销售**（我们是卖方，Stripe 替我们收款）——条款 §4.1。
2. **网页版退款规则**：误扣（重复扣款、按时取消后仍被扣）或 Premium 无法使用且我们修不好的，退还那一笔；其他情况取消后用到当期结束，不退当期剩余部分，法律要求的除外；退回原付款方式——条款 §4.5。
3. **网页版涨价提前 30 天邮件通知**，从之后的第一次续费开始生效——条款 §4.6。
4. **停止服务时，网页版订阅退还已付但未用完的部分**——条款 §9。

另外隐私 §7 和删除页写了：网页版付款记录（在 RevenueCat / Stripe 后台）按税务、会计等法律要求保存，删除 App 数据后也不删。具体年限请律师确认。

## 上线前核对（店主）

- [ ] **核对 Anthropic 当前的数据保留条款**：API 的输入和输出保存多久、是否用于训练（隐私政策写的是"不用于训练、只保留有限时间"）。如果条款和这句话不一致，告诉开发者改隐私 §3.5、§7 和删除页。
- [ ] App 里 AI 老师的同意界面写明了 Anthropic 和发送的内容（学习者的回答、老师之前的回复、单元），并且和隐私 §3.5 一致；举报入口能用，举报发到 [TBD: contact email]。

## 什么时候要更新（update when…）

下面的功能还没上线，所以**没有**写进隐私政策（AI 老师和不活跃账号自动删除已经写进去了）。上线**之前**按对应条目更新政策、条款和商店问卷（`docs/STORE-LISTING.md` 第 5、6 节），改生效日期，重大变化在 App 里提前通知用户。

### 加数据分析（PostHog / Firebase Analytics 等）

- 隐私政策：§3 加"使用数据"（看了哪些页面、开始 / 完成了哪些课、付费流程、设备型号和系统版本、分析用的 ID）；§4 加"改进 App"及其法律依据（正当利益加可关闭的开关，还是征求同意，问律师）；§5、§6 加服务商名称和所在国家；§7 写保存期限；删掉摘要和 §3.10 里"没有分析 SDK"的说法。
- 商店：Apple 勾 Usage Data → Product Interaction（Analytics）和对应的 Identifiers；Google 勾 App activity → App interactions（Analytics）、Device or other IDs。
- 不要用广告 ID、不要和其他公司的数据合并，否则就变成"追踪"，要弹 App Tracking Transparency，问卷也要改。

### 加崩溃监控（Sentry 等）

- 隐私政策：§3 加崩溃和诊断数据（错误堆栈、设备型号、系统和 App 版本，可能有 IP）；§5、§6 加 Sentry（选美国或欧盟数据区）；§7 写保存期限；删掉"没有崩溃监控 SDK"。
- 配置：不发送个人信息（`sendDefaultPii: false`），不记录 IP，过滤 token。
- 商店：Apple 勾 Diagnostics → Crash Data / Performance Data；Google 勾 App info and performance → Crash logs / Diagnostics。

### 加 Apple / Google / LINE 登录

（邮箱 + 验证码登录已经上线并写进文件；下面是再加第三方登录时要做的。）

- 隐私政策：§3.1 在邮箱登录之外加上这些登录方式，写明从各家拿到什么：Apple（用户 ID，可选的姓名和邮箱或中转邮箱）、Google（账号 ID、姓名、邮箱、头像）、LINE（用户 ID、显示名、头像；邮箱要另外申请权限）；§5、§6 加 LINE 的运营方（LY Corporation，日本）等；§9 删除账号时也解除登录绑定；摘要里"不需要姓名、邮箱也能用"要相应改写。
- iOS：提供 Google 或 LINE 登录时，必须同时提供"通过 Apple 登录"或同等保护隐私的登录方式（审核指南 4.8）；删除账号时要调用 Apple 的接口撤销 Sign in with Apple 的 token。
- 条款 §2、删除页：加上新的登录方式（进度跟账号走、邮件申请用登录邮箱核实身份，邮箱登录已经写了）。
- 商店：Apple 再勾 Contact Info → Name（Email Address 已经勾了）；Google 再勾 Personal info → Name、User IDs，账号创建方式加 OAuth。

### AI 老师的做法改变时

- 例如：开始在服务器保存对话、给 Anthropic 多发信息（账号 ID、学习进度等）、换模型服务商、对话数据做别的用途：先改隐私 §3.5、§4、§5、§6、§7 和删除页，更新 App 里的同意界面，再改商店隐私问卷（`docs/STORE-LISTING.md` 第 5、6 节）。
- 只换 Anthropic 的模型（`TUTOR_MODEL`）不用改政策。

### 改用远程推送（服务器发通知）

- 推送 token（Expo 推送服务、APNs、FCM）要写进隐私 §3.9 和 §5，商店问卷加 Device or other IDs。

### 进入新国家（越南、印尼、马来西亚、菲律宾等）

- 出当地语言版本的政策、条款和删除页（新加 `privacy-vi.md` 等以后，生成脚本和顶部的语言切换要扩展到多语言）。
- 按当地法律请当地律师检查，例如：越南《个人数据保护法》（2026 年 1 月 1 日起施行）和第 13/2023 号法令的跨境传输要求；印尼《个人数据保护法》（2022 年第 27 号法律）；马来西亚《个人数据保护法》（2024 年修订：DPO、泄露通知、可携带权）；菲律宾《数据隐私法》（2012 年）。适用法律、消费者权益、商店销售地区也要相应调整。

### 儿童模式

- 要单独设计：泰国 PDPA 第 20 条（未成年人的同意，10 岁以下必须由监护人同意）、Apple Kids 类别规则（不能有第三方分析和广告、要家长门槛）、Google Families 政策。隐私政策 §10 和条款 §1 要重写。

### 加 OTA 更新（EAS Update）或把课程、音频放到 CDN

- App 会向 Expo 或 CDN 发请求（IP、设备和 App 版本等）：隐私 §3.7、§5、§6 加上服务商和所在国家。

### 换服务商或服务器地区

- 换托管、数据库、语音或大模型服务商，或者不在新加坡：改隐私 §5、§6 和占位符；新服务商要有数据处理协议（DPA）。

### 改不活跃账号的期限

- 改了 `INACTIVE_ACCOUNT_DAYS`（现在 730 天 = 24 个月）：同步改隐私摘要、§3.1、§7、§8，条款 §2 和删除页里的"24 个月"。

### 律师确认《计算机犯罪法》第 26 条适用后

- 如果律师认为我们必须保存通信记录至少 90 天：把日志保存设成正好 90 天，并把隐私 §7、删除页里的"最多 90 天"改成"90 天"。

## 收到隐私请求怎么办

1. **记录**：收到日期、对方要求什么、回复日期（记录最多保存 2 年）。
2. **找到数据**：用户登录过的，按邮箱找账号（`select id from accounts where email = '<小写邮箱>';`），先请对方从这个邮箱确认请求。没登录过的，数据只和随机账号 ID 关联：对方给了订单号的，在 RevenueCat 后台按订单号 / 交易号搜客户，客户的 App User ID 就是我们的账号 ID（搜不到可以请 RevenueCat 支持协助）。没有任何能定位的信息时，如实告诉对方我们无法确认哪份数据属于他，并建议以后在 App 里用"设置 → 删除我的数据"。
3. **删除**：请开发者走和 App 里"删除我的数据"同样的删除逻辑（`store.deleteAccount`：token、邮箱和待用验证码、progress、entitlements、usage 一起删除）。对方要求的话，在 RevenueCat 后台该客户页面删除客户（Delete customer）；网页版订阅的付款记录（Stripe）按法律要求保存，删除前先问律师。
4. **查看 / 导出**：请开发者导出 `progress.data`（JSON）、`entitlements` 和 `usage` 里这个账号的行，发给对方。
5. **30 天内回复**。不能照办的（例如法律要求保留）要说明理由，并记录。
6. **AI 回复举报**：看被举报的回复；同类问题反复出现时，请开发者调整 AI 老师的规则（`server/src/tutor.ts`）。举报邮件和其他邮件一样最多保存 2 年。
7. **数据泄露**：先找律师；可能影响用户权利的，发现后 72 小时内通知个人数据保护委员会办公室（www.pdpc.or.th），风险高的还要通知用户。

## 写这些文件时替你做的决定（可以改）

- 两个语言版本不一致时以泰文版为准。
- 用户须满 13 岁；未满 20 岁（泰国法律的未成年人）使用和购买需要监护人同意；建议 App Store 年龄分级选 13+。
- 保存期限：服务器日志最多 90 天；数据库备份最多 30 天；客服邮件（含 AI 回复举报）最多 2 年；账号数据保留到用户删除、24 个月不用自动删除，或停止服务。
- 责任上限：过去 12 个月支付的费用和 1,000 泰铢两者中较高者（死亡、人身伤害、欺诈、故意或重大过失不受限制）。
- 条款重大修改提前 30 天在 App 内通知；停止服务提前 30 天通知。
- 隐私请求 30 天内回复；App 外的删除申请：登录过的用登录邮箱核实，没登录过的靠商店订单号来定位数据。
- App 设置页里"删除我的数据"的文字用 ตั้งค่า → ลบข้อมูลของฉัน（Settings → Delete my data），开发者做界面时要用同样的文字。
