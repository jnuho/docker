
### Terminology

- Docker Image: single file with all the dependencies and configs required to run a program
		(default file system snapshot: copied to running container when image is run)
- Docker Container: instance of an image. Runs a program

### OS Architecture
```
APP processes-> (system call) -> Kernel -> RESOURCES[CPU, MEMORY, HARD DISK]
APP-> Kernel-> RESOURCES(HDD, network, RAM, CPU + 'IMAGE PROCESS(HD segment for this process)')

Through Namespacing (isolate resources per process or group of processes)
and Control Groups(limit resources: mem,CPU,HD,network Bandwidth),
forms Container (grouping of resources assigned to it)
Namespacing and Control Groups are not included by default
e.g. hello-world. This is specific to Linux Operating System.

# In Windows and MacOs, Linux Virtual Machine is used to host containers.
```

### Docker CLI (client)

``` sh
docker version

# Docker Server download from Docker hub and store it into image cache, if image is not found locally
docker run <image name>

# show running container process
docker ps

# all container processes including exited
docker ps --all
docker ps -a

docker run busybox ping google.com
# open another CLI window, `docker ps` will show running process (ping)
docker ps
```

### Override startup command inside image
```sh
# command executables have to be included in busybox file system image
# in order to execute override command
docker run <image name> <override command>
docker run busybox echo hi there
docker run busybox ls
```

``` sh
# Override does not work because hello-world image does not provide file system
# only a single file hello-world exists inside the file system
docker run hello-world echo hi there
docker run hello-world ls
```

### Container LifeCycle
- Create container
``` sh
docker create hello-world
```

- Start container (-a: show output)
```
docker start -a {id}
```

- Restart stopped container
```sh
docker create busybox echo hi there
docker ps --all
# show output: re-issue default command 'echo hi there'
docker start -a {id}
# without output
docker start {id}
```

- Remove stopped container
``` sh
docker rm <container_id>

# delete all stopped containers, networks, dangling images, cache
docker system prune
```

- Retrieving log outputs
``` sh
docker create busybox echo hi there
docker start {id}
# show logs without re-running container with -a option
docker logs {id}
```

- Stopping a running container
``` sh
docker create busybox ping google.com
docker start {id}
docker logs {id}
docker ps

# SIGTERM shutdown on its own time with cleanup
# container not shutting down in 10 seconds will fallback to docker kill
docker stop {container_id}

# SIGKILL shutdown immediately
docker kill {container_id}
```

### Multi-command container

```sh
# run without docker and use redis-cli
redis-server
# another terminal to use redis-cli to approach redis-server
redis-cli
> set mynumber 5
> get mynumber

# run with docker
docker run redis
# redis-cli cannot connect since redis only running inside container
# override command also has this problem
# need to get inside container and run `redis-cli`
# need to run second command inside a container
# instead try `docker run -it redis redis-cli`
redis-cli
```

- Execute Commands inside Running Containers

```sh
# run redis-server inside docker container
docker run redis

# execute 'redis-cli' inside a running container
# exec: run another command in a container
# -it: allow us to provide input to the container
docker exec -it <container_id> <command>
docker exec -it <container_id> redis-cli
> set mynumber 5
> get mynumber

# redis-cli is started up but no ability to enter in any text, closing down kicked back to terminal
# have to use -it tag
docker exec <container_id> redis-cli
```

- The Purpose of -it flag in docker exec

``` sh
# execute an additional command inside a container
# container runs inside virtual machine running linux
# ping google.com / echo hi there /redis-cli each process has: STDIN STDOUT STDERR
# -i attach(direct) our terminal to the STDIN channel in the new running process
# -t make text nicely formatted, prettier
# -it allows input of your terminal directed to the running process and allows to output back over to the terminal
```

- Get Command prompt in a container

``` sh
# get full terminal access: easy debugging
# sh: another command shell
docker exec -it <docker_container> sh
> cd ~/
> ls
> redis-cli
```

- Starting a shell after starting a container

``` sh
# go inside shell without running any other commands
docker run -it busybox sh
> ls
> cd ~/
> ping google.com
> ^C
> exit
```

### Container isolation

- two containers do not share file systems

