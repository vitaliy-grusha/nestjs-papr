import { DynamicModule, Module, flatten } from '@nestjs/common';

import {
  createPaprAsyncProviders,
  createPaprProviders,
} from './papr.providers';
import {
  AsyncModelDefFactory,
  ModelDef,
  PaprModuleAsyncOptions,
  PaprModuleOptions,
} from './papr.types';
import { PaprCoreModule } from './papr-core.module';

@Module({})
export class PaprModule {
  static forRoot(uri: string, options: PaprModuleOptions = {}): DynamicModule {
    return {
      module: PaprModule,
      imports: [PaprCoreModule.forRoot(uri, options)],
    };
  }

  static forRootAsync(options: PaprModuleAsyncOptions): DynamicModule {
    return {
      module: PaprModule,
      imports: [PaprCoreModule.forRootAsync(options)],
    };
  }

  static forFeature(
    models: ModelDef<any, any, any>[] = [],
    connectionName?: string,
  ): DynamicModule {
    const providers = createPaprProviders(connectionName, models);
    return {
      module: PaprModule,
      providers: providers,
      exports: providers,
    };
  }

  static forFeatureAsync(
    factories: AsyncModelDefFactory[] = [],
    connectionName?: string,
  ): DynamicModule {
    const providers = createPaprAsyncProviders(connectionName, factories);
    const imports = factories.map((factory) => factory.imports || []);
    const uniqImports = new Set(flatten(imports));

    return {
      module: PaprModule,
      imports: [...uniqImports],
      providers: providers,
      exports: providers,
    };
  }
}
