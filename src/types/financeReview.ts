import type { MaintenanceReport } from './finance'

export type ReviewOutcome = 'Approved' | 'Rejected'
export type ReviewStatus = 'Draft' | 'Submitted' | 'Resubmitted' | ReviewOutcome | 'Unsupported'
export type FinanceReviewCycle = {
  id: string; runId: string; revision: number; cycle: number; submittedAt: string; status: ReviewStatus
  rule: string; ruleVersion: number; reviewers: { userId: string; assignmentId: string }[]
  reason?: string | null; decidedAt?: string | null; decidedByUserId?: string | null
}
export type FinanceReviewState = {
  version: string; status: ReviewStatus; isCurrent: boolean; isLatestRevision: boolean
  censorRequired: boolean; censorAssignmentId?: string | null
  canSubmit: boolean; canResubmit: boolean; canPublish: boolean; canDecide: boolean; history: FinanceReviewCycle[]
}
export type FinanceReviewDetail = { submissionId: string; report: MaintenanceReport; submission: FinanceReviewCycle }
export type FinanceReviewListItem = { id: string; runId: string; blockId: string; blockName: string; year: number; month: number; revision: number; cycle: number; status: ReviewStatus; submittedAt: string; totalDue: number }
export type FinanceReviewList = { items: FinanceReviewListItem[]; totalCount: number; pageNumber: number; pageSize: number }
export type ReviewReceipt = { eventId: string; submissionId: string; runId: string; cycle: number; outcome: ReviewStatus; reason?: string | null }
export type SubmitReviewRequest = { requestId: string; expectedInputVersion: string; expectedReviewVersion: string; expectedCensorAssignmentId: string }
export type DecideReviewRequest = { requestId: string; outcome: ReviewOutcome; reason?: string | null; expectedInputVersion: string; expectedReviewVersion: string }
export type BlockCensor = { blockId: string; assignmentId?: string | null; personId?: string | null; userId?: string | null; fullName?: string | null }
export type CensorCandidate = { personId: string; fullName: string; hasRegisteredAccount: boolean; email?: string | null; apartments: string[] }
export type SaveBlockCensor = {
  mode: 'External' | 'Resident' | 'Remove'; expectedAssignmentId?: string | null; confirmReplacement: boolean
  personId?: string; email?: string
  externalPerson?: { firstName: string; lastName: string; email: string; phone?: string | null; status: 'active'; invitePerson: true }
}
