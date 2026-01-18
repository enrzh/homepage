FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache python3 make g++ \
  && npm install

COPY . .

EXPOSE 3033 3034

CMD ["sh", "./scripts/start-dev.sh"]
