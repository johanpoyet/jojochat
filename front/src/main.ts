import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
// Sentry (frontend)
import * as Sentry from '@sentry/vue'
import { BrowserTracing } from '@sentry/tracing'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Initialize Sentry for the frontend if DSN is provided
if (import.meta.env.VITE_SENTRY_DSN) {
	Sentry.init({
		app,
		dsn: import.meta.env.VITE_SENTRY_DSN,
		integrations: [
			new BrowserTracing({
				routingInstrumentation: Sentry.vueRouterInstrumentation(router),
			})
		],
		// adjust sampling for production via env
		tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
		release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
		environment: import.meta.env.MODE || 'development'
	})
}

app.mount('#app')
