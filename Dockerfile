FROM node:24-bookworm-slim
ENV NODE_ENV=production APP_ENV=staging HOST=0.0.0.0 PORT=3100 DATABASE_PATH=/app/data/staging.sqlite
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
COPY --chown=node:node migrations ./migrations
RUN mkdir /app/data && chown node:node /app/data
USER node
EXPOSE 3100
CMD ["node", "src/server.js"]
