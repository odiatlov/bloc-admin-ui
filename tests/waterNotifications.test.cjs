const path = require('node:path')
const fs = require('node:fs')
const assert = require('node:assert/strict')
const Module = require('node:module')
const root = path.resolve(__dirname, '..')
const ts = require(path.join(root, 'node_modules/typescript'))
const React = require(path.join(root, 'node_modules/react'))
const { renderToStaticMarkup } = require(path.join(root, 'node_modules/react-dom/server'))
const translations = JSON.parse(fs.readFileSync(path.join(root, 'src/i18n/locales/en.json'), 'utf8'))
const t = (key, params = {}) => {
  let value = key.split('.').reduce((current, part) => current?.[part], translations) ?? key
  return String(value).replace(/\{\{(\w+)\}\}/g, (_, name) => params[name] ?? '')
}
let rows = []
const originalLoad = Module._load
Module._load = function (name, parent, isMain) {
  if (name === 'react-i18next') return { useTranslation: () => ({ t, i18n: { language: 'en' } }) }
  if (name.endsWith('/useWaterConsumptions')) return { useWaterConsumptions: () => ({
    rows, blocks: [], period: '2026-09', blockFilter: 'all', setBlockFilter() {}, setPeriod() {}, refresh() {}, loading: false, error: null,
  }) }
  if (name.endsWith('/waterReadingsApi')) return { waterReadingsApi: {} }
  if (name.endsWith('/ResidentWaterIndexSection') || name.endsWith('/AppDatePicker')) return { __esModule: true, default: () => null }
  return originalLoad.call(this, name, parent, isMain)
}
for (const extension of ['.ts', '.tsx']) Module._extensions[extension] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022,
  } }).outputText
  module._compile(output, filename)
}
const Consumption = require(path.join(root, 'src/areas/blockAdmin/pages/Consumption/components/ConsumptionSections.tsx')).default
const row = (status, canRemind, reminderSent = false) => ({
  id: '11111111-1111-4111-8111-111111111111', status, canRemind, reminderSent,
  apartment: { number: '12', blockName: 'A', staircaseName: null },
  meters: status === 'noMeters' ? [] : [{ id: '22222222-2222-4222-8222-222222222222', name: 'Kitchen', utilityType: 'ColdWater', isActive: true, previous: 10, current: null, usage: null }],
  usage: null,
})
function render(mode, item) { rows = [item]; return renderToStaticMarkup(React.createElement(Consumption, { mode })) }
assert.match(render('admin', row('incomplete', true)), /aria-label="Send reading reminder"/)
const sent = render('admin', row('incomplete', true, true))
assert.match(sent, /<button[^>]*disabled=""[^>]*aria-label="Reminder sent"/)
for (const [mode, item] of [
  ['censor', row('incomplete', true)], ['admin', row('complete', true)],
  ['admin', row('noMeters', true)], ['admin', row('incomplete', false)],
]) assert.doesNotMatch(render(mode, item), /aria-label="(?:Send reading reminder|Reminder sent)"/)
const Notification = require(path.join(root, 'src/components/notifications/NotificationListItem.tsx')).default
for (const [type, expected] of [['WaterReadingAddedByAdmin', 'Your administrator added water readings for September 2026.'], ['WaterReadingReminder', 'Please submit your missing water readings for September 2026.']]) {
  const html = renderToStaticMarkup(React.createElement(Notification, { notification: {
    type, relatedYear: 2026, relatedMonth: 9, context: 'Block A, Apartment 12', message: '', title: '',
    createdAt: '2026-09-19T12:00:00', isRead: false,
  }, onClick() {} }))
  assert(html.includes(expected))
  assert(html.includes('Block A, Apartment 12'))
}
console.log('Passed: reminder eligibility, sent disabled, complete/no-meters/censor suppression, and both notification captions with period/context.')
