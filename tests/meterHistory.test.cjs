const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('../node_modules/typescript')
const source = fs.readFileSync(path.join(__dirname, '../src/areas/supportPlatform/utils/meterHistory.ts'), 'utf8')
const moduleOutput = { exports: {} }
new Function('exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(moduleOutput.exports)
const { recordedMonths, fitHistoryRange, historySegments, registrationDate } = moduleOutput.exports
const readings = [
  { id: '3', year: 2026, month: 4, value: 15 },
  { id: '1', year: 2025, month: 12, value: 10 },
  { id: '2', year: 2026, month: 1, value: 12 },
]
const months = recordedMonths(readings)
assert.deepEqual(months, ['2025-12', '2026-01', '2026-04'])
assert.deepEqual(fitHistoryRange(months), { from: '2025-12', to: '2026-04' })
assert.deepEqual(fitHistoryRange(months, { from: '2026-01', to: '2026-04' }), { from: '2026-01', to: '2026-04' })
assert.deepEqual(fitHistoryRange(months, { from: '2026-02', to: '2026-04' }), { from: '2025-12', to: '2026-04' })
assert.deepEqual(fitHistoryRange(months, { from: '2026-04', to: '2025-12' }), { from: '2025-12', to: '2026-04' })
assert.deepEqual(fitHistoryRange([]), { from: '', to: '' })
assert.deepEqual(historySegments(readings).map((segment) => segment.map((reading) => reading.id)), [['1', '2'], ['3']])
assert.equal(historySegments([readings[0]])[0].length, 1)
assert.deepEqual(historySegments([]), [])
assert.equal(registrationDate('2026-09-01T10:00:00', 'en'), registrationDate('2026-09-01T10:00:00Z', 'en'))
for (const locale of ['en', 'ro']) {
  const raw = fs.readFileSync(path.join(__dirname, `../src/i18n/locales/${locale}.json`), 'utf8')
  const json = JSON.parse(raw.replace(/^\uFEFF/, ''))
  assert.doesNotMatch(raw, /[ÃÄÈÂ�]/)
  assert.equal(Object.keys(json.superAdmin.water).length, 17)
}
console.log('Passed: actual recorded months, range preservation/reset, single readings, chronological gaps, UTC dates and locale integrity.')
