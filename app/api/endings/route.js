import { Redis } from "@upstash/redis";

export async function POST(request) {
  try {
    const { endingId } = await request.json();

    if (!endingId) {
      return Response.json({ error: "No endingId provided" }, { status: 400 });
    }

    // Gracefully fallback if Redis environment variables are missing
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.warn("Upstash Redis credentials missing. Returning local mock count.");
      return Response.json({ count: 1 });
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const key = `ending:${endingId}`;
    const count = await redis.incr(key);

    return Response.json({ count });
  } catch (error) {
    console.error("Redis Error:", error);
    // Return a graceful 200 mock response so the UI doesn't break
    return Response.json({ count: 1 });
  }
}