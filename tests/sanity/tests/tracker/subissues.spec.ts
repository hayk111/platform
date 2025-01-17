import { test } from '@playwright/test'
import { allure } from 'allure-playwright'
import { IssuesPage } from '../model/tracker/issues-page'
import { generateId, PlatformSetting, PlatformURI } from '../utils'
import {
  checkIssue,
  checkIssueDraft,
  createIssue,
  DEFAULT_STATUSES,
  DEFAULT_USER,
  fillIssueForm,
  navigate
} from './tracker.utils'
import { Issue, NewIssue } from '../model/tracker/types'
import { LeftSideMenuPage } from '../model/left-side-menu-page'
import { IssuesDetailsPage } from '../model/tracker/issues-details-page'

test.use({
  storageState: PlatformSetting
})
test.describe('Tracker sub-issues tests', () => {
  test.beforeEach(async ({ page }) => {
    await allure.parentSuite('Tracker tests')
    await (await page.goto(`${PlatformURI}/workbench/sanity-ws`))?.finished()
  })

  test('create sub-issue', async ({ page }) => {
    await navigate(page)

    const props = {
      name: `issue-${generateId(5)}`,
      description: 'description',
      status: DEFAULT_STATUSES[1],
      priority: 'Urgent',
      assignee: DEFAULT_USER
    }
    await navigate(page)
    await createIssue(page, props)
    await page.click('text="Issues"')

    const issuesPage = new IssuesPage(page)
    await issuesPage.modelSelectorAll.click()
    await issuesPage.searchIssueByName(props.name)
    await issuesPage.openIssueByName(props.name)

    await checkIssue(page, props)
    props.name = `sub${props.name}`
    await page.click('button:has-text("Add sub-issue")')
    await fillIssueForm(page, props)
    await page.keyboard.press('Escape')
    await page.keyboard.press('Escape')

    await page.locator('#new-issue').click()
    await checkIssueDraft(page, props)
  })

  test('Edit a sub-issue', async ({ page }) => {
    const newIssue: NewIssue = {
      title: `Issue for the sub-issue-${generateId()}`,
      description: 'Description Issue for the sub-issue'
    }
    const newSubIssue: NewIssue = {
      title: `New Sub-Issue with parameter-${generateId()}`,
      description: 'New Description Sub-Issue with parameter'
    }
    const editSubIssue: Issue = {
      status: 'In Progress',
      priority: 'Urgent',
      assignee: 'Appleseed John',
      createLabel: true,
      labels: `EDIT-SUB-ISSUE-${generateId()}`,
      component: 'No component',
      estimation: '8',
      milestone: 'No Milestone',
      duedate: 'today',
      filePath: 'cat.jpeg'
    }

    const leftSideMenuPage = new LeftSideMenuPage(page)
    await leftSideMenuPage.buttonTracker.click()

    const issuesPage = new IssuesPage(page)
    await issuesPage.modelSelectorAll.click()
    await issuesPage.createNewIssue(newIssue)
    await issuesPage.searchIssueByName(newIssue.title)
    await issuesPage.openIssueByName(newIssue.title)

    const issuesDetailsPage = new IssuesDetailsPage(page)
    await issuesDetailsPage.buttonAddSubIssue.click()

    await issuesPage.fillNewIssueForm(newSubIssue)
    await issuesPage.buttonCreateIssue.click()
    await issuesDetailsPage.openSubIssueByName(newSubIssue.title)

    await issuesDetailsPage.waitDetailsOpened(newSubIssue.title)
    await issuesDetailsPage.editIssue(editSubIssue)
    await issuesDetailsPage.checkIssue({
      ...newSubIssue,
      ...editSubIssue,
      milestone: 'Milestone',
      estimation: '1d',
      parentIssue: newIssue.title
    })
  })

  test('Delete a sub-issue', async ({ page }) => {
    const deleteIssue: NewIssue = {
      title: `Issue for the delete sub-issue-${generateId()}`,
      description: 'Description Issue for the delete sub-issue'
    }
    const deleteSubIssue: NewIssue = {
      title: `Delete Sub-Issue with parameter-${generateId()}`,
      description: 'Delete Description Sub-Issue with parameter'
    }

    const leftSideMenuPage = new LeftSideMenuPage(page)
    await leftSideMenuPage.buttonTracker.click()

    const issuesPage = new IssuesPage(page)
    await issuesPage.modelSelectorAll.click()
    await issuesPage.createNewIssue(deleteIssue)
    await issuesPage.searchIssueByName(deleteIssue.title)
    await issuesPage.openIssueByName(deleteIssue.title)

    const issuesDetailsPage = new IssuesDetailsPage(page)
    await issuesDetailsPage.buttonAddSubIssue.click()

    await issuesPage.fillNewIssueForm(deleteSubIssue)
    await issuesPage.buttonCreateIssue.click()
    await issuesDetailsPage.openSubIssueByName(deleteSubIssue.title)

    await issuesDetailsPage.waitDetailsOpened(deleteSubIssue.title)
    await issuesDetailsPage.checkIssue({
      ...deleteSubIssue,
      parentIssue: deleteIssue.title
    })

    await issuesDetailsPage.moreActionOnIssue('Delete')
    await issuesDetailsPage.pressYesForPopup(page)

    await issuesPage.searchIssueByName(deleteSubIssue.title)
    await issuesPage.checkIssueNotExist(deleteSubIssue.title)
  })
})