``` sh
docker run -it busybox sh
> touch hithere.txt
> ls

# another cli
docker run -it busybox sh
> ls (not seeing hithere.txt)

docker ps
CONTAINER ID
<a>
<b>
```

- Create Docker image

```
Dockerfile(Configuration to define how our container should behave)
-> Docker Client (CLI)
-> Docker Server
-> Build Usable Image
```

- Create a DockerFile

```
1. Specifiy a base image (like OS it includes set of useful programs)
2. Run some commands to install additional programs
3. Specify a command to run on container startup
```

### Create an image that runs redis-server Using Dockerfile

```sh
mkdir redis-image
cd redis-image
ls # Dockerfile
```

- Create Dockerfile

``` dockerfile
# Writing a Dockerfile
# == Being given a computer with no OS and being told to install Chrome

# install OS
# -> start browser
# -> chrome.google.com
# -> download installer
# -> run installer exe
# -> run chrome.exe

# Use an existing docker image as a base
# alpine image might include default set of programs
# 'RUN' will use this image to create a temporary container
# download image if locally not found
FROM alpine

# Download and install a dependency
# alpine contains apk(alpine package manager app) commands
# create a temporary container with the downloaded image in 'FROM'
# inside the container, it runs 'apk add...' as a primary running process
# installs redis on the container file system
# running in {id1}
# removing {id1}
# return new snapshot {id1-1}
RUN apk add --update redis

# Tell the image what to do when it strats as a container
# use created image in RUN command and create a container
# and set a primary command for the container (executed when container is running)
# create final image
# running in {id2}
# removing {id2}
# return new snapshot {id2-1}
CMD ["redis-server"]
```

- Build image using Dockerfile

``` sh
# generate image with build context (current directory);
# set of files and folders to encapsulate in this container
docker build .
docker run [#id]
```

``` dockerfile
# instruction telling Docker server what to do + argument to the instruction
FROM alpine
RUN apk add --update redis
CMD ["redis-server"]
```

- Build image using Dockerfile

```
We used a Dockerfile to prepare to build an image
1. create container
2  execute 'apk add --update redis'
3. assign a startup-command 'redis-server'
=> remove intermediate containers and return final image with id
```

### Recap

```
FROM alpine
-> download alpine image
RUN apk add --update redis
-> get image from previous step
-> create a container out of it: [container]
-> run 'apk add --update redis' in it: [container with modified FS]
-> take snapshot of that container's FS: [FS snapshot]
-> shut down that temporary container
-> get image ready for next instruction
CMD ["redis-server"]
-> get image from last step
-> create a container out of it: [container]
-> tell container it should run 'redis-server' when started: [container with modifed primary command]
-> shut down that temporary container
-> get image ready for next instruction
-> no more steps!

=> Output is the image generated from previous step
```

### Rebuilds with Cache

``` dockerfile
FROM alpine
RUN apk add --update redis
RUN apk add --update gcc
CMD ["redis-server"]
```

``` sh
# no fetch or installation of redis
# image has been cached
# it will not use cached image if redis and gcc RUN command order changes
# installation of gcc and redis
docker build .
# Successfully build 7dfdfbcf1017

docker run 7dfdfbcf1017
```

### Tagging an Image

``` sh
docker build -t {docker id}/{repo_name}:{version} .
docker build -t username/redis:latest .
```

- Manual image Generation with Docker commit

``` dockerfile
FROM alpine
RUN apk add --update redis
RUN apk add --update gcc
CMD ["redis-server"]
```

``` sh
# do the equivalent as above Dockerfile but manually with docker commands
docker run -it alpine sh
> apk add --update redis
docker ps
# 39075447a383
# set default command -c
docker commit -c 'CMD ["redis-server"]' 39075447a383
# sha256: 0835898662...
docker run 0835898662
```


### Node js Project with Docker

```
Create Node JS web app
Create a Dockerfile
Build image from dockerfile
Run image as container
Connect to web app from a browser
```

```sh
mkdir simpleweb
cd simpleweb
touch package.json
```

``` json
// package.json
{
	"dependencies":{
		"express": "*"
	},
	"scripts":{
		"start": "node index.js"
	}
}
```

