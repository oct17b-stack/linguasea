# LinguaSEA（暂定名）

给东南亚人学**中文、英语、日语、韩语**的 App，先做泰国（泰语讲解），按订阅收费，上架 App Store 和 Google Play。

产品方案见 [docs/PLAN.md](docs/PLAN.md)，开发约定见 [CLAUDE.md](CLAUDE.md)。

## 目录

| 位置 | 内容 |
|---|---|
| `app/` | App（Expo / React Native + Expo Router，TypeScript），一套代码出 iOS、安卓和网页 |
| `packages/contract/` | 课程数据格式（zod）、内容校验、把课程打包给 App |
| `packages/core/` | 学习引擎：课程步骤、出题、FSRS 间隔复习、连胜、订阅权限、多设备进度合并（App 和服务器共用） |
| `server/` | 后端（Fastify）：账号、进度同步、订阅状态（RevenueCat webhook） |
| `content/courses/<目标语>/` | 课程内容：zh / en / ja / ko，各国共用 |
| `content/l1/<母语>/` | 母语讲解层：界面文字、译文、语法说明、母语转写（现在有 th） |
| `docs/` | 文档 |

## 常用命令

```
npm install                  # 根目录装全部依赖（npm workspaces）
npm run check                # 全部检查：内容校验 → 打包内容 → 类型检查 → 测试
npm run validate             # 只做内容校验

cd app && npm start          # 启动 App 开发服务器（手机装 Expo Go 扫码，或按 w 开网页版）
cd server && npm run dev     # 启动后端 http://localhost:8080
```

打包上架用 EAS：`cd app && npx eas-cli@latest build --profile production`（需要 Expo 账号、Apple / Google 开发者账号）。
