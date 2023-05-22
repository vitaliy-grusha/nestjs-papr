import { Inject } from '@nestjs/common';

import { getConnectionToken, getPaprToken, getModelToken } from './papr.utils';
import { ModelDef } from './papr.types';

export const InjectModel = (
  { collection }: ModelDef<any, any, any>,
  connectionName?: string,
) => Inject(getModelToken(collection, connectionName));

export const InjectPapr = (connectionName?: string) =>
  Inject(getPaprToken(connectionName));

export const InjectConnection = (name?: string) =>
  Inject(getConnectionToken(name));
