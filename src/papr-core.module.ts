import { catchError } from 'rxjs/operators';
import { defer, lastValueFrom } from 'rxjs';
import {
  DynamicModule,
  Global,
  Inject,
  Module,
  OnApplicationShutdown,
  Provider,
  Type,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { MongoClient } from 'mongodb';
import Papr from 'papr';

import {
  getConnectionToken,
  getModuleOptionsToken,
  getPaprToken,
  handleRetry,
} from './papr.utils';
import {
  MODULE_OPTIONS_NAME,
  MONGODB_CONNECTION_NAME,
  PAPR_INSTANCE_NAME,
} from './papr.constants';
import {
  PaprModuleAsyncOptions,
  PaprModuleFactoryOptions,
  PaprModuleOptions,
  PaprOptionsFactory,
} from './papr.types';

@Global()
@Module({})
export class PaprCoreModule implements OnApplicationShutdown {
  constructor(
    @Inject(MONGODB_CONNECTION_NAME) private readonly connectionName: string,
    private readonly moduleRef: ModuleRef,
  ) {}

  static forRoot(uri: string, options: PaprModuleOptions = {}): DynamicModule {
    const mongodbConnectionName = getConnectionToken(options.connectionName);
    const mongodbConnectionNameProvider = {
      provide: MONGODB_CONNECTION_NAME,
      useValue: mongodbConnectionName,
    };

    const paprInstanceName = getPaprToken(options.connectionName);
    const paprInstanceNameProvider = {
      provide: PAPR_INSTANCE_NAME,
      useValue: paprInstanceName,
    };

    const moduleOptionsName = getModuleOptionsToken(options.connectionName);
    const moduleOptionsNameProvider = {
      provide: MODULE_OPTIONS_NAME,
      useValue: moduleOptionsName,
    };
    const moduleOptionsProvider = {
      provide: moduleOptionsName,
      useValue: options,
    };

    const paprConnectionFactory =
      options.connectionFactory || ((connection) => connection);

    const paprConnectionError =
      options.connectionErrorFactory || ((error) => error);

    const connectionProvider = {
      provide: mongodbConnectionName,
      useFactory: async (): Promise<any> =>
        await lastValueFrom(
          defer(async () =>
            paprConnectionFactory(
              await MongoClient.connect(uri, options.mongoClientOptions),
              mongodbConnectionName,
            ),
          ).pipe(
            handleRetry(options.retryAttempts, options.retryDelay),
            catchError((error) => {
              throw paprConnectionError(error);
            }),
          ),
        ),
    };

    const paprProvider = {
      provide: paprInstanceName,
      useFactory: async (client: MongoClient): Promise<any> => {
        const papr = new Papr(options.paprOptions);
        const connection = client.db(
          options.databaseName,
          options.databaseOptions,
        );
        papr.initialize(connection);
        return papr;
      },
      inject: [mongodbConnectionName],
    };

    return {
      module: PaprCoreModule,
      providers: [
        connectionProvider,
        mongodbConnectionNameProvider,
        paprProvider,
        paprInstanceNameProvider,
        moduleOptionsProvider,
        moduleOptionsNameProvider,
      ],
      exports: [connectionProvider, paprProvider, moduleOptionsProvider],
    };
  }

  static forRootAsync(options: PaprModuleAsyncOptions): DynamicModule {
    const mongodbConnectionName = getConnectionToken(options.connectionName);
    const mongodbConnectionNameProvider = {
      provide: MONGODB_CONNECTION_NAME,
      useValue: mongodbConnectionName,
    };

    const paprInstanceName = getPaprToken(options.connectionName);
    const paprInstanceNameProvider = {
      provide: PAPR_INSTANCE_NAME,
      useValue: paprInstanceName,
    };

    const moduleOptionsName = getModuleOptionsToken(options.connectionName);
    const moduleOptionsNameProvider = {
      provide: MODULE_OPTIONS_NAME,
      useValue: moduleOptionsName,
    };

    const connectionProvider = {
      provide: mongodbConnectionName,
      useFactory: async (
        paprModuleOptions: PaprModuleFactoryOptions,
      ): Promise<any> => {
        const paprConnectionFactory =
          paprModuleOptions.connectionFactory || ((connection) => connection);

        const paprConnectionError =
          paprModuleOptions.connectionErrorFactory || ((error) => error);

        return await lastValueFrom(
          defer(async () =>
            paprConnectionFactory(
              await MongoClient.connect(
                paprModuleOptions.uri as string,
                paprModuleOptions.mongoClientOptions,
              ),
              mongodbConnectionName,
            ),
          ).pipe(
            handleRetry(
              paprModuleOptions.retryAttempts,
              paprModuleOptions.retryDelay,
            ),
            catchError((error) => {
              throw paprConnectionError(error);
            }),
          ),
        );
      },
      inject: [moduleOptionsName],
    };

    const paprProvider = {
      provide: paprInstanceName,
      useFactory: async (
        paprModuleOptions: PaprModuleOptions,
        client: MongoClient,
      ): Promise<any> => {
        const papr = new Papr(paprModuleOptions.paprOptions);
        const connection = client.db(
          paprModuleOptions.databaseName,
          paprModuleOptions.databaseOptions,
        );
        papr.initialize(connection);
        return papr;
      },
      inject: [moduleOptionsName, mongodbConnectionName],
    };

    const asyncProviders = this.createAsyncProviders(
      moduleOptionsName,
      options,
    );

    return {
      module: PaprCoreModule,
      imports: options.imports,
      providers: [
        moduleOptionsNameProvider,
        ...asyncProviders,
        connectionProvider,
        mongodbConnectionNameProvider,
        paprProvider,
        paprInstanceNameProvider,
      ],
      exports: [connectionProvider, paprProvider, ...asyncProviders],
    };
  }

  private static createAsyncProviders(
    moduleOptionsName: string,
    options: PaprModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(moduleOptionsName, options)];
    }
    const useClass = options.useClass as Type<PaprOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(moduleOptionsName, options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    moduleOptionsName: string,
    options: PaprModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: moduleOptionsName,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    // `as Type<PaprOptionsFactory>` is a workaround for microsoft/TypeScript#31603
    const inject = [
      (options.useClass || options.useExisting) as Type<PaprOptionsFactory>,
    ];
    return {
      provide: moduleOptionsName,
      useFactory: async (optionsFactory: PaprOptionsFactory) =>
        await optionsFactory.createPaprOptions(),
      inject,
    };
  }

  async onApplicationShutdown() {
    const connection = this.moduleRef.get<MongoClient>(this.connectionName);
    connection && (await connection.close());
  }
}
