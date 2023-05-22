import { Provider } from '@nestjs/common';
import Papr from 'papr';

import {
  getModelToken,
  getModuleOptionsToken,
  getPaprToken,
} from './papr.utils';
import {
  AsyncModelDefFactory,
  ModelDef,
  PaprModuleOptions,
} from './papr.types';

export function createPaprProviders(
  connectionName?: string,
  modelsDefs: ModelDef<any, any, any>[] = [],
): Provider[] {
  return modelsDefs.reduce(
    (providers, modelDef) => [
      ...providers,
      {
        provide: getModelToken(modelDef.collection, connectionName),
        useFactory: async (options: PaprModuleOptions, papr: Papr) => {
          const model = papr.model(modelDef.collection, modelDef.schema);

          // Overwrite the collection defined by papr
          // if collectionOptions is provided
          if (modelDef.collectionOptions && papr.db) {
            model.collection = papr.db.collection(
              modelDef.collection,
              modelDef.collectionOptions,
            );
          }

          if (options.autoSchema === true) {
            await papr.updateSchema(model);
          }

          if (options.autoIndex === true && modelDef.indexes) {
            await model.collection.createIndexes(modelDef.indexes);
          }

          return model;
        },
        inject: [
          getModuleOptionsToken(connectionName),
          getPaprToken(connectionName),
        ],
      },
    ],
    [] as Provider[],
  );
}

export function createPaprAsyncProviders(
  connectionName?: string,
  modelFactories: AsyncModelDefFactory[] = [],
): Provider[] {
  return modelFactories.reduce((providers, modelFactory) => {
    return [
      ...providers,
      {
        provide: getModelToken(modelFactory.collection, connectionName),
        useFactory: async (
          options: PaprModuleOptions,
          papr: Papr,
          ...args: unknown[]
        ) => {
          const modelDef = await modelFactory.useFactory(...args);
          const model = papr.model(modelFactory.collection, modelDef.schema);

          // Overwrite the collection defined by papr
          // if collectionOptions is provided
          if (modelDef.collectionOptions && papr.db) {
            model.collection = papr.db.collection(
              modelFactory.collection,
              modelDef.collectionOptions,
            );
          }

          if (options.autoSchema === true) {
            await papr.updateSchema(model);
          }

          if (options.autoIndex === true && modelDef.indexes) {
            await model.collection.createIndexes(modelDef.indexes);
          }

          return model;
        },
        inject: [
          getModuleOptionsToken(connectionName),
          getPaprToken(connectionName),
          ...(modelFactory.inject || []),
        ],
      },
    ];
  }, [] as Provider[]);
}
