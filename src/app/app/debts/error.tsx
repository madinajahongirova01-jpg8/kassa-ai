"use client";

import { useEffect } from "react";
import { PageError } from "@/components/daftar/PageState";

export default function DebtsError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return <PageError onRetry={retry} />;
}
