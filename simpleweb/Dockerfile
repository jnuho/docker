# specify base image
FROM node:alpine
# any following command will be executed relative to this path in the container
WORKDIR /usr/app

# npm install only changes in package.json
COPY ./package.json ./

# install package.json dependencies
RUN npm install

# copy everything else (applies editting js file without npm install again!)
COPY ./ ./

# default command
# specify a command to run on container startup
# : start nodejs server
CMD ["npm", "start"]
