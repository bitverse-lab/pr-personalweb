"use server";

import { requireUserId } from "@/server/auth";
import { searchService, type SearchHit } from "@/server/services/search-service";

export async function globalSearch(query: string): Promise<SearchHit[]> {
  const userId = await requireUserId();
  if (typeof query !== "string") return [];
  return searchService.search(userId, query);
}
