import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Readable } from 'stream';

// credit: https://github.com/org-redtea/format-axios-error

const CONFIG_KEYS = [
  'url',
  'method',
  'baseURL',
  'headers',
  'params',
  'data',
  'timeout',
  'timeoutErrorMessage',
  'withCredentials',
  'auth',
  'responseType',
  'xsrfCookieName',
  'xsrfHeaderName',
  'maxContentLength',
  'maxBodyLength',
  'maxRedirects',
  'socketPath',
  'proxy',
  'decompress'
] as const;

const RESPONSE_KEYS = ['data', 'status', 'statusText', 'headers'] as const;

interface AxiosErrorFormat<T = any> {
  config: Pick<AxiosRequestConfig, (typeof CONFIG_KEYS)[number]>;
  code?: string;
  response?: Pick<AxiosResponse<T>, (typeof RESPONSE_KEYS)[number]>;
  isAxiosError: boolean;
}

interface AxiosErrorFormatError<T = any> extends Error, AxiosErrorFormat<T> {}

export function formatAxiosError<E = any>(
  error: E
): E extends AxiosError<infer T> ? AxiosErrorFormatError<T> : E {
  if (!axios.isAxiosError(error)) {
    return error as any;
  }

  const formatError: Partial<AxiosErrorFormatError> = new Error(error.message);

  formatError.name = error.name;
  formatError.stack = error.stack;
  formatError.code = error.code;
  formatError.isAxiosError = error.isAxiosError;
  formatError.config = {};

  for (const configKey of CONFIG_KEYS) {
    if (error.config[configKey] !== undefined) {
      formatError.config[configKey as any] =
        configKey === 'data'
          ? formatData(error.config[configKey])
          : error.config[configKey];
    }
  }

  if (error.response) {
    formatError.response = {} as any;
    for (const responseKey of RESPONSE_KEYS) {
      if (error.response[responseKey] !== undefined) {
        formatError.response[responseKey as any] =
          responseKey === 'data'
            ? formatData(error.response[responseKey])
            : error.response[responseKey];
      }
    }
  }

  return formatError as any;
}

function formatData(data: any): any {
  if (data instanceof Readable) {
    return '[Readable]';
  }

  return data;
}