```js
const express = require('express');
const app = express();
app.get('/', (req, res) => {
	res.send('Hi there');
});

app.listen(5000, () =>{
	console.log('Listening on port 5000');
});
```

```Dockerfile
# specify a base image
FROM alpine

# install dependencies and additional programs
RUN npm install

# default command
# specify a command to run on container startup
# start nodejs server
CMD ["npm", "start"]
```


- First build-ERROR 1
``` sh
# ERROR 1!
# npm not found
# alpine image does not have npm installed
docker build .
```

- find different base image with npm install or run additional command to install npm
- dockerhub > Explore > node
```Dockerfile
# specify a base image
# alpine version of an image is small and compact as possible
# many repositories provide alpine versions of their image
FROM node:alpine

RUN npm install

CMD ["npm", "start"]
```

- Second build-ERROR 2
```sh
# No such file or directory package.json
# you should commit this file
# json file does not exist inside node:alpine image File System
# json file is in local Hard Drive which is disconnected from docker image file system
# files inside project directory are not available inside docker container
# have to specify json file inside Dockerfile
docker build .
```

- Third build-ERROR 3

```Dockerfile
FROM node:alpine

# COPY {path1} {path2}
# path1: path to folder to copy from on your machine relative to build context(e.g. simpleweb)
#		local project file system
# path2: place to copy stuff to inside the container
# 		container file system
COPY ./ ./

RUN npm install

CMD ["npm", "start"]
```

- tagging the image instead of using image id
```sh
docker build -t username/simpleweb .
docker run username/simpleweb

# open a web browser localhost:5000
# ERROR site cann't be reached
```


- Fourth build

```sh
# container Port Mapping
# local host is not routed to container ports
# container has its own isolated set of ports that can receive traffics
# need to forward localhost:8090 request to one of container ports
# container can reach out across the internet (it can get traffics through ports)
# port forwarding is only in RUNTIME not in Dockerfile configuration
# docker run -p {port1}:{port2} <image id/tagname>
# 	{port1} Route incoming requests to this port on local host to ...
# 	{port2} this port inside the container.
# 	ALSO CHANGE index.js listening port: app.listen({port2},...
# port forward to some port inside container
docker run -p {local network port}:{container port} {image id}

# CHANGE index.js : app.listen(5000, ...
docker run -p 8090:5000 username/simpleweb

# Go to browser http://localhost:8090
```

### Specify a working directory in a Dockerfile

```sh
# inspect file system without starting up a server
docker run -it username/simpleweb sh
# js and json files are copied into container  root / directory
# need to modify directory
> ls
```

```Dockerfile
FROM node:alpine

# any following command will be executed relative to this path in the container
WORKDIR /usr/app

COPY ./ ./

RUN npm install

CMD ["npm", "start"]
```

- rebuild image
```sh
docker build -t username/simpleweb .
docker run -p 8090:5000 username/simpleweb
docker run -it username/simpleweb sh
# or open up a new terminal
docker ps
docker exec -it eeed31ee65c6 sh
/usr/app > ls
/usr/app > cd /
/usr/app > ls
```

- Unnecessary rebuilds
```sh
docker run -p 8090:5000 username/simpleweb
```

```js
// editting js files is not applied to running container
// need to rebuild the container to apply changes in js file
const express = require('express');
const app = express();
app.get('/', (req, res) => {
	res.send('Bye there');
});

app.listen(5000, () =>{
	console.log('Listening on port 5000');
});
```

- unnecessary rebuild

```sh
# every step is executed again (unnecessary rerun of commands)
# need better way to copy changed files to working directory of a container
docker build -t username/simpleweb .
```

- minimizing cache busting and rebuilds

```Dockerfile
FROM node:alpine

WORKDIR /usr/app

# npm install only changes in package.json
COPY ./package.json ./
RUN npm install

# copy everything else (applies editting js file without npm install again!)
COPY ./ ./

CMD ["npm", "start"]
```


### Docker Compose App overview

```
# 1
web -> Container1[Node App+ Redis (visits=1)]
	-> Container2[Node App+ Redis 99]
	...
	-> ContainerN[Node App+ Redis 5]

# 2
web -> Container1[Node App]
	...
	-> ContainerN[Node App] -> Continaer[Redis]
```

