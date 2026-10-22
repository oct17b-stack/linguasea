# 商店上架资料（App Store / Google Play）

> 版本 2026-10-22。文案都按 App 现在真实具备的功能写：四门语言（中、英、日、韩）、泰语讲解、A–B 两个阶段（对齐 HSK 1 / JLPT N5 / TOPIK I / CEFR A1）、间隔复习、发音打分、连胜和 XP、每日提醒。
> **不要**写还没做的功能：AI 口语老师、模拟考、离线下载、排行榜、LINE 登录、家庭版。上架前用正式版对照一遍（见第 8 节）。
> 括号里的数字是"已用字数/上限"，按商店的算法（泰文的声调和元音符号也算字）用脚本数过。改文案后要重新数。
> 网址里的 `<域名>` / `<domain>` 换成服务器域名（见 docs/LAUNCH.md 第 2、8 步），例如 `https://api.example.com/legal/privacy-th.html`。

## 0. 基本信息

| 项目 | 填写 |
|---|---|
| App 名称 | **LinguaSEA（暂定名，[TBD: 最终品牌名]）**，查完商标和商店重名后定稿 |
| Bundle ID / 包名 | `com.linguasea.app`（`app/app.json`；在商店建好 App 后**永远不能改**） |
| 主要语言 | 泰语（th）；另加英语本地化 |
| 分类 | Education（教育）；App Store 第二分类可留空或选 Reference |
| 价格 | 免费下载 + 订阅（App 内购买） |
| 首发地区 | 泰国 |
| 隐私政策网址 | 泰语：`https://<域名>/legal/privacy-th.html`；英语：`https://<域名>/legal/privacy-en.html` |
| 服务条款网址 | `https://<域名>/legal/terms-th.html` / `terms-en.html` |
| 删除数据网址（Google 要求） | `https://<域名>/legal/delete-account-th.html`（页面里有英文版链接） |
| 支持网址（Apple 必填） | 网站的帮助页 `https://<域名>/support.html`（网站在 `server/public/`，正在做）；它上线前可临时用 `https://<域名>/legal/`（法律文件列表和联系邮箱） |
| 营销网址（Apple 可选） | `https://<域名>/` |
| 联系邮箱（Google 必填，会公开） | [TBD: contact email]（和法律文件里的联系邮箱一致） |
| 版权（Apple） | `2026 [TBD: operator legal name]` |

## 1. App Store 文案

### 1.1 名称和副标题

| 字段 | 泰语 | 英语 |
|---|---|---|
| 名称（≤30） | `LinguaSEA: เรียน 4 ภาษา`（23/30） | `LinguaSEA: Learn 4 Languages`（28/30） |
| 副标题（≤30） | `จีน อังกฤษ ญี่ปุ่น เกาหลี`（25/30） | `Lessons explained in Thai`（25/30） |

名称定稿后，把 `LinguaSEA` 换成正式名称并重新数字数。

### 1.2 推广文本（Promotional Text，≤170，可随时改，不用重新审核）

泰语（135/170）：

```
เริ่มเรียนจีน อังกฤษ ญี่ปุ่น หรือเกาหลีได้ฟรี บทเรียนสั้น ๆ อธิบายเป็นภาษาไทย มีคำอ่านภาษาไทยทุกคำ ฝึกพูดแล้วดูคะแนนการออกเสียงได้ทันที
```

英语（156/170）：

```
Start Chinese, English, Japanese or Korean for free: short lessons explained in Thai, Thai-script readings for every word, and instant pronunciation scores.
```

### 1.3 关键词（Keywords，≤100，英文逗号分隔，逗号后不加空格）

泰语（92/100）：

```
เรียนภาษาจีน,ภาษาญี่ปุ่น,ภาษาเกาหลี,ภาษาอังกฤษ,HSK,JLPT,TOPIK,คำศัพท์,พินอิน,ฮิรางานะ,ฮันกึล
```

英语（94/100）：

```
chinese,japanese,korean,english,thai,hsk,jlpt,topik,pinyin,hiragana,hangul,vocabulary,speaking
```

### 1.4 描述（Description，≤4000）

泰语（约 1,600/4000）：

