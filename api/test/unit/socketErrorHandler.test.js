const { expect } = require('chai');
const { retryOperation, handleSocketError } = require('../../src/socket/errorHandler');

describe('Socket Error Handler utilities', () => {
  let originalSetTimeout;
  let originalConsoleError;

  beforeEach(() => {
    originalSetTimeout = global.setTimeout;
    originalConsoleError = console.error;
    global.setTimeout = (fn) => {
      fn();
      return 0;
    };
    console.error = () => {}; // Supprime les logs d'erreur pendant les tests
  });

  afterEach(() => {
    global.setTimeout = originalSetTimeout;
    console.error = originalConsoleError;
  });

  it('should retry failed operations before succeeding', async () => {
    let attempts = 0;

    const result = await retryOperation(async () => {
      attempts += 1;
      if (attempts < 2) {
        throw new Error('temporary');
      }
      return 'ok';
    });

    expect(result).to.equal('ok');
    expect(attempts).to.equal(2);
  });

  it('should emit contextual socket errors', () => {
    const emitted = [];
    const fakeSocket = {
      emit(event, payload) {
        emitted.push({ event, payload });
      }
    };

    handleSocketError(fakeSocket, { code: 'ECONNREFUSED' }, 'send-message');

    expect(emitted).to.have.lengthOf(1);
    expect(emitted[0]).to.deep.equal({
      event: 'error',
      payload: {
        message: 'Connection refused. Please try again later.',
        context: 'send-message',
        canRetry: true
      }
    });
  });

  it('should emit default error when no mapping exists', () => {
    const fakeSocket = {
      emitted: null,
      emit(event, payload) {
        this.emitted = { event, payload };
      }
    };

    handleSocketError(fakeSocket, new Error('boom'), 'unknown');

    expect(fakeSocket.emitted).to.exist;
    expect(fakeSocket.emitted.payload.message).to.equal('An error occurred. Please try again.');
    expect(fakeSocket.emitted.payload.context).to.equal('unknown');
  });
});
