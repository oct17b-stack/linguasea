# 开发约定（给接手的开发者 / AI）

用户说中文，回复一律用中文。**接手先读 docs/NEXT-STEPS.md（下一步备忘）、docs/HANDOVER.md（交接文档：用户要求、现状、已知问题）和 docs/ROADMAP.md（路线图）。** 产品方案在 docs/PLAN.md，内容规范在 docs/CONTENT.md，上线清单在 docs/LAUNCH.md，用智能体批量写课 / 审校的流水线和提示词在 docs/prompts/。

## 仓库结构

| 位置 | 内容 |
|---|---|
| `app/` | Expo（React Native + Expo Router）App，iOS / 安卓 / 网页一套代码 |
| `packages/contract/` | 内容格式（zod）、校验、打包、翻译表、查重 |
| `packages/core/` | 学习引擎（App 和服务器共用，不能用 node: 模块）：课程路径、出题、练习课、单元测验、读物、FSRS 复习、入门测试、时长估算、进度合并 |
| `server/` | Fastify 后端：账号、同步、订阅（RevenueCat webhook）、发音打分和语音转文字（Azure）、AI 口语老师（Claude）、网站和音频静态文件 |
| `tools/` | 配音生成（Azure TTS）、学习时长统计、按大纲生成课程结构 |
| `content/courses/<目标语>/` | 课程内容（zh / en / ja / ko，各国共用） |
| `content/l1/<母语>/` | 母语讲解层（现在有 th）：界面文字、译文、讲解、注音 |
| `content/_plan/` | 课程大纲（规划写进这里，写课按大纲来） |
| `content/_review/` | 给母语老师的审校备注 |
| `content/audio/` | 生成的配音和清单 |
| `server/public/` | 官网、客服页、`/legal/` 法律页面 |
| `tests/e2e/` | 端到端测试工具（真服务器 + 网页版 + 浏览器） |

## 架构要点

- **两层内容**：目标语内容各国共用，母语层只做讲解和翻译。开一个新国家 = 用 `npm run l10n -- export --to vi` 导出翻译表，翻完 `import`，再在 `meta.json` 的 `released` 里上架。
- **id 永远不改**：课号（`zh-A1-01`，读物 `zh-C1-r01`）和词条 id（`zh.ni-hao`）一旦发布就不能改，复习卡片和进度靠它。同一个词条 id 文字、读音、kind 必须一致；同一个词不能有两个 id（`npm run dupes` 查）。
- **课程路径**：正课和读物来自 course.json；练习课（每 2 课一节）和单元测验（每单元一次）由引擎按学过的内容生成，不需要写内容。
- **学习时长**：`npm run hours` 按 docs/CONTENT.md §6 的口径统计，目标每门课 ≥ 200 小时。
- App 内容由 `npm run content` 生成到 `app/src/content/generated/`（不提交）：一个小索引 + 每门课一个 JSON，选了哪门课才加载哪门。
- 界面文字的 key 以泰语 `content/l1/th/ui.json` 为准，其他母语必须一一对应。
- 引擎和界面里不写死任何语言的逻辑；语言相关的东西放进内容。

## 常用命令

```
npm run check                      # 全部检查：内容校验 → 生成内容 → 类型检查 → 测试
npm run validate -- --target zh    # 只看一门课（--only 'zh-C[1-8]-' 只看几个单元）
npm run content                    # 生成 App 用的内容
npm run hours                      # 每门课、每个阶段的估算学习时长
npm run dupes                      # 同一个词被用了两个 id
npm run plan:apply -- zh-CF        # 把大纲的阶段/单元加进 course.json
npm run audio -- --dry-run         # 还缺多少配音、估算费用（有 Azure 密钥时去掉 --dry-run 就会生成）
npm run l10n -- export --to vi     # 导出翻译表
npm run review:sheet               # 给母语老师的审校表（content/_review/sheets/，说明见 content/_review/README.md）
cd app && npm start                # 开发服务器
cd server && npm run dev           # 后端（不配 DATABASE_URL 时用内存存储）
npm run e2e                        # 端到端测试（网页版 + 真服务器 + 浏览器）
```

改了 App 界面要用网页版实际点一遍：`npm run e2e`（先 `npm run content`）会起真服务器、打包网页版、用 Playwright 把主要流程走一遍（选课、上课、同步、AI 老师、付费墙、分级测试、练习、单元测验、读物、复习、删除数据），逐项打印 PASS/FAIL。打包要几分钟；反复跑时可以先用 `EXPO_PUBLIC_API_URL=http://127.0.0.1:<端口>` 打包一次，再用 `E2E_DIST=<目录> E2E_API_PORT=<端口> npm run e2e`；`E2E_SHOTS=<目录>` 保存截图。工具函数在 `tests/e2e/harness.mjs`。

## 写内容的流程

1. 规划：大纲写进 `content/_plan/<目标语>-<阶段>.json`，`npm run plan:apply` 生成课程结构。
2. 写课：按大纲写 `content/courses/...` 和 `content/l1/th/...`，规范见 docs/CONTENT.md。
3. 审校：另一位审校逐课核对，拿不准的写进 `content/_review/`；母语老师终审用 `npm run review:sheet` 导出的表格（见 `content/_review/README.md`）。
4. 检查：`npm run validate`、`npm run dupes`、`npm run hours`。
5. 配音：`npm run audio`。

## 现在的临时做法（上线前要换）

- 配音：没有 Azure 密钥时用设备自带 TTS；有密钥后跑 `npm run audio` 生成正式配音。
- 发音打分、语音输入、AI 口语老师、订阅：代码都已接好，填上对应的环境变量才会生效（变量名见 docs/LAUNCH.md 和 `server/.env.example`）。
- 服务器不配 `DATABASE_URL` 时用内存存储，只能开发用。
- 课程内容是 AI 写的并经 AI 审校，上线前必须请母语老师终审（`content/_review/`）。
- `app/src/lib/config.ts` 的客服邮箱、法律页面里的 `[TBD]` / `[รอกรอก]` 占位要换成真实信息。

## 安全约定

- 不提交任何密钥、签名文件、`.env`。密钥、账号、付款、商店后台由用户本人操作。
