# 你要做的事（NEXT STEPS）— Meridian 收尾

> 最后更新：2026-10-12 晚。新母版已做好（1920×1080，中文段落已修复）。✅ Vercel 密钥已核对无误。

## 🟢 现在做：YouTube 换成新视频（新版方案：新上传 + 删旧）

> 如果 Studio 里找不到 Replace video（桌面版在 Content → 鼠标悬停视频行 → ⋮ 菜单 → "替换视频"），就用下面的方案。**旧视频先别急着删，等新的传完验证过再删。**

**第 1 步：上传新视频**
1. 打开 https://studio.youtube.com → 右上角 **Create（创建）→ Upload videos（上传视频）**
2. 文件选择：`C:\Users\User\Documents\GitHub\meridian-alexa-briefing\media\production\meridian-demo.mp4`（245 MB，1080p60）
3. 标题栏粘贴：

```
Meridian — Speak the chaos. Watch the plan assemble. (Alexa+ / MCP Apps demo)
```

4. 描述栏：打开 `submission/youtube-description.md`，把里面 **Description 代码块整段**粘贴进去（含 Chapters 时间轴、技术亮点、链接、hashtags）
5. 右侧设置：
   - Thumbnail（缩略图）→ Upload file → 选 `media/production/thumbnail.jpg`
   - Audience（受众）→ **No, it's not made for kids**
   - Language（语言）→ English
   - Category → Science & Technology
   - Altered content（合成内容披露）→ **Yes**（含 AI 旁白）
6. Tags（标签）→ 粘贴 `submission/youtube-description.md` 里的 Tags 那一段
7. Visibility（可见性）→ **Public（公开）** → Publish

**第 2 步：验证新视频**
- 打开新链接，确认能播放、章节显示、缩略图正确（等处理几分钟）

**第 3 步：删旧视频**
- Studio → Content → 旧视频（1 view 那条）→ 悬停 → **⋮ → Delete（删除）**

**第 4 步：把新链接发我**
- 我更新 Devpost 的 Video demo link 字段（位置：提交页 **Project details** → "Video demo link"，现在还是旧链接）+ 本地所有文档里的旧链接
- 或者你手动改：Project details 页 → Video demo link 框 → 粘贴新 URL → **Save**

## ⚪ 其余都在我这边（不用你动）

- 重剪 1080p 母版 ✅ 已完成并 QA
- 新缩略图（16:9 + 3:2）✅ 已完成
- Devpost 逐字段复查（进行中）
- 评审结束后：建议去 AI Studio 轮换这次贴进聊天的那把 key（1 分钟）
