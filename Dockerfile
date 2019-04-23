FROM node:8-slim

LABEL maintainer="Jonathan Gros-Dubois"
LABEL version="14.3.2"
LABEL description="Docker file for SocketCluster with support for clustering."

ENV ENV prod

RUN apt-get update -y
RUN apt-get install build-essential -y

RUN mkdir -p /usr/src/
WORKDIR /usr/src/
COPY . /usr/src/

RUN npm install .

RUN npm remove sc-uws --save
RUN npm install sc-uws --save

EXPOSE 8000

CMD ["npm", "run", "start:docker"]
