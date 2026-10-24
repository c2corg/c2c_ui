import type { AxiosRequestConfig } from 'axios';

import type { CamptocampApi } from './index';

// the API client the services send their requests through
export type Api = CamptocampApi;

export type DocumentId = number | string;

// query parameters of a request (axios `params`)
export type Params = AxiosRequestConfig['params'];

// a document as the services read it: its id and its type letter (r, w, o...)
export type DocumentRef = { document_id: DocumentId; type: string };
