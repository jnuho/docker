# docker build -t jnuho/redis:latest .
# docker run {image_id}
# winpty docker exec -it {container_id} sh
FROM alpine

RUN apk add --update redis

CMD ["redis-server"]
