import dotenv from 'dotenv';
import * as path from 'path';
import { laccicoGewerbeschein } from './laccicoGewerbeschein';
dotenv.config({
  path: path.resolve(__dirname, '../web/.env'),
});

const config = {
  logger: {
    verbosity: process.env.LOG_LEVEL ?? 'info',
  },
  integrations: {
    plentysystems: {
      location: '@plentymarkets/shop-api/server',
      // LACCICO: eigene Funktion für den Gewerbeschein-Upload (N 24.11.2026), Aufruf im Shop: useSdk().plentysystems.laccicoGewerbeschein
      extensions: (extensions: any) => [
        ...extensions,
        { name: 'laccico', extendApiMethods: { laccicoGewerbeschein } },
      ],
      configuration: {
        api: {
          url: process.env.API_ENDPOINT,
          securityToken: process.env.API_SECURITY_TOKEN ?? '',
        },
      },
      errorHandler: (error: any, req: any, res: any) => {
        // override the default error handler to preserve the original error response
        // https://docs.alokai.com/middleware/guides/custom-error-handler#customize-the-error-handler
        if (error?.response?.status) {
          res.status(error.response.status).send(error.response?.data);
        } else {
          res.status(500).send(error);
        }
      },
    },
  },
};

export default config;
