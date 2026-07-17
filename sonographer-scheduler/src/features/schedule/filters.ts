/** Active schedule filters. Empty arrays mean "show everything" (no filtering). */
export interface Filters {
  sonographerIds: string[];
  clinicIds: string[];
}

export const EMPTY_FILTERS: Filters = { sonographerIds: [], clinicIds: [] };
