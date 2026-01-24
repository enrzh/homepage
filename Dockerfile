FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# better-sqlite3 may need python3, make, and g++ for native compilation on alpine if prebuilds are not available
RUN apk add --no-cache python3 make g++ \
    && npm install --omit=dev \
    && apk del python3 make g++

COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js

ENV PORT=3034
ENV NODE_ENV=production

EXPOSE 3034

CMD ["node", "server.js"]
