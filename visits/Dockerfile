
# dockerfile for node
FROM node:alpine

WORKDIR '/app'

# only build image when package.json changes
COPY package.json .
RUN npm install
COPY ./ ./

CMD ["npm", "start"]
