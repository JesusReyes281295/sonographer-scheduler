import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/** MSW worker used in the browser (dev server and preview builds). */
export const worker = setupWorker(...handlers);
