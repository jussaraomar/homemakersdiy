FROM node:20-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# RUN npm run sass-watch

EXPOSE 3000

CMD ["node", "index.js"]