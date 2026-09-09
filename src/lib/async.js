// Keep Firestore requests parallel without flooding the connection.
export async function mapLimit(values, mapper, concurrency = 8, signal) {
  const results = new Array(values.length);
  let cursor = 0;
  let failed = false;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (cursor < values.length && !failed && !signal?.aborted) {
        const index = cursor++;
        try {
          results[index] = await mapper(values[index], index);
        } catch (error) {
          failed = true;
          throw error;
        }
      }
    }),
  );
  if (signal?.aborted)
    throw new DOMException("Request cancelled", "AbortError");
  return results;
}
