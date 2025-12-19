module.exports = async function handler(req, res) {
  const { default: app, initApp } = await import('../server/src/app.js');
  await initApp();
  return app(req, res);
};
