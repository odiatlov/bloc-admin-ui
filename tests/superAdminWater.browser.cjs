const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/ovidi/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const assert = require('node:assert/strict')
const path = require('node:path')
const id = (value) => `00000000-0000-4000-8000-${String(value).padStart(12, '0')}`
const admin = id(1), block = id(2), apartment = id(3), inactiveApartment = id(4), noMeterApartment = id(5)
const cold = id(6), hot = id(7), empty = id(8), unassignedBlock = id(9)
const meter = (meterId, name, isActive, readings) => ({ id: meterId, name, utilityType: 'ColdWater', isActive, readings })
const reading = (month, value) => ({ id: id(month + 100), year: 2026, month, value, submittedAt: `2026-${String(month).padStart(2, '0')}-20T10:00:00`, submittedBy: 'Test administrator' })
const apartmentInfo = (apartmentId, number, blockId = block) => ({ id: apartmentId, number, blockId, blockName: blockId === block ? 'A' : 'U', staircaseName: '1' })
const row = (apartmentId, number, hasMeters, blockId = block) => ({
  id: apartmentId, apartment: apartmentInfo(apartmentId, number, blockId), hasMeters,
  meters: [], usage: null, status: 'noMeters',
})
;(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' })
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    page.setDefaultTimeout(10000)
    page.on('console', (message) => { if (message.type() === 'error') console.error(message.text()) })
    const errors = [], requests = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.addInitScript((account) => {
      localStorage.setItem('mockAccountId', account)
      localStorage.setItem('mockActiveRole', 'SuperAdmin')
      localStorage.setItem('mockJwt', `mock-jwt-superadmin-${account}`)
      localStorage.setItem('appLanguage', 'en')
    }, id(10))
    let historyError = false, reportError = false, emptyReport = false, delayHistory = false
    await page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url())
      requests.push({ path: url.pathname, query: url.search, method: route.request().method() })
      assert.equal(route.request().method(), 'GET', 'Support page must never mutate data')
      let data = []
      if (url.pathname === '/api/mock-login/accounts') data = [{ id: id(10), name: 'Support tester', email: 'support@example.test', roles: ['SuperAdmin'], defaultRole: 'SuperAdmin', systemRole: 'SuperAdmin', blockRoles: [], token: `mock-jwt-superadmin-${id(10)}` }]
      if (url.pathname.endsWith('/water/administrators')) data = [{ id: admin, name: 'Test administrator' }]
      if (url.pathname.endsWith('/water/consumptions')) {
        if (reportError) return route.fulfill({ status: 500, json: { success: false } })
        const unassigned = url.searchParams.get('unassigned') === 'true'
        const blocks = [
          ...(!unassigned ? [{ id: block, name: 'A', firstReadingPeriod: 202601, firstSubmissionPeriod: 202602 }] : []),
          ...(!url.searchParams.has('adminAccountId') ? [{ id: unassignedBlock, name: 'U', firstReadingPeriod: 202605, firstSubmissionPeriod: 202604 }] : []),
        ]
        data = { blocks, rows: emptyReport ? [] : unassigned ? [row(id(11), '8', false, unassignedBlock)] : [row(apartment, '12', true), row(inactiveApartment, '14', true), row(noMeterApartment, '15', false)] }
      }
      if (url.pathname.endsWith('/meters')) {
        if (delayHistory) await new Promise((resolve) => setTimeout(resolve, 400))
        if (historyError) return route.fulfill({ status: 500, json: { success: false } })
        const inactive = url.pathname.includes(inactiveApartment)
        data = { apartment: apartmentInfo(inactive ? inactiveApartment : apartment, inactive ? '14' : '12'), meters: inactive
          ? [meter(hot, 'Old bathroom', false, [reading(8, 22)])]
          : [meter(cold, 'Kitchen', true, [reading(1, 100), reading(2, 110), reading(4, 130)]), meter(hot, 'Old bathroom', false, [reading(8, 22)]), meter(empty, 'New kitchen', true, [])] }
      }
      await route.fulfill({ json: { success: true, data } })
    })
    await page.goto(process.env.WATER_UI_URL || 'http://127.0.0.1:5175/superadmin/consumption')
    await page.getByRole('button', { name: 'View meters', exact: true }).first().waitFor().catch(async (error) => {
      console.log(await page.locator('body').innerText(), requests, errors)
      throw error
    })
    const visibleButtons = page.getByRole('button', { name: 'View meters', exact: true })
    assert.equal(await visibleButtons.count(), 2)
    assert.equal(await page.getByRole('button', { name: /Add reading|Sent Reminder/ }).count(), 0)
    await page.screenshot({ path: path.resolve(__dirname, '../../.tmp/part3-consumption-desktop.png'), fullPage: true })
    await visibleButtons.first().click()
    let drawer = page.getByRole('dialog', { name: 'View meters', exact: true })
    await drawer.getByRole('combobox', { name: 'Meter', exact: true }).waitFor()
    assert.equal(await drawer.locator('svg[role=img] circle').count(), 3)
    assert.equal(await drawer.locator('svg[role=img] polyline').count(), 2)
    await page.screenshot({ path: path.resolve(__dirname, '../../.tmp/part3-history-desktop.png'), fullPage: true })
    await drawer.getByRole('combobox', { name: 'Meter', exact: true }).click()
    await page.getByRole('option', { name: /Old bathroom/ }).click()
    assert.equal(await drawer.locator('svg[role=img] circle').count(), 1)
    assert.equal(await drawer.locator('svg[role=img] text').filter({ hasText: /^22$/ }).count(), 1)
    await drawer.getByRole('combobox', { name: 'Meter', exact: true }).click()
    await page.getByRole('option', { name: /New kitchen/ }).click()
    await drawer.getByText('No recorded readings', { exact: true }).waitFor()
    assert.equal(await drawer.locator('svg[role=img]').count(), 0)
    await drawer.getByRole('button', { name: 'Close', exact: true }).first().click()
    await drawer.waitFor({ state: 'hidden' })
    await visibleButtons.nth(1).click()
    drawer = page.getByRole('dialog', { name: 'View meters', exact: true })
    await drawer.getByText('Cold water - Old bathroom (Inactive)', { exact: true }).waitFor()
    assert.equal(await drawer.locator('svg[role=img] circle').count(), 1)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: path.resolve(__dirname, '../../.tmp/part3-history-mobile.png'), fullPage: true })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    const drawerBounds = await drawer.boundingBox()
    assert(drawerBounds.width <= 390)
    await drawer.getByRole('button', { name: 'Close', exact: true }).first().click()
    await drawer.waitFor({ state: 'hidden' })
    await page.setViewportSize({ width: 1440, height: 1000 })
    historyError = true
    await visibleButtons.first().click()
    await page.getByRole('dialog', { name: 'View meters', exact: true }).getByRole('alert').waitFor()
    historyError = false
    await page.getByRole('dialog', { name: 'View meters', exact: true }).getByRole('button', { name: 'Retry', exact: true }).click()
    await page.getByRole('combobox', { name: 'Meter', exact: true }).waitFor()
    await page.getByRole('dialog', { name: 'View meters', exact: true }).getByRole('button', { name: 'Close', exact: true }).click()
    await page.getByRole('dialog', { name: 'View meters', exact: true }).waitFor({ state: 'hidden' })
    delayHistory = true
    await visibleButtons.first().click()
    await page.getByRole('dialog', { name: 'View meters', exact: true }).getByRole('button', { name: 'Close', exact: true }).click()
    await page.getByRole('dialog', { name: 'View meters', exact: true }).waitFor({ state: 'hidden' })
    await visibleButtons.nth(1).click()
    await page.getByRole('dialog', { name: 'View meters', exact: true }).getByText('Cold water - Old bathroom (Inactive)', { exact: true }).waitFor()
    assert.equal(await page.getByRole('dialog', { name: 'View meters', exact: true }).locator('svg[role=img] circle').count(), 1)
    await page.getByRole('dialog', { name: 'View meters', exact: true }).getByRole('button', { name: 'Close', exact: true }).click()
    await page.getByRole('dialog', { name: 'View meters', exact: true }).waitFor({ state: 'hidden' })
    await page.getByRole('combobox', { name: 'Administrator', exact: true }).click()
    await page.getByRole('option', { name: 'Test administrator', exact: true }).click()
    await page.waitForResponse((response) => response.url().includes(`adminAccountId=${admin}`))
    await page.getByRole('combobox', { name: 'Block', exact: true }).click()
    assert.equal(await page.getByRole('option', { name: 'Block U', exact: true }).count(), 0)
    await page.getByRole('option', { name: 'Block A', exact: true }).click()
    await page.waitForResponse((response) => response.url().includes(`blockId=${block}`))
    await page.getByRole('combobox', { name: 'Administrator', exact: true }).click()
    await page.getByRole('option', { name: 'Unassigned', exact: true }).click()
    await page.waitForResponse((response) => response.url().includes('unassigned=true'))
    await page.getByText('Apartment 8 - Staircase 1', { exact: true }).first().waitFor()
    assert.equal(await page.getByRole('combobox', { name: 'Block', exact: true }).innerText(), 'All')
    await page.getByRole('combobox', { name: 'Block', exact: true }).click()
    assert.equal(await page.getByRole('option', { name: 'Block A', exact: true }).count(), 0)
    await page.getByRole('option', { name: 'All', exact: true }).click()
    reportError = true
    await page.getByRole('combobox', { name: 'Administrator', exact: true }).click()
    await page.getByRole('option', { name: 'All', exact: true }).click()
    await page.getByRole('alert').waitFor()
    reportError = false
    emptyReport = true
    await page.getByRole('button', { name: 'Retry', exact: true }).click()
    await page.getByText('No apartments found for the selected block and period.', { exact: true }).first().waitFor()
    assert.deepEqual(errors, [])
    console.log(`Passed: read-only actions, inactive meters, no meters, history gaps, single point, empty/error/retry, stale responses, admin/unassigned/block scope, desktop/mobile. ${requests.length} read-only fixture requests.`)
    await context.close()
  } finally { await browser.close() }
})().catch((error) => { console.error(error); process.exitCode = 1 })
