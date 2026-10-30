// The local API (v6_api) and the e2e user, for the tests and their setup
import { readFileSync } from 'node:fs';

export const API = process.env.E2E_API ?? 'http://localhost:6543';

export const credentials = {
  username: process.env.E2E_USERNAME ?? 'e2etester',
  password: process.env.E2E_PASSWORD ?? 'E2e-Test-Pass-42',
};

// written by global-setup.ts: the logged in user and the documents the tests open
export const DATA_FILE = new URL('./.data.json', import.meta.url);

// the e2e user, as the API logs it in, and the ids of the documents of the tests
export type E2eData = {
  user: {
    id: number;
    username: string;
    name: string;
    forum_username: string;
    lang: string;
    roles: string[];
    token: string;
    expire: number;
  };
  waypoint: number;
  route: number;
  outing: number;
  editedOuting: number;
};

export const readData = (): E2eData => JSON.parse(readFileSync(DATA_FILE, 'utf8'));

export const call = async (
  path: string,
  { token, method = 'GET', body }: { token?: string; method?: string; body?: unknown } = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `JWT token="${token}"` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  }
  return response.json();
};
