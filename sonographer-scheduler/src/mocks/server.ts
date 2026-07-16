import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** MSW server used in tests (Node/jsdom) — same handlers as the browser. */
export const server = setupServer(...handlers);
