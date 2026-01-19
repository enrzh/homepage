FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=3033

EXPOSE 3033

CMD ["npm", "run", "dev"]
