# nestjs-papr

## Description

nestjs-papr is a module that integrates the [Papr](https://github.com/plexinc/papr) library with the Nest Framework.

It provides a way to define Papr models and use them in your Nest modules through dependency injection. This integration allows you to easily work with Papr models in your Nest application.

Supports:

* single MongoDB connection
* multiple MongoDD connections
* passing custom mongo client options
* passing custom database options
* passing custom collection options
* sync and async configuration

## Getting started

### Instalation

```sh
# npm
npm install nestjs-papr

# pnpm
pnpm add nestjs-papr

# yarn
yarn install nestjs-papr
```

### Usage

1. Import ParpModule for root

```ts
@Module({
  imports: [
    PaprModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const { MONGODB_URI, MONGODB_DATABASE_NAME } =
          configService.getConfig();
        return {
          uri: MONGODB_URI,
          databaseName: MONGODB_DATABASE_NAME,
          autoIndex: true, // Create indexes automatically
          autoSchema: true, // Create schema validation automatically
        };
      },
      inject: [ConfigService],
    }),
  ]
})
```

2. Define your model

```ts
// user.model.ts

import { model, schema, types } from 'nestjs-papr';

export const UserSchema = schema(
  {
    _id: types.objectId({ required: true }),
    firstName: types.string({ required: true }),
  },
  {
    timestamps: true,
  },
);
export type UserDoc = (typeof UserSchema)[0];
export type UserProps = Omit<UserDoc, '_id' | 'createdAt' | 'updatedAt'>;
export const UserModelDef = model(UserCollection, UserSchema, { 
  indexes: [
    // Optional indexes here (IndexDescription[] type);
  ],
  collectionOptions: [
    // Optional collectionOptions here (CollectionOptions type);
  ] 
});

```

3. Provide your model for feature

```ts
@Module({
  imports: [
    PaprModule.forFeature([
      UserModelDef,
    ]),
  ]
})
```

4. Inject model into service and use it's power

```ts
// module.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from 'nestjs-papr';
import { UserModelDef, UserDoc, UserProps } from './models/user.model';

@Injectable()
export class ModuleService {
  constructor(
    @InjectModel(UserModelDef)
    private readonly userModel: typeof UserModelDef.model,
  ) {}
  
  async createUser(userProps: UserProps): Promise<UserDoc> {
    return await this.userModel.insertOne({ ...userProps });
  }
}

```

### Decorators

`InjectModel = (modelDef: ModelDef, connectionName?: string)` - inject model

`InjectPapr = (connectionName: string)` - inject Papr instance

`InjectConnection = (name: string)` - inject MongoClient instance

### Configuration

```ts
export interface PaprModuleOptions {

  // MongoDB connection uri
  uri?: string;
  
  // Connection name 
  connectionName?: string;
  
  // MongoDB database name
  databaseName?: string;
  
  // Custom MongoClient options
  mongoClientOptions?: MongoClientOptions;
  
  // Custom database options
  databaseOptions?: DbOptions;
  
  // Custom options for papr instance
  paprOptions?: ModelOptions;
  
  // Number of attepts to connect to database
  retryAttempts?: number;
  
  // Number of delay between attempts
  retryDelay?: number;
  
  // Whether to create indexes automatically (default: false)
  autoIndex?: boolean;
  
  // Whether to schema validation automatically  (default: false)
  autoSchema?: boolean;
  
  connectionFactory?: (connection: any, name: string) => any;
  connectionErrorFactory?: (error: Error) => Error;
}
```

## License

nestjs-papr is [MIT licensed](LICENSE).
