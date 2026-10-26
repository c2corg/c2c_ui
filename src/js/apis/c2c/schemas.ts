// The responses of the c2c API, as the UI reads them: checked when they arrive (check-response.ts), and typed from here
import { z } from 'zod';

// POST /users/login
export const loginResponse = z.object({
  token: z.string(),
  // token expiration, in seconds since the epoch
  expire: z.number(),
  id: z.number(),
  username: z.string(),
  name: z.string(),
  forum_username: z.string(),
  lang: z.string(),
  roles: z.array(z.string()),
});

// the data as the API gives it (check-response.ts): the schema's input type
export type LoginResponse = z.input<typeof loginResponse>;
