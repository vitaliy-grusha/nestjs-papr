import { Model, ModelOptions, BaseSchema, SchemaOptions } from 'papr';
import { ModuleMetadata, Type } from '@nestjs/common';
import {
  CollectionOptions,
  DbOptions,
  IndexDescription,
  MongoClientOptions,
} from 'mongodb';

export interface PaprModuleOptions {
  uri?: string;
  connectionName?: string;
  databaseName?: string;
  mongoClientOptions?: MongoClientOptions;
  databaseOptions?: DbOptions;
  paprOptions?: ModelOptions;
  retryAttempts?: number;
  retryDelay?: number;
  autoIndex?: boolean;
  autoSchema?: boolean;
  connectionFactory?: (connection: any, name: string) => any;
  connectionErrorFactory?: (error: Error) => Error;
}

export interface PaprOptionsFactory {
  createPaprOptions(): Promise<PaprModuleOptions> | PaprModuleOptions;
}

export type PaprModuleFactoryOptions = Omit<
  PaprModuleOptions,
  'connectionName'
>;

export interface PaprModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  connectionName?: string;
  useExisting?: Type<PaprOptionsFactory>;
  useClass?: Type<PaprOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<PaprModuleFactoryOptions> | PaprModuleFactoryOptions;
  inject?: any[];
}

export interface ModelDef<
  TSchema extends BaseSchema,
  TOptions extends SchemaOptions<TSchema>,
  TModel extends Model<TSchema, TOptions>,
> {
  model: TModel;
  schema: [TSchema, TOptions];
  collection: string;
  collectionOptions?: CollectionOptions;
  indexes?: IndexDescription[];
}

export interface AsyncModelDefFactory
  extends Pick<ModuleMetadata, 'imports'>,
    Pick<ModelDef<any, any, any>, 'collection'> {
  useFactory: (...args: any[]) => Omit<ModelDef<any, any, any>, 'collection'>;
  inject?: any[];
}
