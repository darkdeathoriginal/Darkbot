FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm i
RUN npm install --os=linux --cpu=x64 sharp

COPY . .

EXPOSE 3000
CMD [ "npm", "start" ]