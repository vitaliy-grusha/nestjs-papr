import { Inject } from '@nestjs/common';

import { getConnectionToken, getPaprToken, getModelToken } from './papr.utils';
import { ModelDef } from './papr.types';

interface InjectResult {
  (target: object, key: string | symbol | undefined, index?: number): void;
}

export const InjectModel = (
  { collection }: ModelDef<any, any, any>,
  connectionName?: string,
): InjectResult => Inject(getModelToken(collection, connectionName));

export const InjectPapr = (connectionName?: string): InjectResult =>
  Inject(getPaprToken(connectionName));

export const InjectConnection = (name?: string): InjectResult =>
  Inject(getConnectionToken(name));
