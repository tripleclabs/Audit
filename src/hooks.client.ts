import * as Sentry from '@sentry/sveltekit';
import { handleErrorWithSentry } from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://fd5e2cda83cc487cfa181aaf942968c8@o4507118075183104.ingest.de.sentry.io/4510957919338576',
	tracesSampleRate: 1.0
});

export const handleError = handleErrorWithSentry();
