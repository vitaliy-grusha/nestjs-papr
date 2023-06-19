import { delay, retryWhen, scan } from 'rxjs/operators';
import { Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

import {
  DEFAULT_DB_CONNECTION,
  DEFAULT_MODULE_OPTIONS,
  DEFAULT_PAPR_INSTANCE,
} from './papr.constants';

export function getModelToken(model: string, connectionName?: string) {
  if (connectionName === undefined) {
    return `${model}PaprModel`;
  }
  return `${getConnectionToken(connectionName)}/${model}PaprModel`;
}

export function getConnectionToken(name?: string) {
  return name && name !== DEFAULT_DB_CONNECTION
    ? `${name}PaprConnection`
    : DEFAULT_DB_CONNECTION;
}

export function getPaprToken(name?: string) {
  return name && name !== DEFAULT_PAPR_INSTANCE
    ? `${name}PaprInstance`
    : DEFAULT_PAPR_INSTANCE;
}

export function getModuleOptionsToken(name?: string) {
  return name && name !== DEFAULT_MODULE_OPTIONS
    ? `${name}PaprModuleOptions`
    : DEFAULT_MODULE_OPTIONS;
}

export function handleRetry(
  retryAttempts = 9,
  retryDelay = 3000,
): <T>(source: Observable<T>) => Observable<T> {
  const logger = new Logger('PaprLogger');
  return <T>(source: Observable<T>) =>
    source.pipe(
      retryWhen((e) =>
        e.pipe(
          scan((errorCount, error) => {
            logger.error(
              `Unable to connect to the database. Retrying (${
                errorCount + 1
              })...`,
              '',
            );
            if (errorCount + 1 >= retryAttempts) {
              throw error;
            }
            return errorCount + 1;
          }, 0),
          delay(retryDelay),
        ),
      ),
    );
}
