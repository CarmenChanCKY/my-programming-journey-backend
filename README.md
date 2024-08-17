# My Programming Journey Backend

Start the development server in local:
```
npm run start:dev
```

Build and run the docker container:
```
docker-compose up -d
```

Stop the docker container:
```
docker-compose stop
```

Delete the docker image and container:
```
docker-compose down
```


## Config


## Environment Variable
This project use environment variable file to store the sensitive information. This file is located in ```/config/env```. Please create ```.env.development``` and ```.env.production``` files for development and production environment. [.env.example](/config/env/env.ts) contains the structure for environment variables.

| Variable            | Example   | Description                                              |
|---------------------|-----------|----------------------------------------------------------|
| PORT                | 3000      | Port for Express server                                  |
| DB_HOST             | localhost | Host name for MYSQL Database                             |
| DB_PORT             | 3306      | Port for MYSQL Database                                  |
| DB_USERNAME         | root      | Username for MYSQL Database                              |
| DB_PASSWORD         | xxxxxx    | The password of your MYSQL Database                      |
| DB_DATABASE         | test_db   | The name of your database                                |
| MYSQL_ROOT_PASSWORD | xxxxxx    | Root password for MYSQL Database                         |
| HASH_ITERATION      | 100       | The number of iteration for PBKDF2                       |
| HASH_KEYLEN         | 32        | The key length (in bytes) for PBKDF2                     |
| HASH_DIGEST         | sha512    | The digest used for PBKDF2                               |
| JWT_SECRET          | xxxxxx    | The 32 bytes secret key used to signing a JSON Web Token |


## Docker

This project uses [docker-compose.yml](docker-compose.yml) to set up the development environment. It consists by ```mpj_db``` (database services) and ```mpj_backend``` (backend services).

[init_db.sql](/docker/db/init_db.sql) is used to initialize and create the database automatically.

Used docker image:
- [mysql:8.0.39](https://hub.docker.com/layers/library/mysql/8.0.39/images/sha256-7b4902b99989615deaa12a3af4e32f21e9b32a862d6856d121dd44ca71c166ed?context=explore)
- [node:18](https://hub.docker.com/layers/library/node/18/images/sha256-cc722b58258b36bc4d845113d609fea1e2957f12118fccd2ffaede90f4c5e0c5?context=explore)

## MySQL Database

1. Install [mysql2](https://www.npmjs.com/package/mysql2) package
   ```
   npm install --save mysql2
   npm install --save-dev @types/node
   ```

2. In [config/database/connect.ts](/config/database/connect.ts), set up the mysql instance. Please follow the [mysql2 documentation](https://sidorares.github.io/node-mysql2/docs#first-query).


## Database Migration

1. Install the following [Sequelize](https://sequelize.org/docs/v6/other-topics/migrations/) package:
   ```
   npm install --save sequelize
   npm install --save-dev sequelize-cli
   ```
2. Run ```npx sequelize-cli init``` to initialize sequelize project
3. Create ```.sequelizerc```, set the config file path to [config/config.js](config/config.js)
4. Create ```config.js```, input the [database configure information](https://sequelize.org/docs/v6/other-topics/migrations/#dynamic-configuration)

### Create Model
```npx sequelize-cli model:generate --name [table_name] --attributes [column_name]:[data_type],[column_name]:[data_type]```

### Migrate to specific table
```npx sequelize-cli db:migrate --to [any file inside /models]```

### Migrate to all tables
```npx sequelize-cli db:migrate```

### View Migration Status
```npx sequelize-cli db:migrate:status```