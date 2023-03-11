# My Programming Journey Backend


## Config

### MySQL Database

Initial Setup:
```
docker pull mysql
docker run --name mysql-dev -p 3306:3306 -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:latest --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --default-time-zone=+08:00
```
Don't forget to change the ```MYSQL_ROOT_PASSWORD```

Start and stop MySQL Server:
```
docker start mysql-dev
docker stop mysql-dev
```


## Reference

## Docker Setting
[Docker MySQL Official Image](https://hub.docker.com/_/mysql/)