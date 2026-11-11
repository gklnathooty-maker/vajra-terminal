import { createFileRoute } from "@tanstack/react-router";
import { DeskApp } from "@/components/goks/shell";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <DeskApp />;
}
