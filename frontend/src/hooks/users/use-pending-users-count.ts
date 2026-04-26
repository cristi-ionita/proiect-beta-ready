"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios";

export function usePendingUsersCount() {
  const [count, setCount] = useState(0);

  async function load() {
    try {
      const { data } = await api.get<unknown[]>("/users/pending");
      setCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setCount(0);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return count;
}