```json
// package.json
{
	"dependencies": {
		"express": "*",
		"redis": "2.8.0"
	},
	"scripts": {
		"start": "node index.js"
	}
}
```

```js
// index.js
const express = require('express');
const redis = require('redis');

const app = express();
// connection redis server
const client = redis.createClient();
client.set('visits', 0);

app.get('/', (req, res) => {
	client.get('visits', (err, visits) => {
		res.send('Number of visits is ' + visits);
		client.set('visits', parseInt(visits) + 1);
	});
});

app.listen(8081, () => {
	console.log('Listening on port 8081');
});
```

```Dockerfile
# dockerfile for node
FROM node:alpine

WORKDIR '/app'

# only build image when package.json changes
COPY package.json .
RUN npm install
COPY ./ ./

CMD["npm", "start"]
```

```sh
# image id returns without tags
docker build .
# instead of id set tags for the image
docker build -t username/visits:latest .

# ERROR! connecting to redis(server not running)
docker run username/visits

# Run separate redis server
docker run redis
# still same error connecting to redis
# because each container is isolated from each other
# need networking infrastructure
docker run username/visits

# Options for connecting these Containers
# 1. Use Docker CLI's network features (too complicated and not practical)
# 2. Use Dcoker compose
```


### Docker Compose

- Separate CLI that gets installed along with Docker 
- Used to start up multiple Docker containers at the same time
- Automates some of the long-winded arguments we were passing to 'docker run'

* Docker Compose files

```
docker build -t username/visits:latest
docker run -p 8080:8080 username/visits
-> docker-compose.yml (contains all the options we'd normally pass to docker-cli)
-> docker-compose CLI
```

Encode docker commands like```docker build``` and ```docker run``` into ```docker-compose.yml``` file
using special syntax.

Want to create containers:
- 'redis-server' using redis image
- 'node-app' using Dockerfile & port mapping 4001 to 8081

```js
// index.js
const express = require('express');
const redis = require('redis');

const app = express();
// connection to redis server
const client = redis.createClient({
	// host: 'https://redis-server-url-without-docker.com'
	// port: 디폴트포트
	host: 'redis-server',
	port: 6379

});
client.set('visits', 0);

app.get('/', (req, res) => {
	client.get('visits', (err, visits) => {
		res.send('Number of visits is ' + visits);
		client.set('visits', parseInt(visits) + 1);
	});
});

app.listen(8081, () => {
	console.log('Listening on port 8081');
});
```

``` yml
# docker-compose.yml
version: '3'
services:
  redis-server:
    image: 'redis'
  node-app:
    build: .
      # array of ports
      # {port_localMachine}:{port_container}
    ports:
      - "4001:8081"
```

### Docker Compose Commands

```
docker run {image}=> docker-compose up

docker build .
docker run {image}=> docker-compose up --build

```



### Stopping Docker Compose Containers

```
# previously
docker run -d redis
docker ps
docker stop ba1220ea9edc
```


```sh
# Launch in background
docker-compose up -d

# Stop and Remove Containers
docker-compose down
```

### Container Maintenance with Compose

- containers that crash/hang
- test by adding lines to occur crash whenever someone visits localhost:4001

```js
const express = require('express');
const redis = require('redis');
const process = require('process');

const app = express();
// connection to redis server
const client = redis.createClient({
	// host: 'https://redis-server-url-without-docker.com'
	// port: 디폴트포트
	host: 'redis-server',
	port: 6379

});
client.set('visits', 0);

app.get('/', (req, res) => {

	// make server to crash
	// 0: exited and everything is OK
	// 1,2,3,etc: exited because something went wrong!
	process.exit(0);

	client.get('visits', (err, visits) => {
		res.send('Number of visits is ' + visits);
		client.set('visits', parseInt(visits) + 1);
	});
});

app.listen(8081, () => {
	console.log('Listening on port 8081');
});
```


```sh
# Rebuild container!
# log: "exited with 0"
docker-compose up --build

# now localhost:4001 cannot be reached (crashed)
# only shows 'redis' container process
docker ps
```

### Automatic Container Restarts


```js
```
