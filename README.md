# ZluxYao Quartz

基于 [Quartz v5](https://github.com/jackyzha0/quartz) 维护的个人优化版本，用于将 Obsidian Markdown 笔记发布为数字花园。

- 站点：[note.zlux.top](https://note.zlux.top)
- 维护者：[ZluxYao](https://github.com/ZluxYao)
- 开发分支：`site`
- 官方同步分支：`official`

## 主要优化

- 中文界面与适合中文阅读的排版。
- 标题使用 `Schibsted Grotesk`，正文使用 `LXGW WenKai TC`，代码使用 `JetBrains Mono`。
- 内置多套主题预设，首次访问默认使用 `Stripe`。
- 代码高亮使用 GitHub Light / GitHub Dark 风格。
- 调整桌面端内容区、左侧探索栏、工具栏和关系图谱尺寸。
- 支持搜索、双向链接、局部关系图谱、目录、阅读模式、暗色模式和 Obsidian Canvas。
- 提供 Enhancing Mindmap 兼容插件，将带有 `mindmap-plugin: basic` 的标题树转换为 Mermaid 思维导图。
- 内容目录与站点代码分离，个人笔记不会打包进 Docker 镜像。
- Docker 站点端口默认使用 `2222`，热更新 WebSocket 的宿主机端口使用 `2223`。

## 本地预览

环境要求：Node.js 22 或更高版本、npm 10.9.2 或更高版本。

```powershell
npm install
npx quartz build --serve -d "D:\path\to\your\vault"
```

默认预览地址：<http://localhost:8080>

因为 `/content/` 已被 Git 忽略以保护笔记隐私，本地预览时应通过 `-d` 直接指定独立的 Obsidian 笔记目录。Quartz v5 会遵守 `.gitignore`，因此使用默认 `content` 路径可能显示 `Found 0 input files`。

也可以按需创建 Windows NTFS Junction，供其他本地工具通过 `content` 访问笔记：

```powershell
New-Item -ItemType Junction -Path .\content -Target "D:\path\to\your\vault"
```

## Docker 部署

复制环境变量模板，并编辑 `.env` 中的 `QUARTZ_CONTENT_PATH`，将其改为 NAS 上实际的笔记目录：

```bash
cp .env.example .env
```

例如：

```dotenv
QUARTZ_CONTENT_PATH=/path/to/notes
QUARTZ_HTTP_PORT=2222
QUARTZ_WS_PORT=2223
CHOKIDAR_USEPOLLING=true
CHOKIDAR_INTERVAL=3000
TZ=Asia/Shanghai
```

构建并启动：

```bash
docker compose up -d --build
```

查看状态和日志：

```bash
docker compose ps
docker compose logs -f quartz
```

停止并删除容器：

```bash
docker compose down
```

站点地址：<http://NAS-IP:2222>

在 Nginx 中将域名反向代理到 NAS 的 `2222` 端口即可。Compose 默认每 3 秒轮询挂载目录，确保 fnOS 同步文件时即使没有传递文件事件，Quartz 也会检测 Markdown 变更并重新构建页面。

## 内容隐私

此仓库用于保存 Quartz 程序、插件和站点配置，不保存个人笔记原文。

- `content` 不会被复制进 Docker 镜像。
- Compose 默认以只读方式将笔记挂载到 `/usr/src/app/content`。
- Obsidian 笔记应通过同步工具单独同步到 NAS。
- 部署时使用目录挂载将笔记提供给容器。
- 提交前应确认 `git status` 中没有出现个人 Markdown 文件。

## 同步官方更新

远程仓库约定：

```text
origin   https://github.com/ZluxYao/quartz.git
upstream https://github.com/jackyzha0/quartz.git
```

将 Quartz 官方 `v5` 更新合并到个人版本：

```bash
git fetch upstream
git switch official
git pull --ff-only upstream v5
git switch site
git merge official
```

解决冲突并验证后推送：

```bash
npm install
npm run check
git push origin site
```

## 上游项目

本项目基于 Jacky Zhao 的 [Quartz](https://github.com/jackyzha0/quartz) 开发。Quartz 官方文档：<https://quartz.jzhao.xyz/>

本仓库沿用上游项目的 [MIT License](LICENSE.txt)。
