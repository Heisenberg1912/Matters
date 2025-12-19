import app, { initApp } from '../server/src/app.js';

export default async function handler(req, res) {
  await initApp();
  return app(req, res);
}
