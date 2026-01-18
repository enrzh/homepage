FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3033 3034

CMD ["sh", "./scripts/start-dev.sh"]
