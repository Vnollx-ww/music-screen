# 信义坊社区音乐榜单上传交互功能 PRD

**更新日期**：2026 年 5 月 21 日

**更新说明**：

- **交互动效优化**：调整背景切换逻辑，上传后切换为透明黑色背景，小球汇入后恢复原始背景。
- **视觉聚焦优化**：透明黑色背景期间，仅保留黑胶底座、小球及三维场景核心动效显示。
- **待确认问题**：歌曲在手机端上传时，是否可以增加自动识别发行年份功能？

## 一、项目概述

本功能为信义坊社区音乐榜单三维可视化交互系统，用于实现观展用户通过手机扫码上传歌曲。

系统自动识别歌曲年代，并匹配对应时代媒介，依次触发背景切换、黑胶底座旋转、小球生成汇入动效。动效完成后恢复背景，最终更新左侧代际歌曲榜单，完成社区代际音乐共创交互闭环，增强交互沉浸感。

## 二、整体交互时序

1. 用户使用手机扫码上传歌曲。
   - 示例歌曲：《夜来香》
2. 系统识别歌曲发行年份。
   - 示例年份：1944 年
   - 匹配媒介：黑胶
3. 手机端上传后，大屏背景切换为**透明黑色背景**。
   - 仅显示黑胶底座、三维场景核心元素。
   - 隐藏冗余背景，确保黑胶媒介底座和小球动效清晰可见。
4. 对应黑胶媒介小球生成。
   - 小球从球体集群模块内冒出。
   - 小球平滑汇入榜单底座。
5. 小球完全汇入底座后，大屏背景恢复为原始背景。

## 三、各模块详细需求

### 1. 扫码上传触发模块

- **触发方式**：用户使用手机扫描大屏二维码，上传指定歌曲。
- **示例歌曲**：《夜来香》
- **系统行为**：接收上传数据 → 解析歌曲信息 → 提取发行年份。

### 2. 年代-媒介自动匹配模块

- **匹配规则**：根据歌曲发行年份，自动映射对应时代音乐媒介。
- **固定映射示例**：1944 年 = 黑胶媒介。
- **输出结果**：手机端生成黑胶交互小球，同时触发大屏动效。

### 3. 大屏动效模块

#### 3.1 背景溶解

- **触发时机**：媒介匹配成功后，触发背景溶解。
- **显示状态**：只显示黑胶媒介及核心三维元素。

![背景溶解示意](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NTI0YTgzOTM3ZmVmYjhkZGI4NzE3NWRjNTFhMTM5M2JfZGMwOTc2NDllNjQ2NDFiM2QxOTM2MmVjYzQxNTkzNDZfSUQ6NzY0MjI1MzQ0NjQwNjA5ODEzNF8xNzc5NDM1NjE5OjE3Nzk1MjIwMTlfVjM)

#### 3.2 黑胶媒介底座生成音乐小球

![黑胶底座生成小球示意](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NDQ4NjgzMGI3NzBkZmZmMzVkYjQ2YTA2MzQ4YmMxNmNfMmUxODBhZGRmMGU3ZTZmNmUzZmNiOTY4ZDk5YWIxMWVfSUQ6NzY0MjI1NTcyMTczMTU0MTk2NF8xNzc5NDM1NjE5OjE3Nzk1MjIwMTlfVjM)

#### 3.3 小球汇入榜单底座

![小球汇入榜单底座示意](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=OTAzYmY2Mjg1MzJiZTE4OWU4MTY2MjUyOTFkZTZjYWJfNWRlZjE0YzM2MThhYTcwNGNmY2VhYWJiOTQyY2FiMmFfSUQ6NzY0MjI1NjAwMzg5NTQxMzcxOV8xNzc5NDM1NjE5OjE3Nzk1MjIwMTlfVjM)

#### 3.4 黑胶媒介下落

![黑胶媒介下落示意](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=MDk1MzNiZWQ3MDA2YTgwNTY5NjQ3NzUyOTE4NzM5NzhfODIwOTQ3ZGI4M2YyOGZkMzJiYTg5NTExNmI4MTgxNGZfSUQ6NzY0MjI1NjI3NTQ2OTIyNTE4Ml8xNzc5NDM1NjE5OjE3Nzk1MjIwMTlfVjM)

#### 3.5 背景恢复

- **动效流程**：透明黑色背景 → 恢复大屏原始背景。
- **过渡方式**：溶解效果。
- **结束状态**：动效结束，大屏恢复常规展示状态。

![背景恢复示意](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=ZWU1NTRiNjcyYWEzODA0NTRiYjg4MDJiOGNlZmExNTVfZjc4OGU3OTU2MzkyY2FhZGU4MDE0NWQzNmI0M2M2YjZfSUQ6NzY0MjI1NjU4NTgxMTUxMjI4MV8xNzc5NDM1NjE5OjE3Nzk1MjIwMTlfVjM)

> 注：文档部分内容可能由 AI 生成。
