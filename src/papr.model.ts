import { abstract, Model, SchemaOptions, BaseSchema } from 'papr';

import { ModelDef } from './papr.types';

export function model<
  TSchema extends BaseSchema,
  TOptions extends SchemaOptions<TSchema>,
>(
  collectionName: string,
  collectionSchema: [TSchema, TOptions],
  options: Omit<
    ModelDef<TSchema, TOptions, Model<TSchema, TOptions>>,
    'model' | 'schema' | 'collection'
  > = {},
): ModelDef<TSchema, TOptions, Model<TSchema, TOptions>> {
  const model = abstract(collectionSchema) as Model<TSchema, TOptions>;
  return {
    model,
    schema: collectionSchema,
    collection: collectionName,
    ...options,
  };
}