```
เรียนภาษาจีน อังกฤษ ญี่ปุ่น และเกาหลีในแอปเดียว พร้อมคำอธิบายเป็นภาษาไทยทุกบท

LinguaSEA ออกแบบมาสำหรับคนไทยที่อยากเริ่มภาษาใหม่อย่างเป็นขั้นตอน บทเรียนสั้นบทละประมาณ 5–8 นาที เรียนได้ทุกวันแม้มีเวลาน้อย

■ 4 ภาษา สมัครครั้งเดียวเรียนได้ทุกภาษา
• ภาษาจีน: เริ่มจากพินอินและวรรณยุกต์ 4 เสียง
• ภาษาญี่ปุ่น: ฮิรางานะและคาตากานะ
• ภาษาเกาหลี: อักษรฮันกึลและตัวสะกด
• ภาษาอังกฤษ: เสียงที่คนไทยมักออกยาก เช่น th, v/w, r/l และเสียงท้ายคำ

■ อธิบายเป็นภาษาไทย
• ความหมายและคำอ่านภาษาไทยของทุกคำ
• บทสนทนาพร้อมคำแปลภาษาไทย
• "รู้ไว้ใช่ว่า" อธิบายไวยากรณ์ การออกเสียง และวัฒนธรรมสั้น ๆ โดยเทียบกับภาษาไทย

■ ฟัง พูด และตรวจการออกเสียง
• ฟังเสียงได้ทั้งความเร็วปกติและแบบช้า
• ฝึกพูดตาม แล้วดูคะแนนการออกเสียงได้ทันที

■ ทบทวนแบบเว้นระยะ
• ระบบจัดคำศัพท์ให้ทบทวนในเวลาที่เหมาะสม ก่อนที่คุณจะลืม

■ เรียนต่อเนื่องทุกวัน
• นับวันเรียนติดกันและสะสมแต้ม XP
• ตั้งเวลาแจ้งเตือนให้เรียนทุกวัน

■ ระดับชัดเจน
• ระดับ A (เริ่มต้น) และระดับ B (พื้นฐาน) เทียบกับ HSK 1, JLPT N5, TOPIK I และ CEFR A1

■ ฟรีและ Premium
• ฟรี: บทเรียนระดับ A ทุกภาษา การทบทวน และการตรวจการออกเสียงวันละจำนวนจำกัด
• Premium: ปลดล็อกบทเรียนระดับ B ทุกภาษา และตรวจการออกเสียงได้มากขึ้นต่อวัน
• มีแพ็กเกจรายเดือนและรายปี แพ็กเกจรายปีทดลองใช้ฟรี 7 วันสำหรับผู้สมัครใหม่

การสมัครสมาชิกจะต่ออายุอัตโนมัติ เว้นแต่ยกเลิกอย่างน้อย 24 ชั่วโมงก่อนสิ้นสุดรอบปัจจุบันหรือช่วงทดลองใช้ฟรี จัดการหรือยกเลิกได้ในการตั้งค่าบัญชี App Store หรือ Google Play

ไม่มีโฆษณา

นโยบายความเป็นส่วนตัว: https://<โดเมน>/legal/privacy-th.html
ข้อกำหนดการใช้งาน: https://<โดเมน>/legal/terms-th.html

LinguaSEA ไม่มีส่วนเกี่ยวข้องกับองค์กรที่จัดสอบ HSK, JLPT และ TOPIK
```

英语（约 1,800/4000）：

```
Learn Chinese, English, Japanese and Korean in one app, with every lesson explained in Thai.

LinguaSEA is made for Thai speakers who want to start a new language step by step. Lessons take about 5–8 minutes, so you can study every day even when you're busy.

■ 4 languages, one subscription
• Chinese: start with pinyin and the four tones
• Japanese: hiragana and katakana
• Korean: Hangul and final consonants
• English: the sounds Thai speakers find hard, such as th, v/w, r/l and word endings

■ Explained in Thai
• Thai meaning and Thai-script reading for every word
• Dialogues with Thai translations
• Short notes on grammar, pronunciation and culture that compare with Thai

■ Listen, speak and check your pronunciation
• Listen at normal or slow speed
• Repeat after the audio and get an instant pronunciation score

■ Spaced-repetition review
• Words come back for review at the right time, before you forget them

■ Build a daily habit
• Keep your streak and earn XP
• Set a daily study reminder

■ Clear levels
• Stage A (beginner) and Stage B (basic), matched to HSK 1, JLPT N5, TOPIK I and CEFR A1

■ Free and Premium
• Free: Stage A lessons in every language, reviews, and a limited number of pronunciation checks per day
• Premium: unlocks Stage B in every language and more pronunciation checks per day
• Monthly and yearly plans; the yearly plan has a 7-day free trial for new subscribers

Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period or free trial. Manage or cancel any time in your App Store or Google Play account settings.

No ads.

Privacy Policy: https://<domain>/legal/privacy-en.html
Terms of Service: https://<domain>/legal/terms-en.html

LinguaSEA is not affiliated with the organisations that run the HSK, JLPT or TOPIK exams.
```

