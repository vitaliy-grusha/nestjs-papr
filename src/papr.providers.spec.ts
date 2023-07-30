import {
  createPaprProviders,
  createPaprAsyncProviders,
} from './papr.providers';
import { ModelDef } from './papr.types';

describe('createPaprProviders', () => {
  it('should return an empty array if no modelDefs are provided', () => {
    const providers = createPaprProviders();
    expect(providers).toEqual([]);
  });

  it('should create providers for each modelDef', () => {
    const modelDefs: ModelDef<any, any, any>[] = [
      { collection: 'users', schema: {} as any, model: {} as any },
      { collection: 'posts', schema: {} as any, model: {} as any },
    ];
    const providers = createPaprProviders(undefined, modelDefs);
    expect(providers.length).toBe(2);
  });

  it('should use the correct model token for each modelDef', () => {
    const modelDefs: ModelDef<any, any, any>[] = [
      { collection: 'users', schema: {} as any, model: {} as any },
      { collection: 'posts', schema: {} as any, model: {} as any },
    ];
    const providers: any[] = createPaprProviders(undefined, modelDefs);
    expect(providers[0].provide).toBe('usersPaprModel');
    expect(providers[1].provide).toBe('postsPaprModel');
  });

  it('should use the correct factory function for each modelDef', () => {
    const modelDefs: ModelDef<any, any, any>[] = [
      { collection: 'users', schema: {} as any, model: {} as any },
      { collection: 'posts', schema: {} as any, model: {} as any },
    ];
    const providers: any[] = createPaprProviders(undefined, modelDefs);
    expect(providers[0].useFactory).toBeInstanceOf(Function);
    expect(providers[1].useFactory).toBeInstanceOf(Function);
  });

  it('should inject the correct dependencies for each modelDef', () => {
    const modelDefs: ModelDef<any, any, any>[] = [
      { collection: 'users', schema: {} as any, model: {} as any },
      { collection: 'posts', schema: {} as any, model: {} as any },
    ];
    const providers: any[] = createPaprProviders(undefined, modelDefs);
    expect(providers[0].inject).toEqual(['PaprModuleOptions', 'PaprInstance']);
    expect(providers[1].inject).toEqual(['PaprModuleOptions', 'PaprInstance']);
  });

  it('should update the schema if options.autoSchema is true', async () => {
    const modelDefs: ModelDef<any, any, any>[] = [
      { collection: 'users', schema: {} as any, model: {} as any },
    ];
    const options = { autoSchema: true };
    const papr = { model: jest.fn(), updateSchema: jest.fn() };
    const providers: any[] = createPaprProviders(undefined, modelDefs);
    const factory = providers[0].useFactory;

    await factory(options, papr);

    expect(papr.updateSchema).toBeCalled();
  });

  it('should create indexes if options.autoIndex is true and modelDef.indexes is defined', async () => {
    const modelDefs: ModelDef<any, any, any>[] = [
      {
        collection: 'users',
        schema: {} as any,
        model: {} as any,
        indexes: [{ key: { name: 1 }, name: 'name_index' }],
      },
    ];
    const options = { autoIndex: true };
    const model = { collection: { createIndexes: jest.fn() } };
    const papr = { model: jest.fn(() => model), updateSchema: jest.fn() };
    const providers: any[] = createPaprProviders(undefined, modelDefs);
    const factory = providers[0].useFactory;

    await factory(options, papr);

    expect(model.collection.createIndexes).toHaveBeenCalledWith(
      modelDefs[0].indexes,
    );
  });

  it('should overwrite the collection if modelDef.collectionOptions and papr.db are defined', async () => {
    const modelDefs: ModelDef<any, any, any>[] = [
      {
        collection: 'users',
        schema: {} as any,
        model: {} as any,
        collectionOptions: { checkKeys: true },
      },
    ];
    const options = { autoSchema: true };
    const collectionOptions = { checkKeys: true };
    const collection = { collection: jest.fn() };
    const papr = {
      model: jest.fn(() => ({ collection })),
      updateSchema: jest.fn(),
      db: { collection: jest.fn() },
    };
    const providers: any[] = createPaprProviders(undefined, modelDefs);
    const factory = providers[0].useFactory;

    await factory(options, papr);

    expect(papr.db.collection).toHaveBeenCalledWith(
      modelDefs[0].collection,
      collectionOptions,
    );
  });
});

