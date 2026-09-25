# ccstatusline-zh

**🎨 Claude Code CLI 高度可定制状态栏格式化工具 — 中文汉化版**

_在终端中显示模型信息、Git 分支、Token 用量及其他实时指标_

> 本项目是 [ccstatusline](https://github.com/sirmalloc/ccstatusline) 的**中文汉化 Fork**，当前同步至上游 v2.2.27 版本（含周 Fable 用量、迁移账号用量 API 兼容、压缩后上下文修正、隐藏组件分隔符修复及配置导入/导出等最新功能）。所有用户可见的界面文本（组件名称、分类、描述、菜单标签、提示信息等）均已翻译为中文，方便中文用户使用。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/huangguang1999/ccstatusline-zh/blob/main/LICENSE)
[![Node.js Version](https://img.shields.io/node/v/ccstatusline.svg)](https://nodejs.org)

![Demo](https://raw.githubusercontent.com/huangguang1999/ccstatusline-zh/main/screenshots/demo.gif)

## 📚 目录

- [关于本项目](#-关于本项目)
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

**ccstatusline-zh** 是 [ccstatusline](https://github.com/sirmalloc/ccstatusline) 的中文汉化版本。

ccstatusline 是一个优秀的 Claude Code CLI 状态栏格式化工具，支持 80+ 种可定制组件、Powerline 主题、交互式 TUI 配置界面等丰富功能。本项目在其基础上，将所有用户可见的英文文本直接替换为中文，包括：

- **88 个组件**的名称、描述、分类标签（含 v2.2.13 新增的 Voice Status / 周 Sonnet 用量 / 周 Opus 用量，v2.2.17 新增的超额用量占比 / 超额用量剩余，v2.2.20 新增的 Remote Control Status，v2.2.22 新增的缓存命中率 / 缓存读取 / 缓存写入 / 超额已用，v2.2.24 新增的缓存计时器 / Git CI 状态 / 沙箱状态，v2.2.26 新增的周 Fable 用量）
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

除中文化外，本 Fork 还针对 **DeepSeek** 模型做了适配：会话费用组件按 DeepSeek 官方峰谷价分时计价，并修复了第三方代理环境下 token 虚高的问题、补齐子代理用量。详见 [DeepSeek 适配](#-deepseek-适配)。

### 与上游的差异

| 项目       | ccstatusline | ccstatusline-zh           |
| ---------- | ------------ | ------------------------- |
| 界面语言   | 英文         | 中文                      |
| 配置兼容性 | —            | ✅ 共用相同 settings.json |
| 功能差异   | —            | 上游功能完全一致，另加 DeepSeek 适配 |
| 同步版本   | 最新         | v2.2.27（+ 周 Fable 用量 / 用量 API 兼容 / 压缩后上下文修正 / 配置导入导出 / 中文化覆盖） |

---

## 🐋 DeepSeek 适配

面向使用 DeepSeek 模型（含经第三方代理接入）的用户，本 Fork 在上游基础上做了五处适配。五者都只在对应场景生效，Claude 模型下的表现与上游一致。

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

---

## ✨ 功能特性

- **88 种可定制组件** — 模型、Git（含 PR / CI / 冲突 / 暂存 / Origin / Upstream / 工作树等细分组件）、Token、上下文、会话、费用、速度等
- **交互式 TUI 配置** — 按 `ccstatusline-zh setup` 启动可视化配置界面
- **Powerline 风格** — 内置多款 Powerline 主题，支持自定义分隔符，支持主题色跨行延续
- **极简模式** — 一键让所有组件切换到"无标签"模式，状态栏更精简
- **模糊搜索组件** — 添加组件时支持子串 / 首字母 / 模糊匹配，带实时高亮
- **Claude 账户邮箱** — 状态栏显示当前登录的 Claude 账户邮箱
- **多行布局** — 支持多行状态栏配置
- **实时预览** — 配置时即时预览效果
- **自定义颜色** — 每个组件支持独立的前景色和背景色设置
- **自定义命令 & 文本 & 符号** — 可嵌入自定义 Shell 命令输出、静态文本或单字符符号/Emoji
- **可点击链接** — 支持 OSC8 终端超链接（Git 分支、Git PR、仓库根目录等可配置）
- **DeepSeek 适配** — 会话费用按官方峰谷价分时计价（价格表可外部覆盖）、代理 token 去重、速度分母修正、子代理用量汇总、opencode 套餐用量数据源
- **跨平台** — 支持 macOS、Linux、Windows

---

## 🚀 快速开始

### 安装

通过 npm 全局安装：

```bash
npm install -g ccstatusline-zh
```

或者使用 Bun：

```bash
bun install -g ccstatusline-zh
```

> 💡 提示：v2.2.14 起 ccstatusline 增加了「固定版本全局安装」选项，TUI 中选择 **固定全局安装** 即可锁定当前版本，避免 `@latest` 跟随上游。详见 TUI 安装流程。

### 配置 Claude Code

在 Claude Code 设置中添加状态栏配置。编辑 `~/.claude/settings.json`：

```json
{
  "statusLine": {
    "type": "command",
    "command": "ccstatusline-zh",
    "padding": 0,
    "refreshInterval": 10
  }
}
```

如果使用 `npx` 或 `bunx` 运行，可以使用以下命令：

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y ccstatusline-zh@latest",
    "padding": 0
  }
}
```

> `refreshInterval` 仅在 Claude Code ≥ 2.1.97 时生效，TUI 中可设置为 `1-60` 秒，留空则不写入该字段。
>
> 其他支持的 `command` 取值：
> - `bunx -y ccstatusline-zh@latest`
> - `ccstatusline-zh`（用于自管理 / 全局安装）
>
> 如需固定版本，可在 TUI 安装时选择「固定全局安装」，TUI 会全局安装当前版本并将 `command` 写为 `ccstatusline-zh`。

### 启动配置界面

```bash
ccstatusline-zh setup
```

这将打开交互式 TUI 配置界面，你可以：

- 添加、删除、重新排列组件
- 设置颜色和样式
- 选择 Powerline 主题
- 实时预览状态栏效果

---

## 🪟 Windows 支持

ccstatusline-zh 完整支持 Windows 系统。安装方式相同：

```bash
npm install -g ccstatusline-zh
```

Windows 下 Claude Code 的配置路径为 `%USERPROFILE%\.claude\settings.json`。

---

## 📖 使用方法

### 基本用法

安装并配置 statusLine 后，ccstatusline-zh 会在每次 Claude Code 更新状态时自动运行。状态数据通过 stdin 以 JSON 格式传入。

### 手动测试

```bash
cat scripts/payload.example.json | ccstatusline-zh
```

### 自定义配置文件路径

```bash
ccstatusline-zh --config /path/to/custom-settings.json
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

运行 `ccstatusline-zh setup` 打开交互式配置界面。

### 主菜单功能

- **编辑状态栏** — 添加、删除、移动、配置组件
- **Powerline 设置** — 选择主题和自定义分隔符
- **全局样式覆盖** — 设置全局颜色、样式及默认内边距方向
- **终端选项** — 配置终端宽度和颜色级别
- **配置状态行** — 配置 Claude Code 状态行刷新间隔（Claude Code ≥ 2.1.97）
- **导出配置** — 将当前配置保存为 JSON 文件，用于备份或分享
- **导入配置** — 从 JSON 文件加载配置并预览替换或合并后的差异
- **安装到 Claude Code** — 选择自动更新 / 固定全局安装两种方式
- **管理安装** — 已固定安装时可检查 npm 更新、运行全局更新命令、卸载
- **检查更新** — 查询 npm 仓库最新版本并对比当前版本

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

- [Bun](https://bun.sh/) >= 1.0
- Node.js >= 14.0.0

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/huangguang1999/ccstatusline-zh.git
cd ccstatusline-zh

# 安装依赖
bun install

# 运行示例
bun run example

# 启动 TUI
bun run start setup

# 构建
bun run build

# 代码检查
bun run lint
```

### 项目结构

```
src/
├── ccstatusline.ts          # 入口文件
├── widgets/                 # 组件目录（88 个组件）
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
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) — Anthropic 的 CLI 编码助手
- [Ink](https://github.com/vadimdemedes/ink) — React 终端渲染框架

---

## 📄 许可证

本项目遵循 [MIT 许可证](LICENSE)，与上游项目保持一致。

---

<div align="center">

**如果这个汉化版对你有帮助，欢迎 ⭐ Star！**

[上游项目](https://github.com/sirmalloc/ccstatusline) · [问题反馈](https://github.com/huangguang1999/ccstatusline-zh/issues)

</div>