描述末尾的两个链接是 Apple 对订阅 App 的要求（审核指南 3.1.2：元数据里要有隐私政策和使用条款链接）。"License Agreement（EULA）"保持 Apple 标准 EULA 即可，我们的服务条款第 15 条已包含 Apple 要求的最低条款。

### 1.5 订阅商品的显示文字（App Store Connect → Subscriptions → 本地化）

| 商品 ID | 泰语显示名 / 说明 | 英语显示名 / 说明 |
|---|---|---|
| `linguasea_premium_monthly` | `Premium รายเดือน` / `ปลดล็อกทุกบทเรียนทั้ง 4 ภาษา` | `Premium Monthly` / `Unlock every lesson in all 4 languages` |
| `linguasea_premium_yearly` | `Premium รายปี` / `ปลดล็อกทุกบทเรียน ทดลองใช้ฟรี 7 วัน` | `Premium Yearly` / `Unlock every lesson, 7-day free trial` |
| 订阅组 | `LinguaSEA Premium` | `LinguaSEA Premium` |

## 2. Google Play 文案

### 2.1 标题和简短说明

| 字段 | 泰语 | 英语 |
|---|---|---|
| 应用名称（≤30） | `LinguaSEA: เรียน 4 ภาษา`（23/30） | `LinguaSEA: Learn 4 Languages`（28/30） |
| 简短说明（≤80） | `เรียนจีน อังกฤษ ญี่ปุ่น เกาหลี อธิบายเป็นภาษาไทย ฝึกพูดพร้อมตรวจการออกเสียง`（75/80） | `Chinese, English, Japanese & Korean explained in Thai, with speaking practice`（77/80） |

### 2.2 完整说明（≤4000）

用第 1.4 节的泰语、英语描述（两边通用，字数远低于 4000）。

### 2.3 首个版本的版本说明（Release notes）

- 泰语：`เวอร์ชันแรก: เรียนภาษาจีน อังกฤษ ญี่ปุ่น และเกาหลี ระดับ A–B พร้อมคำอธิบายภาษาไทย`
- 英语：`First release: Chinese, English, Japanese and Korean, Stages A–B, explained in Thai.`

### 2.4 其他字段

- Store settings → App category：Education；Tags 选和语言学习相关的（最多 5 个）。
- Store settings → Store listing contact details：邮箱 [TBD: contact email]；网站填 `https://<域名>/`；电话可不填。
- Policy → App content → Privacy policy：`https://<域名>/legal/privacy-th.html`。

## 3. 截图清单

用**正式版**（不能出现开发版的"测试解锁"按钮、占位价格）、真实课程内容截图。每张配一句短标题（泰语版用泰语，英语版用英语）。

| # | 画面 | 标题（泰语） | 标题（英语） |
|---|---|---|---|
| 1 | 选语言（4 门） | 4 ภาษา สมัครครั้งเดียวเรียนได้ทุกภาษา | 4 languages, one subscription |
| 2 | 首页：A/B 阶段、连胜、XP | เรียนทีละขั้น ตั้งแต่ระดับเริ่มต้น | Step by step, from beginner |
| 3 | 新词：泰语意思 + คำอ่าน + 拼音/罗马字 | ความหมายและคำอ่านภาษาไทยทุกคำ | Thai meaning and reading for every word |
| 4 | 听音选字（中文四声或英语 th/s 这类对比） | ฝึกฟังวรรณยุกต์และเสียงที่คล้ายกัน | Train your ear for tones and similar sounds |
| 5 | 跟读后的发音分数 | พูดตาม แล้วดูคะแนนการออกเสียงทันที | Speak and get an instant pronunciation score |
| 6 | 对话 + 泰语译文 | บทสนทนาพร้อมคำแปลภาษาไทย | Dialogues with Thai translations |
| 7 | "รู้ไว้ใช่ว่า" 讲解卡 | อธิบายสั้น ๆ เป็นภาษาไทย | Short notes in Thai |
| 8 | 复习 | ทบทวนคำศัพท์ก่อนจะลืม | Review words before you forget |

尺寸：

