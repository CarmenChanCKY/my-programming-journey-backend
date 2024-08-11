FROM node:18

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm cache clean --force
RUN npm install

COPY . .

EXPOSE 3100

CMD [ "npm", "run", "start:dev" ]