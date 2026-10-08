# ccstatusline-zh-deepseek

**🎨 Claude Code CLI 高度可定制状态栏格式化工具 — 中文汉化 + DeepSeek / opencode 适配**

_在终端中显示模型信息、Git 分支、Token 用量及其他实时指标_

> **本仓库 = 中文汉化版 [ccstatusline-zh](https://github.com/huangguang1999/ccstatusline-zh) ＋ DeepSeek 模型 / opencode 网关适配。**
> 血缘：`sirmalloc/ccstatusline`（英文原版）→ `huangguang1999/ccstatusline-zh`（中文汉化，本仓库基于其 **v2.2.29**）→ **本仓库**（叠加 8 处适配）。
> 界面中文由汉化版完成（组件名称 / 分类 / 描述 / 菜单 / 提示等，89 类组件），本仓库只做适配层：**用 Claude 官方模型时表现与汉化版完全一致**，适配只在 DeepSeek / opencode 场景下生效。改动逐条列在 [本 Fork 的改动](#-本-fork-的改动)。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/sdadz-luo/ccstatusline-zh-deepseek/blob/main/LICENSE)
[![Node.js Version](https://img.shields.io/node/v/ccstatusline.svg)](https://nodejs.org)

![Demo](https://raw.githubusercontent.com/sdadz-luo/ccstatusline-zh-deepseek/main/screenshots/demo.gif)

## 📚 目录

- [关于本项目](#-关于本项目)
- [本 Fork 的改动](#-本-fork-的改动)
- [DeepSeek 适配](#-deepseek-适配)
- [功能特性](#-功能特性)
- [快速开始](#-快速开始)
- [Windows 支持](#-windows-支持)
- [使用方法](#-使用方法)
- [可用组件](#-可用组件)
- [配置界面（TUI）](#-配置界面tui)
- [API 文档](#-api-文档)
- [开发指南](#️-开发指南)
- [致谢](#-致谢)
- [许可证](#-许可证)

---

## 🌏 关于本项目

本仓库是 [ccstatusline-zh](https://github.com/huangguang1999/ccstatusline-zh)（中文汉化版）的一个 fork，基线为其 **v2.2.29**。

[ccstatusline](https://github.com/sirmalloc/ccstatusline) 是一个优秀的 Claude Code CLI 状态栏格式化工具，支持 80+ 种可定制组件、Powerline 主题、交互式 TUI 配置界面等丰富功能。上游汉化版在其基础上，将所有用户可见的英文文本替换为中文，包括：

- **89 个组件**的名称、描述、分类标签（含 v2.2.13 新增的 Voice Status / 周 Sonnet 用量 / 周 Opus 用量，v2.2.17 新增的超额用量占比 / 超额用量剩余，v2.2.20 新增的 Remote Control Status，v2.2.22 新增的缓存命中率 / 缓存读取 / 缓存写入 / 超额已用，v2.2.24 新增的缓存计时器 / Git CI 状态 / 沙箱状态，v2.2.26 新增的周 Fable 用量，以及本 fork 新增的月用量）
- **TUI 配置界面**的全部菜单项、帮助文本、提示信息、对话框
- **布局组件**（分隔符、弹性分隔符）的名称和描述
- **极简模式 / Minimalist Mode**、**模糊搜索组件选择器**、**Powerline 主题色延续**（v2.2.8）
- **上下文窗口**、**Git 文件状态系列**（已暂存 / 未暂存 / 未跟踪 / 干净）、**短条形百分比模式**、**GitLab 支持**、**Reset Timer 时区/IANA 选择**、**TUI 环绕导航**、**`refreshInterval` 配置**（v2.2.10）
- **Jujutsu VCS 系列**（书签 / 工作区 / 根目录 / 变更 / 增删 / 描述 / 修订）、**CompactionCounter 压缩计数**、**用量时间游标**、**Reset Timer 绝对时间戳**、**Powerline 端帽数量解锁**、**思考力度组件 xhigh 等级**（v2.2.12）
- **Voice Status 语音状态组件**、**周 Sonnet / 周 Opus 用量组件**、**Timer 短进度条**、**Hook 输出静默**（v2.2.13）
- **版本固定全局安装**（Pinned global install）、**管理安装 / 检查更新菜单**、**npm 仓库更新检测**、**固定安装版本不一致防错屏幕**（v2.2.14–v2.2.16）
- **超额用量占比 / 超额用量剩余组件**（按量付费月度超额额度，支持禁用时隐藏）、**用量 API 空值桶兼容**、**Git 命令旧版本兼容与 `--no-optional-locks` 锁规避**（v2.2.17–v2.2.18）
- **Git 子进程输出持久化缓存**（可配置 TTL，按 `.git/HEAD` / `.git/index` mtime 失效）、**`CCSTATUSLINE_WIDTH` 终端宽度覆盖**、**固定全局安装设为默认安装项**、**Windows 隐藏辅助进程窗口**（v2.2.19）
- **Remote Control Status 远程控制状态组件**、**渐变色前景色支持**、**周重置计时器星期显示模式**、**Windows npm shim 执行修复**、**超额用量单位换算修正**、**Input/Output Token 组件优先使用累计转录指标**、**UsageFetch 缓存隔离改进**（v2.2.20）
- **缓存命中率 / 缓存读取 / 缓存写入**（Cache Hit Rate / Cache Read / Cache Write）、**超额已用组件**（Extra Usage Used）、**压缩计数改用 compact_boundary 标记精准检测**（不再依赖上下文百分比推断）、**弹性分隔符 Powerline 路径修复**、**可覆盖字符字形（Glyph override）**、**每组件暗淡样式**（整体暗淡 / 括号暗淡）、**invalid settings.json 非破坏性恢复与警告**（v2.2.21–v2.2.22）
- **缓存计时器 / Git CI 状态 / 沙箱状态组件**、**单侧默认内边距**、**选择性 Powerline 对齐**、**Git 分支与根目录宽度限制**、**当前目录字符**、**可配置上下文窗口兜底值**、**可组合压缩指标**、**`--version` 参数**、**用量缓存与加载态修复**、**异步 Git PR/CI 检查刷新**（v2.2.23–v2.2.25）
- **周 Fable 用量组件**、**迁移账号的 `limits[]` 用量 API 兼容**、**压缩后上下文长度修正**、**隐藏组件分隔符保留**、**配置导入/导出及差异预览**（v2.2.26–v2.2.27）
- **确认对话框** "是 / 否"
- **分类筛选** "全部" 等界面元素

内部标识符（如 settings.json 中的 widget type ID `"model"`、`"git-branch"` 等）保持英文不变，确保与上游版本的配置文件完全兼容。

除中文化外，本仓库针对 **DeepSeek 模型 + opencode 网关**做了 8 处适配，逐条列在下一节；其中与费用/用量相关的 5 处原理写在 [DeepSeek 适配](#-deepseek-适配)。

### 与上游的差异

| 项目       | ccstatusline（英文原版） | ccstatusline-zh（汉化版） | 本仓库          |
| ---------- | ------------------------ | ------------------------- | --------------- |
| 界面语言   | 英文                     | 中文                      | 中文            |
| 配置兼容性 | —                        | ✅ 共用相同 settings.json | ✅ 同左         |
| 功能差异   | —                        | 与英文版一致              | 汉化版功能 + 8 处 DeepSeek / opencode 适配 |
| 同步版本   | 最新                     | v2.2.32                   | 基于 v2.2.29 分叉（汉化版随后发布了 3 个提交，本仓库尚未跟进） |

三条仓库的关系：

```text
sirmalloc/ccstatusline            英文原版
      └─ huangguang1999/ccstatusline-zh      中文汉化（本仓库的 fork 来源，remote 名 upstream）
             └─ sdadz-luo/ccstatusline-zh-deepseek   本仓库（+ DeepSeek / opencode 适配）
```

---

## 🔧 本 Fork 的改动

相对汉化版 **v2.2.29**（共同祖先提交 `a6f075d`），本仓库多出 7 个提交、8 处改动：

| #  | 改动                                                          | 提交      | 生效条件 |
| -- | ------------------------------------------------------------- | --------- | -------- |
| 1  | 会话费用按 DeepSeek 官方峰谷价**分时计价**（价格表可用 `deepseek-pricing.json` 外部覆盖） | `9b36be1` | 模型标识含 `deepseek` + `flash` |
| 2  | 代理把一次调用拆多条记录时，按 `message.id` **去重 token**，修正输入/输出/缓存虚高 | `9b36be1` | 始终生效（无 `message.id` 时行为不变） |
| 3  | **子代理用量汇总**进会话费用（`subagents/` 目录的记录不在主 transcript 里） | `9b36be1` | 始终生效 |
| 4  | 速度统计改用**分块末条时间戳**作区间终点，修正代理环境下速度虚高 | `bce02b3` | 一次调用被拆成多条记录时（单条记录时首=末，无差异） |
| 5  | 用量组件接入 **opencode go 数据源**，并新增「月用量」组件 | `e55d0fb` | `ANTHROPIC_BASE_URL` 含 `opencode.ai` |
| 6  | 用量百分比为整数时**不再补 `.0`** 小数位（避免暗示不存在的 0.1 分辨率） | `e9c0760` | 数据源给出整数时 |
| 7  | 构建脚本去掉 `rm -rf`，**Windows 下可直接 `bun run build`** | `7099b1b` | — |
| 8  | 组件总数 88 → 89（新增「月用量」的注册、清单与测试） | `e55d0fb` | — |

第 1–5 处的原理、口径与已知限制见 [DeepSeek 适配](#-deepseek-适配)。另外两处补充说明：

- **第 6 处**：opencode 的用量接口在服务端就 `Math.floor` 到整数（接口只返回 `status` / `percent` / `resetsAt` 三个字段，金额不进 JSON），再 `toFixed(1)` 只会补一个恒为 0 的小数位。Claude 官方源的 `utilization` 是真实小数，仍保留一位。
- **第 7 处**：原脚本为 `rm -rf dist/* ; bun build ...`，其中的通配符在 Windows 的 cmd/PowerShell 下不展开，构建会失败；去掉后由 `bun build` 直接覆盖产物。

---

## 🐋 DeepSeek 适配

面向使用 DeepSeek 模型（含经第三方代理接入）的用户。以下五处都与费用 / 用量口径相关（完整改动表见 [本 Fork 的改动](#-本-fork-的改动)）。五者都只在对应场景生效，Claude 官方模型下的表现与汉化版一致。

### 峰谷分时计价（会话费用组件）

上游的「会话费用」直接读取 Claude Code 传入的 `cost.total_cost_usd`，该字段在第三方代理下常缺失或不准，因此本 Fork 对 DeepSeek 模型改为按官方价格自行计算。

- **生效条件**：状态栏传入的模型标识同时包含 `deepseek` 与 `flash` 两个关键词（如 `deepseek-flash[1m]`、`deepseek-v4-flash`）。用双关键词而非精确匹配，是为了模型改名后仍能生效。
- **分时计价**：按 transcript 中每条 usage 记录的时间戳，把 token 分别归入波峰 / 波谷桶，再各按对应价格计算，避免跨时段刷新时费用整体跳变。
- **波峰时段**：北京时间（UTC+8）周一至周五 9:00–12:00、14:00–18:00，其余为波谷。判定按固定偏移换算、不读本机时区，机器不在东八区也与官方口径一致。
- **时段提示**：波峰时段该组件的默认颜色为红色，波谷为绿色。

内置价格表（美元 / 百万 token；官方以人民币计价，此处按 6.67 汇率折算）：

| 时段 | 输入（未命中缓存） | 输出 | 输入（命中缓存） |
| ---- | ------------------ | ---- | ---------------- |
| 波谷 | 0.15               | 0.60 | 0.003            |
| 波峰 | 0.30               | 1.20 | 0.006            |

缓存写入（`cache_creation`）官方无独立价格，按输入价计费。

官方调价频繁，可在 `~/.config/ccstatusline/deepseek-pricing.json`（Windows 下为 `%USERPROFILE%\.config\ccstatusline\deepseek-pricing.json`，与 settings.json 同目录）写一份覆盖表，无需改源码重新构建。只需写要改的字段，其余沿用默认值：

```json
{
  "peak": { "input": 0.3, "output": 1.2, "cacheRead": 0.006 },
  "offPeak": { "input": 0.15, "output": 0.6, "cacheRead": 0.003 }
}
```

文件缺失或格式不合规时静默回退到内置默认值。

> 已知限制：法定节假日未做识别，仅按周末跳过，节假日落在工作日时会按波峰价计算；默认颜色同样在波峰时段全局生效，不限于 DeepSeek 模型。

### 代理 token 去重

部分第三方代理会把同一次 API 调用拆成 thinking / text / tool_use 等多条分块记录写入 transcript，且每条都携带完整的 usage。上游逐条累加，会让输入、输出、缓存 token 虚高数倍。本 Fork 改为按 `message.id` 去重后再累加；速度类组件（输入 / 输出 / 总速度）也按 `message.id` 把一次调用只计作一个请求。

### 速度统计的分母修正

速度组件的分母是「上一条 user / tool_result 记录 → 该次调用某条分块记录」的区间并按并集合并。上游取该消息**首块**的时间戳，但代理的分块记录是在各内容块（thinking / text / tool_use）完成时逐条落盘的，首块远早于响应结束，末块之后才是真正的生成终点——末尾常是大段 tool_use 的 JSON。沿用首块时间戳会把这段生成时间漏出分母，使速度虚高。

本 Fork 改为取该消息**末块**时间戳作区间终点。同一 transcript 实测：会话平均输出速度由 172.0 t/s 修正为 145.2 t/s（约 −16%），单回合最大偏差 2.5 倍（大段 tool_use 的回合）。

> 口径说明：分母含请求在途、代理排队与首 token 延迟，所以该数值是**端到端吞吐**，略低于模型本身的生成速率。

### 子代理用量汇总

Task 工具派生的子代理，其记录位于 `subagents/` 目录下，不在主 transcript 里，上游的会话费用因此会低估。本 Fork 额外汇总本次会话所有子代理的 token 用量并计入费用。

### opencode 用量数据源（套餐额度组件）

上游的「会话用量 / 周用量 / 重置计时」等组件只认 Claude 的 OAuth 订阅凭据（`~/.claude/.credentials.json` 的 `claudeAiOauth`），再打 `api.anthropic.com/api/oauth/usage`。用第三方中转 key 接入时该凭据不存在，这几个组件会一直显示 `[无凭证]`。

本 Fork 增加了一条数据源：当 `ANTHROPIC_BASE_URL` 指向 `opencode.ai` 时，改打 opencode 自己的用量接口。

- **接口**：`GET https://opencode.ai/zen/go/v1/usage`，`Authorization: Bearer <key>`，返回 `usage.{rolling,weekly,monthly}`，每项含 `status`、`percent`、`resetsAt`。
- **窗口映射**：`rolling` → 会话用量（5 小时）、`weekly` → 周用量、`monthly` → 月用量（本 Fork 新增的组件）。重置计时组件随之改用接口给出的重置时刻，不再依赖本地 transcript 推算。
- **`percent` 是「已用」百分比**：opencode 的额度按模型折算成美元、分三个滚动窗口（5 小时 = 月额度 20%、周 = 50%、月 = 100%，见 [opencode go 文档](https://opencode.ai/docs/go/)）。按 opencode 内的记账价目换算本地 transcript 消耗后，滚动与周两个窗口各自反解出的月额度互相吻合（$128.7 与 $125.2）；若按「剩余」解释则解得 $6.77 与 $3.87，自相矛盾。
- **凭据解析顺序**：`OPENCODE_API_KEY` → `ANTHROPIC_API_KEY`（环境变量，再退 settings.json 的 env 段）→ `~/.local/share/opencode/auth.json` 的 `opencode` 条目。**不取该文件的 `opencode-go` 条目**：实测它对 `/usage` 返回 403，只有同账号的 Zen key 能读。
- **按源隔离缓存**：缓存文件额外记录数据源，切换 Claude / opencode 时立即失效，不会串用另一侧的数值。

> 已知限制：`percent` 是整数粒度，月额度 1% 约合 $1.26，轻量使用时会长时间停在同一个数字。
>
> 与 opencode 控制台（工作区的 Go 页面）对比时，本组件可能低 1 个百分点——**这是 opencode 自身两个入口的取整口径不同，不是取数错误**：接口侧在 `packages/console/core/src/subscription.ts` 的 `analyzeRollingUsage` / `analyzeWeeklyUsage` / `analyzeMonthlyUsage` 里统一用 `Math.floor(usage / limit * 100)` 向下取整，且 `packages/console/app/src/routes/zen/go/v1/usage.ts` 的 `formatUsage()` 只输出 `status`、`percent`、`resetsAt` 三个字段，**金额不进 JSON**；控制台页面则走登录态的 `"use server"` 查询（`packages/console/app/src/routes/workspace/[id]/go/lite-section.tsx`）直读数据库里的微美分金额，在 `lib/lite-usage.ts` 里用 `Math.round(usage / limit * 1000) / 10`（0.1 精度四舍五入）算。真值落在 6.95%~7.00% 时，控制台显示 7% 而接口只能给 6%。小数位在服务端 `Math.floor` 那一刻就已丢失，本 Fork 无法恢复。
>
> 基于此，用量百分比组件对整数**不再补 `.0`**——显示 `7%` 而非 `7.0%`，以免暗示并不存在的 0.1 分辨率；换回 Claude 官方源时 `utilization` 是货真价实的小数，仍保留一位。

---

## ✨ 功能特性

- **89 种可定制组件** — 模型、Git（含 PR / CI / 冲突 / 暂存 / Origin / Upstream / 工作树等细分组件）、Token、上下文、会话、费用、速度等
- **交互式 TUI 配置** — 运行构建产物的 `setup` 子命令启动可视化配置界面
- **Powerline 风格** — 内置多款 Powerline 主题，支持自定义分隔符，支持主题色跨行延续
- **极简模式** — 一键让所有组件切换到"无标签"模式，状态栏更精简
- **模糊搜索组件** — 添加组件时支持子串 / 首字母 / 模糊匹配，带实时高亮
- **Claude 账户邮箱** — 状态栏显示当前登录的 Claude 账户邮箱
- **多行布局** — 支持多行状态栏配置
- **实时预览** — 配置时即时预览效果
- **自定义颜色** — 每个组件支持独立的前景色和背景色设置
- **自定义命令 & 文本 & 符号** — 可嵌入自定义 Shell 命令输出、静态文本或单字符符号/Emoji
- **可点击链接** — 支持 OSC8 终端超链接（Git 分支、Git PR、仓库根目录等可配置）
- **DeepSeek / opencode 适配** — 会话费用按官方峰谷价分时计价（价格表可外部覆盖）、代理 token 去重、速度分母修正、子代理用量汇总、opencode 套餐用量数据源（含月用量组件），详见 [本 Fork 的改动](#-本-fork-的改动)
- **跨平台** — 支持 macOS、Linux、Windows

---

## 🚀 快速开始

### 先分清两个包

| 来源                                           | 是什么                      | 含本仓库的适配 |
| ---------------------------------------------- | --------------------------- | -------------- |
| npm 上的 `ccstatusline-zh`                     | 上游汉化版（当前 2.2.32）   | ❌ 不含        |
| 本仓库源码构建出的 `dist/ccstatusline.js`      | 汉化版 + DeepSeek / opencode 适配 | ✅             |

本仓库**未改包名、也未发布到 npm**，`npm install -g ccstatusline-zh` 装到的是上游汉化版（不含任何 DeepSeek / opencode 适配）。要用本仓库的适配，只能从本仓库构建。

### 从本仓库构建安装

```bash
git clone https://github.com/sdadz-luo/ccstatusline-zh-deepseek.git
cd ccstatusline-zh-deepseek

bun install      # 需要 Bun：ink@6.2.0 的补丁走 Bun 的 patchedDependencies，npm / pnpm 不会打上
bun run build    # 产出 dist/ccstatusline.js（约 3.3 MB，Node 14+ 可运行）
```

把产物放到一个固定目录即可，不必装成全局命令：

```bash
# macOS / Linux
mkdir -p ~/.claude/tools/ccstatusline-zh-deepseek
cp -r dist package.json README.md LICENSE ~/.claude/tools/ccstatusline-zh-deepseek/
```

```powershell
# Windows（PowerShell）
$dst = "$env:USERPROFILE\.claude\tools\ccstatusline-zh-deepseek"
New-Item -ItemType Directory -Force $dst | Out-Null
Copy-Item dist, package.json, README.md, LICENSE -Recurse -Destination $dst
```

### 配置 Claude Code

编辑 `~/.claude/settings.json`（Windows：`%USERPROFILE%\.claude\settings.json`），把 `statusLine.command` 指向构建产物的绝对路径：

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"/home/you/.claude/tools/ccstatusline-zh-deepseek/dist/ccstatusline.js\"",
    "padding": 0,
    "refreshInterval": 10
  }
}
```

Windows 下路径写成 `node "C:\\Users\\you\\.claude\\tools\\ccstatusline-zh-deepseek\\dist\\ccstatusline.js"`（或用正斜杠 `C:/Users/you/...`）。

> ⚠️ **TUI 的「安装到 Claude Code」对本仓库不适用**：它写入的 `npx -y ccstatusline-zh@latest` / `bunx -y ccstatusline-zh@latest` / `ccstatusline-zh` 三者拉的都是 npm 上的上游汉化版。自管理部署请照上面手写 `command`，不要用 TUI 的安装 / 管理安装 / 检查更新菜单。

> `refreshInterval` 仅在 Claude Code ≥ 2.1.97 时生效，范围为 `1-60` 秒，留空则不写入该字段。

### 启动配置界面

```bash
node "/home/you/.claude/tools/ccstatusline-zh-deepseek/dist/ccstatusline.js" setup
```

在源码目录里也可以直接 `bun run start setup`。界面内可以：

- 添加、删除、重新排列组件
- 设置颜色和样式
- 选择 Powerline 主题
- 实时预览状态栏效果

### 换到另一台电脑：仓库之外还要准备什么

本仓库只有代码。**状态栏显示成什么样，取决于仓库之外的四份本机配置**，换机时要一并搬，否则「装好了但和原来不一样」：

| 位置                                                                     | 作用                          | 不搬会怎样 |
| ------------------------------------------------------------------------ | ----------------------------- | ---------- |
| `~/.config/ccstatusline/settings.json`（Windows `%USERPROFILE%\.config\ccstatusline\settings.json`） | 状态栏布局：组件清单、颜色、分隔符、flex 模式 | 首次运行会写入一份默认布局，内容与原来不同（TUI 里可以「导出 / 导入配置」搬运） |
| 同目录的 `deepseek-pricing.json`（可选）                                  | DeepSeek 价格覆盖表           | 用内置默认价，一般够用 |
| `~/.claude/settings.json` 的 `env` 段                                     | `ANTHROPIC_BASE_URL`、`ANTHROPIC_API_KEY`、`ANTHROPIC_DEFAULT_*_MODEL` 等 | 用量组件取不到数；模型标识不再含 `deepseek` / `flash` 时适配不生效 |
| `~/.local/share/opencode/auth.json` 或 `OPENCODE_API_KEY`                 | opencode 用量接口的凭据（走 opencode 网关时需要） | 用量类组件显示「无凭证」 |

三条容易误判成 bug 的边界：

- **峰谷计价**只在模型标识同时含 `deepseek` 与 `flash` 时生效（如 `deepseek-flash[1m]`）；换成别的模型名，会话费用会回落到上游口径（读 Claude Code 传入的 `cost.total_cost_usd`）。
- **opencode 用量源**只在 `ANTHROPIC_BASE_URL` 含 `opencode.ai` 时启用；没配这个变量时，用量组件会去打 Claude 的 OAuth 用量接口，通常显示「无凭证」。
- **Windows 下不按宽度排版**：终端宽度探测返回空（上游行为），不截断、弹性分隔符也不展开，详见 [Windows 支持](#-windows-支持)。

---

## 🪟 Windows 支持

完整支持 Windows。安装走[从本仓库构建](#从本仓库构建安装)，Claude Code 的配置路径为 `%USERPROFILE%\.claude\settings.json`。

Windows 上要注意两点（都用本机实测过）：

- **构建**：`bun run build` 可直接跑（第 7 处改动去掉了原脚本里的 `rm -rf`，通配符在 cmd / PowerShell 下不展开会导致构建失败）。
- **宽度**：终端宽度探测返回空（上游行为），状态栏不按宽度截断、弹性分隔符不展开。实测同一份配置：不设变量时输出 `模型: Opus 4.6 | 费用: $0.01`，加 `CCSTATUSLINE_WIDTH=120` 后中间被填充到 80 列。需要宽度排版就在 `command` 前加 `CCSTATUSLINE_WIDTH=<列数>`。

---

## 📖 使用方法

### 基本用法

配置好 `statusLine` 后，Claude Code 每次刷新状态都会运行该命令，并把状态数据通过 stdin 以 JSON 格式传入。

### 手动测试

```bash
cat scripts/payload.example.json | node "/home/you/.claude/tools/ccstatusline-zh-deepseek/dist/ccstatusline.js"
```

### 自定义配置文件路径

```bash
node "/home/you/.claude/tools/ccstatusline-zh-deepseek/dist/ccstatusline.js" --config /path/to/custom-settings.json
```

### 命令行参数

| 参数              | 说明                    |
| ----------------- | ----------------------- |
| `setup`           | 启动交互式 TUI 配置界面 |
| `--config <path>` | 指定自定义配置文件路径  |
| `--version`       | 显示版本号              |

---

## 🧩 可用组件

### 核心

| 组件     | 说明                                                  |
| -------- | ----------------------------------------------------- |
| 模型     | 显示当前 Claude 模型名称                              |
| 风格     | 显示当前输出风格                                      |
| 版本     | 显示 ccstatusline-zh 版本号                           |
| 思考力度 | 显示当前思考力度等级                                  |
| Vim 模式 | 显示当前 Vim 模式                                     |
| 语音状态 | 显示 Claude Code 语音输入是否启用（4 种格式 + Nerd 字体） |
| 沙箱状态 | 显示 Claude Code Bash 沙箱模式是否启用                |

### Git

| 组件                    | 说明                                           |
| ----------------------- | ---------------------------------------------- |
| Git 分支                | 显示当前 Git 分支名，支持 GitHub 链接          |
| Git PR                  | 显示当前分支的 PR 信息（链接、状态、标题）     |
| Git CI 状态             | 显示当前分支 PR 的 GitHub CI 检查状态          |
| Git 变更                | 显示未提交的文件变更统计                       |
| Git 新增                | 显示未提交的新增行数                           |
| Git 删除                | 显示未提交的删除行数                           |
| Git 状态                | 汇总状态指示：+暂存 / *未暂存 / ?未跟踪 / !冲突 |
| Git 已暂存              | 存在已暂存变更时显示 +                         |
| Git 未暂存              | 存在未暂存变更时显示 *                         |
| Git 未跟踪              | 存在未跟踪文件时显示 ?                         |
| Git 冲突                | 显示合并冲突数量                               |
| Git 超前/滞后           | 显示相对 upstream 的提交领先/落后数            |
| Git SHA                 | 显示简短提交哈希                               |
| Git Origin 所有者/仓库  | 显示 origin 远程的 owner / repo                |
| Git Upstream 所有者/仓库 | 显示 upstream 远程的 owner / repo             |
| Git 是否 Fork           | 当仓库是 upstream 的 fork 时显示标识           |
| Git 根目录              | 显示 Git 仓库根目录名                          |
| Git 工作树              | 显示 Git 工作树信息                            |
| Git 工作树模式/名称/分支 | 工作树模式指示与详细信息                      |

### Token

| 组件       | 说明                |
| ---------- | ------------------- |
| 输入 Token | 显示输入 Token 数量 |
| 输出 Token | 显示输出 Token 数量 |
| 缓存 Token | 显示缓存 Token 数量 |
| 总 Token   | 显示 Token 合计     |

### Token 速度

| 组件     | 说明                        |
| -------- | --------------------------- |
| 输入速度 | 显示输入 Token 速度 (tok/s) |
| 输出速度 | 显示输出 Token 速度 (tok/s) |
| 总速度   | 显示总 Token 速度 (tok/s)   |

### 上下文

| 组件             | 说明                       |
| ---------------- | -------------------------- |
| 上下文长度       | 显示当前上下文 Token 数    |
| 上下文 %         | 显示上下文使用百分比       |
| 上下文 %（可用） | 显示可用上下文百分比       |
| 上下文进度条     | 以进度条形式显示上下文用量 |

### 会话

| 组件           | 说明                          |
| -------------- | ----------------------------- |
| 会话时钟       | 显示当前会话持续时间          |
| 会话费用       | 显示当前会话预估费用（DeepSeek 模型按峰谷分时计价） |
| 会话名称       | 显示 Claude Code 会话名称     |
| 会话用量       | 显示会话 API 用量             |
| 周用量         | 显示本周 API 用量             |
| 月用量         | 显示本月 API 用量（opencode 数据源） |
| 周 Sonnet 用量 | 显示本周 Sonnet 模型 API 用量 |
| 周 Opus 用量   | 显示本周 Opus 模型 API 用量   |
| 周 Fable 用量  | 显示本周 Fable 模型 API 用量  |
| 超额用量占比   | 显示超额用量（按量付费）占比       |
| 超额用量剩余   | 显示每月超额用量额度的剩余金额（美元） |
| 时段计时器     | 显示当前 5 小时时段已用时间   |
| 时段重置计时   | 显示时段重置窗口剩余时间      |
| 周重置计时     | 显示周重置剩余时间            |
| Claude 会话 ID | 显示当前 Claude 会话 ID       |
| Claude 账户邮箱 | 显示当前登录的 Claude 账户邮箱 |
| 技能           | 显示 Claude Code 技能调用信息 |
| 缓存计时器     | 显示提示词缓存 TTL 的剩余时间  |

### 环境

| 组件     | 说明                 |
| -------- | -------------------- |
| 当前目录 | 显示当前工作目录     |
| 终端宽度 | 显示终端列数         |
| 内存用量 | 显示系统内存使用情况 |

### 自定义

| 组件       | 说明                      |
| ---------- | ------------------------- |
| 自定义文本 | 显示用户自定义文本        |
| 自定义命令 | 执行 Shell 命令并显示输出 |
| 自定义符号 | 显示自定义单字符符号或 Emoji |
| 链接       | 显示可点击的终端超链接    |

### 布局

| 组件       | 说明                         |
| ---------- | ---------------------------- |
| 分隔符     | 组件之间的固定分隔符         |
| 弹性分隔符 | 自动填充剩余空间的弹性分隔符 |

---

## 🖥️ 配置界面（TUI）

运行 `node "<产物路径>/dist/ccstatusline.js" setup` 打开交互式配置界面（源码目录里用 `bun run start setup`）。

### 主菜单功能

- **编辑状态栏** — 添加、删除、移动、配置组件
- **Powerline 设置** — 选择主题和自定义分隔符
- **全局样式覆盖** — 设置全局颜色、样式及默认内边距方向
- **终端选项** — 配置终端宽度和颜色级别
- **配置状态行** — 配置 Claude Code 状态行刷新间隔（Claude Code ≥ 2.1.97）
- **导出配置** — 将当前配置保存为 JSON 文件，用于备份或分享（换机搬布局用这个）
- **导入配置** — 从 JSON 文件加载配置并预览替换或合并后的差异
- **安装到 Claude Code** — 选择自动更新 / 固定全局安装两种方式（⚠️ 本仓库不适用，见[上文说明](#配置-claude-code)）
- **管理安装** — 已固定安装时可检查 npm 更新、运行全局更新命令、卸载（⚠️ 同上，指向的是 npm 上的汉化版）
- **检查更新** — 查询 npm 仓库最新版本并对比当前版本（⚠️ 同上）

### 快捷键

| 按键    | 功能      |
| ------- | --------- |
| `↑` `↓` | 导航      |
| `Enter` | 选择/确认 |
| `a`     | 添加组件  |
| `d`     | 删除组件  |
| `e`     | 编辑组件  |
| `w`     | 组件选项  |
| `/`     | 搜索      |
| `q`     | 退出      |

---

## 📡 API 文档

详细的 API 文档和 JSON Payload 格式说明请参考上游项目：

👉 [ccstatusline API Documentation](https://github.com/sirmalloc/ccstatusline#-api-documentation)

---

## 🛠️ 开发指南

### 环境要求

- [Bun](https://bun.sh/) >= 1.0 —— 安装依赖、构建、测试都走 Bun；`patchedDependencies` 里的 ink@6.2.0 补丁也只有 Bun 会应用
- Node.js >= 14.0.0 —— 运行构建产物

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/sdadz-luo/ccstatusline-zh-deepseek.git
cd ccstatusline-zh-deepseek

# 安装依赖
bun install

# 运行示例
bun run example

# 启动 TUI
bun run start setup

# 构建（产出 dist/ccstatusline.js，并替换版本占位符）
bun run build

# 类型检查 + ESLint（--max-warnings=0）
bun run lint

# 测试
bun test
```

### 换机可复现性（实测）

在一台机器上全新 `git clone` 后逐条验证过（Windows 11 + Bun 1.3.14 + Node 26.3.0）：

| 步骤                     | 结果                                                                              |
| ------------------------ | --------------------------------------------------------------------------------- |
| `bun install`            | ✅ 572 个包，约 1 分钟（含 ink 补丁）                                             |
| `bun run build`          | ✅ 产出 `dist/ccstatusline.js`（3.31 MB），版本占位符被替换为 package.json 的版本 |
| `node dist/ccstatusline.js`（管道喂 `scripts/payload.example.json`） | ✅ 正常渲染中文状态栏，无配置时写入一份默认 settings.json |
| `bun run lint`           | ✅ 通过                                                                           |
| `bun test`               | ⚠️ 1939 项中 1937 通过、2 项失败                                                  |

关于那 2 项失败：都在**基线提交上同样失败**，且都是 Windows 环境所致，与本仓库的改动无关——一项是符号链接用例（Windows 建符号链接需开发者模式 / 管理员权限），另一项是全量跑时 `execFileSync` 的 stdio 断言被同进程其他用例的调用干扰（单跑该文件即通过）。CI 只在 `ubuntu-latest` 上运行，不受影响。

> 构建产物与构建机器的路径无关：同一份源码在两台不同目录下构建，产物只在内嵌的 `__dirname` 字符串上不同；该字符串仅用于开发模式（版本占位符未被替换时）的兜底，发布产物用不到。

### 本 fork 新增 / 改动的文件

| 文件                              | 说明                                                         |
| --------------------------------- | ------------------------------------------------------------ |
| `src/utils/deepseek-pricing.ts`   | 峰谷价格表、`deepseek-pricing.json` 覆盖读取、波峰时段判定   |
| `src/utils/opencode-usage.ts`     | opencode go 用量接口：凭据解析顺序、响应解析、窗口映射       |
| `src/utils/jsonl-metrics.ts`      | 按 `message.id` 去重、速度区间取分块末条时间戳、子代理汇总、峰谷分桶 |
| `src/utils/usage-fetch.ts`        | 用量数据源分派（Claude / opencode）与按源隔离的缓存          |
| `src/widgets/MonthlyUsage.ts`     | 新增「月用量」组件                                           |
| `src/widgets/shared/usage-display.ts` | `formatUsagePercent()`：整数百分比不补 `.0`              |
| `src/widgets/SessionCost.ts`      | 会话费用：DeepSeek 模型按峰谷价分时计价                      |

### 项目结构

```text
src/
├── ccstatusline.ts          # 入口文件
├── widgets/                 # 组件目录（89 个组件）
│   ├── Model.ts
│   ├── GitBranch.ts
│   ├── TokensInput.ts
│   ├── shared/              # 共享工具函数
│   └── ...
├── tui/                     # TUI 配置界面
│   ├── App.tsx
│   └── components/          # 界面组件
├── utils/                   # 工具函数
└── types/                   # 类型定义
```

---

## 🙏 致谢

- [ccstatusline](https://github.com/sirmalloc/ccstatusline) — 原始项目，由 [sirmalloc](https://github.com/sirmalloc) 开发维护
- [ccstatusline-zh](https://github.com/huangguang1999/ccstatusline-zh) — 中文汉化版，本仓库直接基于它，界面中文与绝大多数功能均出自该项目
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — Anthropic 的 CLI 编码助手
- [Ink](https://github.com/vadimdemedes/ink) — React 终端渲染框架

---

## 📄 许可证

本项目遵循 [MIT 许可证](LICENSE)，与上游项目保持一致。

---

<div align="center">

**如果这个汉化版对你有帮助，欢迎 ⭐ Star 原项目！**

[英文原版](https://github.com/sirmalloc/ccstatusline) · [汉化版](https://github.com/huangguang1999/ccstatusline-zh) · [本仓库问题反馈](https://github.com/sdadz-luo/ccstatusline-zh-deepseek/issues)

</div>
