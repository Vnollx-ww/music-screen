# Build:
# docker build --no-cache --build-arg VITE_API_BASE_URL="http://111.230.105.54:8000/api" --build-arg VITE_WS_URL="ws://111.230.105.54:8000/api/ws" -t music-screen-frontend .

FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_WS_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
    listen 5000;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
EOF

EXPOSE 5000

CMD ["nginx", "-g", "daemon off;"]
