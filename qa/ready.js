// Waiting for the app instead of sleeping a fixed time (V3 Tasks, "Make
// testing faster"). The app sets data-ready="1" on <html> once its first
// render is on screen and the collection has loaded (app.jsx). `appReady`
// waits for that, then a short margin for the entrance motion that follows a
// load (the Up next fade, the meters filling, a camera glide).
//
//   const { appReady } = require('./ready');
//   await page.goto(URL); await appReady(page);
//
// The timing-sensitive checks (camera, inertia, wide touch, animation) and
// test-boot keep their fixed waits on purpose.
const MARGIN = +process.env.QA_READY_MARGIN || 700;

async function appReady(page, margin = MARGIN) {
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1', null, { timeout: 30000, polling: 50 });
  if (margin) await page.waitForTimeout(margin);
}

module.exports = { appReady };