- **iPhone 6.9 英寸**（1320×2868 或 1290×2796，竖屏）：必需，1–10 张（建议 5–8 张）。
- **iPad 13 英寸**（2064×2752 或 2048×2732）：`app/app.json` 里 `supportsTablet: true`，所以**必需**。不想做 iPad 版就请开发者改成 `false`。
- **Google Play 手机截图**：2–8 张，竖屏 9:16，建议 1080×1920 或更高。
- **Google Play 宣传图（Feature graphic）**：1024×500，必需。
- **Google Play 图标**：512×512 PNG。
- 可选：App Store 预览视频（15–30 秒）、Google Play 的 YouTube 宣传视频。

## 4. 年龄分级

### 4.1 Apple（App Store Connect → App Information → Age Rating）

问卷以 App Store Connect 当时的问题为准，按下面原则回答：

| 问题 | 答案 |
|---|---|
| 家长控制（Parental Controls）、年龄验证（Age Assurance） | No |
| 不受限制的网页浏览（Unrestricted Web Access） | No |
| 用户生成内容（User-Generated Content）、私信 / 聊天（Messaging and Chat） | No |
| 广告（Advertising） | No |
| 粗口、恐怖、性、暴力、武器、医疗 / 健康、赌博、竞赛、抽奖 / 开箱等所有内容类问题 | None / No |
| 酒精、烟草、药物（Alcohol, Tobacco, or Drug Use or References） | None；如果课文里教了"啤酒、清酒、烧酒"之类的词，选 Infrequent |
| Made for Kids（儿童类别） | No |

问卷算出来的结果大概是 4+。**建议**在同一页把分级手动调高到 **13+**，和服务条款"13 岁以上"一致（这是建议，你可以决定保留 4+）。

### 4.2 Google Play 内容分级（Policy → App content → Content rating，IARC 问卷）

- 类别：Reference, News, or Educational（参考、新闻或教育）
- 暴力、性、粗口、受管制物品、赌博、恐怖：全部 No
- 用户之间能否互动或交换内容：No
- 是否分享用户的实际位置：No
- 是否可以购买数字商品：**Yes**（订阅）
- 预计结果：Everyone / PEGI 3 / IARC 3+

### 4.3 Google Play 目标受众（Policy → App content → Target audience and content）

- 目标年龄：**13–15、16–17、18 岁及以上**（不要勾 12 岁及以下）
- App 是否可能无意中吸引儿童：No（面向学生和上班族）

## 5. Apple App Privacy（App Store Connect → App Privacy）

依据：App 本身、服务器（`server/src/app.ts`、`server/db/schema.sql`）和 RevenueCat 的官方建议。"关联到用户"按保守口径填"是"（数据都挂在随机账号 ID 上）。

**Do you or your third-party partners collect data from this app?** → Yes

| 数据类型 | 用途 | 关联到用户？ | 用于追踪？ | 说明 |
|---|---|---|---|---|
| Identifiers → **User ID** | App Functionality | Yes | No | 每次安装随机生成的账号 ID（RevenueCat 也用它作 App User ID） |
| Purchases → **Purchase History** | App Functionality, Analytics | Yes | No | RevenueCat 订阅记录（RevenueCat 要求所有使用者都勾这两个用途）；服务器保存订阅到期日 |
| Usage Data → **Product Interaction** | App Functionality | Yes | No | 学习进度：完成的课、复习记录、XP、连胜 |

**不勾**的类型和原因：

- User Content → Audio Data：发音录音只做实时打分，服务器和 Microsoft 都不保存。Apple 的定义里"只为实时处理请求、不超过必要时间保存"的数据不算"收集"。如果你想更保守，也可以勾上：Audio Data → App Functionality → 不关联 → 不追踪。
- Contact Info（姓名、邮箱、电话）、Location、Contacts、Photos、Health、Financial Info（卡号）、Browsing / Search History、Diagnostics（没有崩溃监控 SDK）、Device ID（没有用 IDFA）：都不收集。
- 服务器日志里的 IP 只用于安全和限流，不推算位置，不需要单独申报。

**Tracking：No**（没有广告、没有 IDFA、不和其他公司的数据合并），因此不需要 App Tracking Transparency 弹窗。

## 6. Google Play Data safety（Policy → App content → Data safety）

**Does your app collect or share any of the required user data types?** → Yes
**Is all of the user data collected by your app encrypted in transit?** → Yes（全部走 HTTPS；`EXPO_PUBLIC_API_URL` 必须是 `https://`）
**Account creation** → 选允许创建账号，方式选 **Other**（说明：首次需要同步或打分时自动创建匿名账号，没有用户名和密码）；删除账号网址填 `https://<域名>/legal/delete-account-th.html`
**Do you provide a way for users to request that their data be deleted?** → Yes（App 内 + 上面的网址）

