# music-screen FastAPI Backend

自建后端用于替代 Supabase。当前后端使用 FastAPI + MySQL，保留歌曲投稿、歌曲列表、投票和 WebSocket 实时广播能力。

## 接口

- `GET /api/health`：健康检查
- `GET /api/songs`：按 `created_at` 倒序返回歌曲列表
- `POST /api/songs`：投稿歌曲，默认 `votes=1`、`play_count=0`、`recommend_count=1`
- `POST /api/songs/{song_id}/vote`：给歌曲投票，每个 IP 默认最多 3 票
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
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 环境变量

- `DATABASE_URL`：SQLAlchemy MySQL 连接串
- `CORS_ORIGINS`：允许访问 API 的前端 Origin JSON 数组
- `VOTE_LIMIT_PER_IP`：每个 IP 最多投票次数

## 设计说明

MySQL 只负责表结构、索引和基础枚举约束。投稿默认值、IP 识别、IP 限投、投票加计数和实时广播都在 FastAPI 服务层控制，方便后续接入外部 API。
