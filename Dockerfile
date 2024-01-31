# docker file for things in src
FROM node:latest

WORKDIR /app

COPY package.json /app

RUN npm install

# install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

COPY . /app

WORKDIR /app/src

CMD ["node", "app.js"]