| Play 数据类型 | 收集 | 分享 | 临时处理（ephemeral） | 必需 / 可选 | 用途 | 说明 |
|---|---|---|---|---|---|---|
| Financial info → **Purchase history** | Yes | No | No | Required | App functionality, Analytics | RevenueCat 订阅记录、服务器保存的订阅到期日 |
| App activity → **Other actions** | Yes | No | No | Required | App functionality | 学习进度（完成的课、复习记录、XP、连胜） |
| Audio → **Voice or sound recordings** | Yes | No | **Yes** | Optional | App functionality | 发音打分录音：Azure 实时打分，不保存；不用麦克风也能上课 |
| Device or other IDs | Yes | No | No | Required | App functionality, Account management | 每次安装随机生成的账号 ID |

- "分享"填 No：Microsoft Azure、RevenueCat、托管商都是替我们处理数据的服务商，按 Google 的定义不算分享。
- 不收集：Location、Personal info（姓名、邮箱、电话等）、Messages、Photos and videos、Files and docs、Calendar、Contacts、Web browsing、App info and performance（没有崩溃 / 诊断 SDK）。
- Committed to follow the Play Families Policy：No（不是儿童 App）。
- Independent security review：No。

## 7. 其他声明和审核信息

**Apple**

- 出口合规（Export Compliance）：只用标准 HTTPS 加密 → 选豁免（建议开发者在 `app.json` 设 `ITSAppUsesNonExemptEncryption: false`，以后每个版本就不用再问）。
- 内容版权（Content Rights）：课程内容自有；配音由 Azure 生成，有商用授权。
- 广告标识符（IDFA）：不使用。
- App Review Information：不需要登录账号；联系人填你本人的姓名、电话、邮箱。审核备注（英文）：

```
LinguaSEA teaches Chinese, English, Japanese and Korean to Thai speakers. No sign-in is needed: the app creates an anonymous account automatically when it first syncs progress or scores pronunciation.
Stage A lessons are free. Stage B lessons need the Premium subscription (monthly, or yearly with a 7-day free trial), sold with In-App Purchase. To test: choose a language, finish the first lesson, then open a Stage B lesson to see the subscription screen and buy with a Sandbox account. "Restore purchases" is on the same screen.
Pronunciation scoring: in a speaking exercise, allow microphone access and record. The recording is sent to our server and Microsoft Azure for scoring and is not stored.
Data deletion: Settings > Delete my data. The Privacy Policy and Terms of Service are linked on the subscription screen and in Settings.
```

**Google Play（Policy → App content）**

- Ads：No, my app does not contain ads。
- App access：All functionality is available without special access（不需要登录；订阅内容审核员可用测试购买）。
- Advertising ID：No（请开发者确认最终安装包的 manifest 里没有 `com.google.android.gms.permission.AD_ID` 权限）。
- Government apps：No；Financial features：None；Health：No；News：No。
- Content rating、Target audience、Data safety、Privacy policy：见上面第 4–6 节。

## 8. 上架前核对

- [ ] 名称定稿，所有文案里的 `LinguaSEA` 已替换，字数重新数过。
- [ ] 文案里的功能和正式版一致：阶段、试用天数、免费 / 付费范围、发音打分的每日次数。
- [ ] App 内付费墙（`content/l1/th/ui.json` 的 `paywall.feature.*`）现在写了"ฝึกพูดกับครู AI""ข้อสอบจำลอง""ดาวน์โหลดไว้เรียนออฟไลน์"等**还没有的功能**；上架前必须由开发者改成真实功能，否则 Apple 会以宣传不存在的功能拒审。
- [ ] 付费墙和设置页里有隐私政策、服务条款链接；付费墙写清价格、周期、试用和自动续订（Apple 3.1.2）。
- [ ] 隐私政策、条款、删除数据页、支持页的网址都能打开，占位符已填完（`node docs/legal/build-html.mjs --check` 显示 0 个）。
- [ ] 泰语文案请泰语母语审校看过（docs/LAUNCH.md 第 13 步）。
- [ ] 以后加了 AI 口语老师、数据分析、崩溃监控或第三方登录：先按 `docs/legal/README.md` 更新隐私政策，再改第 5、6 节的问卷答案。
