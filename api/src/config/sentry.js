const Sentry = require('@sentry/node');

const initSentry = (app) => {
  if (!process.env.SENTRY_DSN) {
    console.log('Sentry DSN not configured, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration({ app }),
      Sentry.mongoIntegration()
    ]
  });

  console.log('Sentry initialized');
};

const captureError = (error, context = {}) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  }
};

const captureMessage = (message, level = 'info', context = {}) => {
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, { level, extra: context });
  }
};

const setUser = (user) => {
  if (process.env.SENTRY_DSN && user) {
    Sentry.setUser({
      id: user._id?.toString() || user.id,
      username: user.username,
      email: user.email
    });
  }
};

const clearUser = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.setUser(null);
  }
};

const addBreadcrumb = (category, message, data = {}) => {
  if (process.env.SENTRY_DSN) {
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: 'info'
    });
  }
};

module.exports = {
  initSentry,
  captureError,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  Sentry
};
