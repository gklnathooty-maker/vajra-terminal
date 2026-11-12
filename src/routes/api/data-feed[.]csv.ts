import { createFileRoute } from "@tanstack/react-router";
import { handleDataFeedRequest } from "@/lib/goks/data-feed-service";

export const Route = createFileRoute("/api/data-feed.csv")({
  server: {
    handlers: {
      GET: ({ request }) => handleDataFeedRequest(request),
      OPTIONS: ({ request }) => handleDataFeedRequest(request),
    },
  },
});
