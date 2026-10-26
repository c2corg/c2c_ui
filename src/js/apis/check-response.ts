import { z } from 'zod';

/**
 * Checks an API response against its schema, and returns the data as the API gave it: zod's parsed copy would leave out
 * the properties the schema doesn't list. Its type is therefore the schema's input, not its parsed output: they differ
 * for a schema that transforms or coerces values.
 *
 * A response that doesn't match is an error in development and in the tests, where it should fail loudly, and only a
 * report in production, where the page goes on with what the API gave.
 */
export function checkResponse<S extends z.ZodType>(
  schema: S,
  data: unknown,
  request: string,
  strict: boolean = import.meta.env.DEV
): z.input<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = `Unexpected response to ${request}:\n${z.prettifyError(result.error)}`;
    if (strict) {
      throw new Error(message);
    }
    // eslint-disable-next-line no-console
    console.error(message);
  }
  return data as z.input<S>;
}
