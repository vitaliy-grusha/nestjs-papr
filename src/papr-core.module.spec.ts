import { FactoryProvider, ValueProvider } from '@nestjs/common';
import { MongoClient, MongoClientOptions } from 'mongodb';
import { Test, TestingModule } from '@nestjs/testing';
import { ModelOptions } from 'papr';

import { PaprCoreModule } from './papr-core.module';
import { PaprModuleOptions } from './papr.types';
import {
  MODULE_OPTIONS_NAME,
  MONGODB_CONNECTION_NAME,
  PAPR_INSTANCE_NAME,
} from './papr.constants';
import {
  getConnectionToken,
  getModuleOptionsToken,
  getPaprToken,
} from './papr.utils';

jest.mock('papr', () => {
  return {
    default: class PaprMock {
      public initialize: () => void;
      constructor(option: ModelOptions) {
        this.initialize = jest.fn();
      }
    },
  };
});

jest.mock('mongodb', () => {
  const originalModule = jest.requireActual('mongodb');

  return {
    ...originalModule,

    MongoClient: {
      connect: jest.fn(),
    },
  };
});

describe('PaprCoreModule', () => {
  beforeEach(async () => {
    jest
      .spyOn(MongoClient, 'connect')
      .mockImplementation(async (uri: string, options?: MongoClientOptions) => {
        return {
          db: jest.fn().mockReturnValue({}),
          close: jest.fn(),
        } as unknown as MongoClient;
      });
  });

  describe('forRoot', () => {
    it('should return dynamic module for root', async () => {
      // Arrange
      const uri = 'mongodb://localhost:27017';
      const database = 'testing';
      const options: PaprModuleOptions = {
        databaseName: database,
        databaseOptions: {},
      };
      const connectionToken = getConnectionToken(options.connectionName);
      const paprToken = getPaprToken(options.connectionName);
      const optionsToken = getModuleOptionsToken(options.connectionName);

      // Act
      const moduleDef = PaprCoreModule.forRoot(uri, options);

      // Assert
      expect(moduleDef.module).toBe(PaprCoreModule);

      const mongodbConnectionName: any = moduleDef.providers.find(
        (provider: ValueProvider<string>) =>
          provider.provide === MONGODB_CONNECTION_NAME,
      );
      expect(mongodbConnectionName).toBeDefined();
      expect(mongodbConnectionName.useValue).toBe(connectionToken);

      const moduleOptionsName: any = moduleDef.providers.find(
        (provider: ValueProvider<string>) =>
          provider.provide === MODULE_OPTIONS_NAME,
      );
      expect(moduleOptionsName).toBeDefined();
      expect(moduleOptionsName.useValue).toBe(optionsToken);

      const paprName: any = moduleDef.providers.find(
        (provider: ValueProvider<string>) =>
          provider.provide === PAPR_INSTANCE_NAME,
      );
      expect(paprName).toBeDefined();
      expect(paprName.useValue).toBe(paprToken);

      const connection: any = moduleDef.providers.find(
        (provider: FactoryProvider<any>) =>
          provider.provide === connectionToken,
      );
      expect(connection).toBeDefined();
      await connection.useFactory();
      expect(MongoClient.connect).toBeCalledWith(
        uri,
        options.mongoClientOptions,
      );

      const papr: any = moduleDef.providers.find(
        (provider: FactoryProvider<any>) => provider.provide === paprToken,
      );
      expect(papr).toBeDefined();
      const mongoClient = {
        db: jest.fn().mockReturnValue({}),
      };
      const paprInstance = await papr.useFactory(mongoClient);
      expect(mongoClient.db).toBeCalledWith(
        options.databaseName,
        options.databaseOptions,
      );
      expect(paprInstance.initialize).toBeCalledWith({});
    });
  });

  describe('forRootAsync', () => {
    it('should return dynamic module for root', async () => {
      // Arrange
      const uri = 'mongodb://localhost:27017';
      const database = 'testing';
      const options: PaprModuleOptions = {
        uri,
        databaseName: database,
        databaseOptions: {},
        paprOptions: {},
      };
      const connectionToken = getConnectionToken(options.connectionName);
      const paprToken = getPaprToken(options.connectionName);
      const optionsToken = getModuleOptionsToken(options.connectionName);

      // Act
      const moduleDef = PaprCoreModule.forRootAsync(options);

      // Assert
      expect(moduleDef.module).toBe(PaprCoreModule);

      const mongodbConnectionName: any = moduleDef.providers.find(
        (provider: ValueProvider<string>) =>
          provider.provide === MONGODB_CONNECTION_NAME,
      );
      expect(mongodbConnectionName).toBeDefined();
      expect(mongodbConnectionName.useValue).toBe(connectionToken);

      const moduleOptionsName: any = moduleDef.providers.find(
        (provider: ValueProvider<string>) =>
          provider.provide === MODULE_OPTIONS_NAME,
      );
      expect(moduleOptionsName).toBeDefined();
      expect(moduleOptionsName.useValue).toBe(optionsToken);

      const paprName: any = moduleDef.providers.find(
        (provider: ValueProvider<string>) =>
          provider.provide === PAPR_INSTANCE_NAME,
      );
      expect(paprName).toBeDefined();
      expect(paprName.useValue).toBe(paprToken);

      const connection: any = moduleDef.providers.find(
        (provider: FactoryProvider<any>) =>
          provider.provide === connectionToken,
      );
      expect(connection).toBeDefined();
      await connection.useFactory({
        uri,
        mongoClientOptions: options.mongoClientOptions,
      });
      expect(MongoClient.connect).toBeCalledWith(
        uri,
        options.mongoClientOptions,
      );

      const papr: any = moduleDef.providers.find(
        (provider: FactoryProvider<any>) => provider.provide === paprToken,
      );
      expect(papr).toBeDefined();
      const mongoClient = {
        db: jest.fn().mockReturnValue({}),
      };
      const paprInstance = await papr.useFactory(options, mongoClient);
      expect(mongoClient.db).toBeCalledWith(
        options.databaseName,
        options.databaseOptions,
      );
      expect(paprInstance.initialize).toBeCalledWith({});
    });
  });

  describe('onApplicationShutdown', () => {
    it('should close connection to application shutdown', async () => {
      // Arrange
      const module: TestingModule = await Test.createTestingModule({
        imports: [PaprCoreModule.forRoot('mongodb://localhost:27017', {})],

      }).compile();

      const app = module.createNestApplication();
      const connection = app.get<MongoClient>(getConnectionToken())
      jest.spyOn(connection, 'close').mockImplementation(async () => {
        return
      })

      // Act
      await app.close();

      // Assert
      const instance = module.get(PaprCoreModule);
      expect(connection.close).toBeCalled()
    });
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });
});
