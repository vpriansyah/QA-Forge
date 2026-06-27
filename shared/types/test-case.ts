// ═══════════════════════════════════════════════════════════
// QA Forge — Test Case Types
// ═══════════════════════════════════════════════════════════

/**
 * Test case as stored in the library (database entity)
 */
export interface TestCase {
  /** UUID primary key */
  id: string;
  /** Session that generated this test case */
  session_id: string;
  /** Test case ID in format TC-{slug}-{number} */
  tc_id: string;
  /** Short imperative title */
  title: string;
  /** Scenario type */
  type: TestCaseType;
  /** Priority level */
  priority: TestCasePriority;
  /** Approval status */
  status: TestCaseLibraryStatus;
  /** Full test case content (Gherkin steps, preconditions, etc.) */
  content: TestCaseContent;
  /** Coverage score from reviewer */
  coverage_score?: number;
  /** Tags for filtering */
  tags?: string[];
  /** ISO timestamp */
  created_at: string;
  /** ISO timestamp */
  updated_at: string;
}

export type TestCaseType = 'happy_path' | 'edge_case' | 'negative';
export type TestCasePriority = 'P1' | 'P2' | 'P3' | 'P4';
export type TestCaseLibraryStatus = 'generated' | 'approved' | 'rejected' | 'archived';

export interface TestCaseContent {
  preconditions: string[];
  steps: string[];
  expected_result: string;
  test_data: Record<string, string>;
}

export interface TestCaseFilters {
  project_id?: string;
  session_id?: string;
  type?: TestCaseType;
  priority?: TestCasePriority;
  status?: TestCaseLibraryStatus;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}
