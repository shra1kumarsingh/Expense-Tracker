from playwright.sync_api import sync_playwright
import time

APP_URL = 'http://localhost:8000'

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        print('Opening app...')
        page.goto(APP_URL)

        # Open registration
        page.click('text=Register')
        page.fill('#register-email', 'smoketest@example.com')
        page.fill('#register-password', 'password123')
        page.click('#registration-form button')
        page.wait_for_selector('#expense-tracker', timeout=3000)
        print('Registered and logged in.')

        # Add expense
        name = 'Playwright Test Expense'
        page.fill('#expense-name', name)
        page.fill('#expense-amount', '12.34')
        page.fill('#expense-date', '2025-12-01')
        # ensure category exists
        page.select_option('#expense-category', 'Food')
        page.click('#expense-save-btn')
        # wait for the list to include the expense
        page.wait_for_selector(f'text={name}', timeout=3000)
        print('Expense added.')

        # Edit expense: click Edit button inside the list item that contains the name
        li = page.locator('ul#expenses li', has_text=name).first
        edit_btn = li.get_by_text('Edit')
        edit_btn.click()
        page.wait_for_selector('#expense-id')
        # change amount
        page.fill('#expense-amount', '20.00')
        page.click('#expense-save-btn')
        page.wait_for_selector(f'text=$20.00', timeout=3000)
        print('Expense edited.')

        # Delete expense
        # Accept confirm dialog
        page.once('dialog', lambda dialog: dialog.accept())
        del_btn = page.locator('ul#expenses li', has_text=name).get_by_text('Delete').first
        del_btn.click()
        # ensure it's gone
        try:
            page.wait_for_selector(f'text={name}', timeout=2000)
            print('ERROR: Expense still present after delete')
            browser.close()
            return
        except Exception:
            print('Expense deleted.')

        # Set budget
        page.fill('#budget-limit', '100')
        page.click('#budget-section .btn-primary')
        time.sleep(0.5)
        print('Budget set.')

        # Add reminder with a past date to trigger immediate processing
        page.fill('#reminder-name', 'Monthly Subscription')
        page.fill('#reminder-amount', '9.99')
        # use a date in the past to ensure processing
        page.fill('#reminder-date', '2025-11-01')
        page.select_option('#reminder-frequency', 'Monthly')
        page.click('#reminder-section .btn')
        # after adding, the processReminders should create an expense; wait for it
        page.wait_for_selector('text=Monthly Subscription', timeout=4000)
        print('Reminder added and processed into expense list.')

        print('Smoke test completed successfully.')
        browser.close()

if __name__ == '__main__':
    run()
