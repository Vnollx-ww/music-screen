# music-screen FastAPI Backend

自建后端用于替代 Supabase。当前后端使用 FastAPI + MySQL，保留歌曲投稿、歌曲列表、投票和 WebSocket 实时广播能力。

## 接口

- `GET /api/health`：健康检查
- `GET /api/songs`：按 `created_at` 倒序返回歌曲列表
- `POST /api/songs`：投稿歌曲，默认 `votes=1`、`play_count=0`、`recommend_count=1`
- `POST /api/songs/{song_id}/vote`：给歌曲投票，每个 IP 默认最多 3 票
- `POST /api/music/generate`：调用 MiniMax API 生成音乐，上传到 MinIO，返回生成结果
- `GET /api/music/{music_id}`：获取生成的音乐详情和 MinIO 访问链接
- `WebSocket /api/ws`：实时接收歌曲新增/更新事件

WebSocket 事件格式：

```json
{
  "type": "insert",
  "song": {
    "id": "uuid",
    "title": "歌曲名",
    "artist": "歌手",
    "era": "digital",
    "votes": 1,
    "play_count": 0,
    "recommend_count": 1,
    "created_at": "2026-05-23T10:00:00"
  },
  "song_id": null
}
```

## 初始化数据库

```bash
mysql -u root -p < backend/sql/001_init_mysql.sql
mysql -u root -p < backend/sql/002_generated_music.sql
```

如果需要单独创建业务账号，可以在 MySQL 中执行：

```sql
CREATE USER IF NOT EXISTS 'music_screen'@'%' IDENTIFIED BY 'music_screen';
GRANT SELECT, INSERT, UPDATE, DELETE ON music_screen.* TO 'music_screen'@'%';
FLUSH PRIVILEGES;
```

## 本地启动

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```

如需开发热重载：

```bash
set RELOAD=true
python app.py
```

## 环境变量

- `DATABASE_URL`：SQLAlchemy MySQL 连接串
- `CORS_ORIGINS`：允许访问 API 的前端 Origin JSON 数组
- `VOTE_LIMIT_PER_IP`：每个 IP 最多投票次数
- `MINIMAX_API_KEY`：MiniMax API 密钥（必填，用于音乐生成）
- `MINIMAX_MUSIC_GENERATION_URL`：MiniMax 音乐生成接口地址（默认：`https://api.minimaxi.com/v1/music_generation`）
- `MINIMAX_REQUEST_TIMEOUT_SECONDS`：调用 MiniMax 接口超时时间（默认：180）
- `MUSIC_DOWNLOAD_TIMEOUT_SECONDS`：下载生成音频超时时间（默认：120）
- `MINIO_ENDPOINT`：MinIO 服务端点（默认：`111.230.105.54:9000`）
- `MINIO_ACCESS_KEY`：MinIO 访问密钥（必填）
- `MINIO_SECRET_KEY`：MinIO 秘密密钥（必填）
- `MINIO_BUCKET`：MinIO 存储桶名（默认：`music`）
- `MINIO_SECURE`：是否使用 HTTPS 连接 MinIO（默认：`false`）
- `GENERATED_MUSIC_TTL_DAYS`：生成音乐过期天数（默认：7）
- `GENERATED_MUSIC_CLEANUP_ENABLED`：是否启用过期清理（默认：`true`）
- `GENERATED_MUSIC_CLEANUP_INTERVAL_SECONDS`：清理任务间隔秒数（默认：86400）
- `GENERATED_MUSIC_CLEANUP_BATCH_SIZE`：每次清理批量大小（默认：200）

## 部署说明

部署前请将 `backend/.env.example` 复制为 `backend/.env`，并填入实际的 `MINIMAX_API_KEY`、`MINIO_ACCESS_KEY`、`MINIO_SECRET_KEY` 等敏感配置。`.env` 文件已被 `.gitignore` 忽略，不会进入版本控制。

生成的音乐会自动上传到 MinIO，数据库记录会在 `GENERATED_MUSIC_TTL_DAYS` 天后标记为过期，并由后台定时任务自动清理 MinIO 对象。

## 设计说明

MySQL 只负责表结构、索引和基础枚举约束。投稿默认值、IP 识别、IP 限投、投票加计数和实时广播都在 FastAPI 服务层控制，方便后续接入外部 API。音乐生成、MinIO 上传和过期清理等业务逻辑也统一放在服务层处理。
