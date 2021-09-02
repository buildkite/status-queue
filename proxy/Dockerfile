FROM node:16

WORKDIR /app
COPY ["package.json", "package-lock.json", "index.js", "."]

RUN npm install --save-prod

USER node
CMD node index.js