describe('createPaprAsyncProviders', () => {
  it('should return an empty array if no modelFactories are provided', () => {
    const providers = createPaprAsyncProviders();
    expect(providers).toEqual([]);
  });

  it('should return an array of providers based on the modelFactories', () => {
    const modelFactories = [
      { collection: 'collection1', useFactory: jest.fn() },
      { collection: 'collection2', useFactory: jest.fn() },
    ];
    const providers = createPaprAsyncProviders(undefined, modelFactories);
    expect(providers).toHaveLength(2);
    expect(providers[0]).toHaveProperty('provide', 'collection1PaprModel');
    expect(providers[1]).toHaveProperty('provide', 'collection2PaprModel');
  });

  it('should return an empty array if no modelFactories are provided', () => {
    const providers = createPaprAsyncProviders();
    expect(providers).toEqual([]);
  });

  it('should return an array of providers based on the modelFactories', () => {
    const modelFactories = [
      { collection: 'collection1', useFactory: jest.fn() },
      { collection: 'collection2', useFactory: jest.fn() },
    ];
    const providers = createPaprAsyncProviders(undefined, modelFactories);
    expect(providers).toHaveLength(2);
    expect(providers[0]).toHaveProperty('provide', 'collection1PaprModel');
    expect(providers[1]).toHaveProperty('provide', 'collection2PaprModel');
  });

  it('should overwrite the collection defined by papr if collectionOptions is provided', async () => {
    const modelFactory = {
      collection: 'collection1',
      useFactory: jest.fn().mockImplementation(async () => ({
        schema: {},
        collectionOptions: { option1: 'value1', option2: 'value2' },
      })),
    };
    const options = { autoSchema: false };
    const papr = {
      schema: {} as any,
      model: jest.fn().mockImplementation(() => ({})),
      db: { collection: jest.fn() },
    };

    const providers: any[] = createPaprAsyncProviders(undefined, [
      modelFactory,
    ]);
    const factory = providers[0].useFactory;

    await factory(options, papr);

    expect(papr.db.collection).toHaveBeenCalledWith('collection1', {
      option1: 'value1',
      option2: 'value2',
    });
  });

  it('should call papr.updateSchema if options.autoSchema is true', async () => {
    const modelFactory = {
      collection: 'collection1',
      useFactory: jest.fn().mockImplementation(async () => ({ schema: {} })),
    };
    const options = { autoSchema: true };
    const papr = {
      schema: {} as any,
      model: jest.fn().mockImplementation(() => ({})),
      updateSchema: jest.fn(),
    };

    const providers: any[] = createPaprAsyncProviders(undefined, [
      modelFactory,
    ]);
    const factory = providers[0].useFactory;

    await factory(options, papr);

    expect(papr.updateSchema).toHaveBeenCalledWith(expect.anything());
  });

  it('should call model.collection.createIndexes if options.autoIndex is true and modelDef.indexes is provided', async () => {
    const indexes = [{ field1: 1 }, { field2: -1 }];
    const modelFactory = {
      collection: 'collection1',
      useFactory: jest
        .fn()
        .mockImplementation(async () => ({ schema: {}, indexes })),
    };
    const options = { autoSchema: false, autoIndex: true };
    const collection = {
      createIndexes: jest.fn(),
    };
    const papr = {
      schema: {} as any,
      model: jest.fn().mockImplementation(() => ({
        collection: collection,
      })),
      db: { collection: jest.fn() },
    };

    const providers: any[] = createPaprAsyncProviders(undefined, [
      modelFactory,
    ]);
    const factory = providers[0].useFactory;

    await factory(options, papr);

    expect(papr.model).toHaveBeenCalledWith('collection1', expect.anything());
    expect(collection.createIndexes).toHaveBeenCalledWith(indexes);
  });
});
