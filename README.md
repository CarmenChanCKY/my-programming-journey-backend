# My Programming Journey Backend

Start the development server:
```
npm run start:dev
```


## Config

### MySQL Database

1. Pull the [Docker MySQL Official Image](https://hub.docker.com/_/mysql/) and start the container
    ```
    docker pull mysql
    docker run --name mysql-dev -p 3306:3306 -e MYSQL_ROOT_PASSWORD=my-secret-pw -d mysql:latest --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --default-time-zone=+08:00
    ```
    Don't forget to change the ```MYSQL_ROOT_PASSWORD```

2. Start and stop MySQL Server:
    ```
    docker start mysql-dev
    docker stop mysql-dev
    ```
3. Install [mysql2](https://www.npmjs.com/package/mysql2) package
   ```
   npm install --save mysql2
   npm install --save-dev @types/node
   ```

4. In [config/database/connect.ts](/config/database/connect.ts), set up the mysql instance. Please follow the [mysql2 documentation](https://sidorares.github.io/node-mysql2/docs#first-query).


## Database Migration

1. Install the following [Sequelize](https://sequelize.org/docs/v6/other-topics/migrations/) package:
   ```
   npm install --save sequelize
   npm install --save-dev sequelize-cli
   ```
2. Run ```npx sequelize-cli init``` to initialize sequelize project
3. Create ```..sequelizerc```, set the config file path to [config/config.js](config/config.js)
4. Create ```config.js```, input the [database configure information](https://sequelize.org/docs/v6/other-topics/migrations/#dynamic-configuration)

### Create Model
```npx sequelize-cli model:generate --name [table_name] --attributes [column_name]:[data_type],[column_name]:[data_type]```

### Migrate to specific table
```npx sequelize-cli db:migrate --to [any file inside /models]```

### Migrate to all tables
```npx sequelize-cli db:migrate```

### View Migration Status
```npx sequelize-cli db:migrate:status```