FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

ENV PORT=3033

EXPOSE 3033

CMD ["sh", "-c", "npm run build && npm run start"]
