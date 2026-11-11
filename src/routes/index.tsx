import { createFileRoute } from "@tanstack/react-router";
import { DeskApp } from "@/components/goks/shell";
import { AccessGate } from "@/components/goks/access-gate";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <AccessGate>
      <DeskApp />
    </AccessGate>
  );
}
