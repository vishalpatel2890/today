---
packageVersion: 1.0.0
packageId: core
---

# /test-browser Command

Automate frontend test gate execution using browser automation via MCP claude-in-chrome tools.

## Usage

`/test-browser [story-id]`

**Examples:**
```
/test-browser 28-5
/test-browser 28-2
/test-browser 36-1
```

## What This Command Does

This command automates the manual testing process defined in story "Frontend Test Gate" sections:

1. **Reads** the story file from `notes/sprint-artifacts/[story-id]-*.md`
2. **Parses** the Frontend Test Gate section (Gate ID, Prerequisites, Test Steps, Success Criteria)
3. **Connects** to browser using MCP claude-in-chrome tools
4. **Executes** each test step with automated browser interactions
5. **Captures** screenshots throughout execution (especially on failures)
6. **Checks** for console errors and network failures
7. **Reports** detailed results in the conversation
8. **Updates** the story file with test execution results

## How to Use

1. Ensure the frontend is running at `localhost:5173`
2. Ensure you're logged in (browser session active)
3. Run `/test-browser [story-id]` where `[story-id]` matches the story number (e.g., `28-5`)
4. Watch as Claude executes each test step
5. Review the results summary and check the updated story file

## Command Execution Logic

When this command is invoked, follow these steps precisely:

### Step 1: Parse Story ID and Find Story File

1. Extract story ID from the command arguments (e.g., "28-5" from "/test-browser 28-5")
2. Use Glob tool to find the story file: `notes/sprint-artifacts/{story-id}-*.md`
3. If no file found:
   - List available story files with Frontend Test Gates
   - Show error message: "Story file not found for {story-id}. Available stories: ..."
   - Exit command
4. If found, read the complete story file

### Step 2: Extract Frontend Test Gate Section

1. Search for the `## Frontend Test Gate` heading in the story file
2. If not found:
   - Show message: "No Frontend Test Gate found in story {story-id}"
   - Exit command
3. Extract the entire section from `## Frontend Test Gate` until the next `##` heading or end of file

4. Parse the following subsections:

   **a) Gate ID:**
   - Look for `**Gate ID**: {value}` pattern
   - Extract the gate ID (e.g., "28-5-TG1")

   **b) Prerequisites:**
   - Find `### Prerequisites` section
   - Extract all checklist items `- [ ]` or `- [x]`
   - Store as list of prerequisite strings

   **c) Test Steps Table:**
   - Find `### Test Steps (Manual Browser Testing)` section
   - Parse markdown table with 4 columns: `Step | User Action | Where (UI Element) | Expected Result`
   - Skip header row and separator row
   - Extract each test step as structured data:
     ```
     {
       step_number: int,
       user_action: string,
       ui_element: string,
       expected_result: string
     }
     ```

   **d) Success Criteria:**
   - Find `### Success Criteria` section
   - Extract all checklist items
   - Store as list of success criterion strings

5. Display parsed test gate summary:
   ```
   📋 Frontend Test Gate: {gate-id}
   ✓ {n} Prerequisites
   ✓ {n} Test Steps
   ✓ {n} Success Criteria
   ```

### Step 3: Validate Prerequisites (Informational)

1. Display prerequisites to user:
   ```
   📋 Prerequisites:
   - [ ] Backend running locally with Redis available
   - [ ] Test user logged in with valid session
   ...
   ```
2. Ask user: "Are prerequisites met? Reply 'yes' to continue or 'no' to abort"
3. If user says 'no', exit command
4. If user says 'yes', continue

### Step 4: Initialize Browser Session

1. Call `mcp__claude-in-chrome__tabs_context_mcp` with `createIfEmpty: true`
   - This gets existing tab context or creates a new MCP tab group
2. Call `mcp__claude-in-chrome__tabs_create_mcp` to create a fresh test tab
3. Store the returned `tabId` for all subsequent browser operations
4. Call `mcp__claude-in-chrome__navigate` with:
   - `tabId`: The tab ID from step 2
   - `url`: "http://localhost:5173"
5. Call `mcp__claude-in-chrome__computer` with `action: "wait"`, `duration: 3` to allow page load
6. Call `mcp__claude-in-chrome__computer` with `action: "screenshot"` to capture initial state
7. Display message: "✅ Browser session started at localhost:5173"

### Step 5: Execute Test Steps

For each test step in the parsed test steps list:

1. **Display step header:**
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📍 Step {step_number}: {user_action}
   📍 Where: {ui_element}
   📍 Expected: {expected_result}
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

2. **Interpret user action** and map to browser commands:

   **Action Pattern Matching (in priority order):**

   a) **"Select a template"** or **"Choose"** or **"Pick"**:
      - Use `mcp__claude-in-chrome__find` with query from {ui_element}
      - Use `mcp__claude-in-chrome__computer` with `action: "left_click"` on found element
      - Wait 2 seconds
      - Take screenshot

   b) **"Observe"** or **"See"** or **"Check"** (passive observation):
      - Use `mcp__claude-in-chrome__read_page` to get page structure
      - Search for {ui_element} in the accessibility tree
      - Verify element exists and is visible
      - Take screenshot

   c) **"Click"** or **"Press"**:
      - Use `mcp__claude-in-chrome__find` with query from {ui_element}
      - Use `mcp__claude-in-chrome__computer` with `action: "left_click"`
      - Wait 1 second
      - Take screenshot

   d) **"Answer"** or **"Type"** or **"Enter"**:
      - Use `mcp__claude-in-chrome__find` with query "input" or {ui_element}
      - Use `mcp__claude-in-chrome__computer` with `action: "type"`, extract text from user_action
      - Use `mcp__claude-in-chrome__computer` with `action: "key"`, `text: "Enter"`
      - Wait 2 seconds
      - Take screenshot

   e) **"Navigate to"** or **"Go to"**:
      - Use `mcp__claude-in-chrome__navigate` with URL from user_action
      - Wait 2 seconds
      - Take screenshot

   f) **"Complete"** or multi-step action:
      - Break down into sub-actions
      - Execute each sub-action sequentially
      - Take screenshots at key points

   g) **"(Dev)"** prefix (development/technical action):
      - These are typically terminal commands or backend actions
      - Skip browser automation
      - Mark as "SKIPPED - Dev action"
      - Display message explaining why

3. **Verify expected result:**
   - After executing the action, use `mcp__claude-in-chrome__read_page` or screenshot
   - Compare actual outcome against {expected_result}
   - Determine status:
     - ✅ **PASS** - Action succeeded and expected result observed
     - ⚠️ **PARTIAL** - Action succeeded but expected result not fully met
     - ❌ **FAIL** - Action failed or expected result not met
     - ⏸️ **SKIPPED** - Step skipped (e.g., dev actions)

4. **Record step result:**
   - Status (PASS/FAIL/PARTIAL/SKIPPED)
   - Notes (brief description of what happened)
   - Screenshot ID (if captured)
   - Any error messages

5. **On FAIL or PARTIAL:**
   - Capture additional screenshot
   - Call `mcp__claude-in-chrome__read_console_messages` with `pattern: "error|fail|warning"`
   - Call `mcp__claude-in-chrome__read_network_requests` to check for 4xx/5xx errors
   - Record additional context in notes

6. **Display step result:**
   ```
   ✅ PASS: Template selection confirmed
   📸 Screenshot captured
   ```

7. Continue to next step (even if current step failed)

### Step 6: Check Success Criteria

After all test steps executed:

1. **Check console errors:**
   - Call `mcp__claude-in-chrome__read_console_messages` with:
     - `pattern: "error"`
     - `limit: 50`
   - Filter out known non-critical warnings (e.g., React Router future flags)
   - Determine: ✅ No errors or ❌ Errors found
   - Record details

2. **Check network errors:**
   - Call `mcp__claude-in-chrome__read_network_requests` with:
     - `limit: 100`
   - Filter for HTTP status codes 4xx and 5xx
   - Determine: ✅ No failures or ❌ Failures found
   - Record details

3. **Evaluate each success criterion:**
   - Cross-reference with test step results
   - Mark each criterion as met or not met
   - Example:
     ```
     - [x] Gathering flow works exactly as before refactor (Steps 1-5 passed)
     - [ ] Flexible input parsing still works correctly (Step 3 failed)
     - [x] No console errors in browser DevTools (0 errors found)
     ```

### Step 7: Generate Test Results Report

1. **Calculate overall status:**
   - ✅ **PASSED** - All steps passed, all criteria met
   - ⚠️ **PARTIAL** - Some steps failed but test completed
   - ❌ **FAILED** - Critical failures or multiple steps failed

2. **Display results summary in chat:**
   ```markdown
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 TEST EXECUTION COMPLETE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   **Gate ID:** 28-5-TG1
   **Status:** ⚠️ PARTIAL
   **Executed:** {current_date_time}

   ### Test Steps Results
   | Step | Status | Notes |
   |------|--------|-------|
   | 1 | ✅ PASS | Template selected successfully |
   | 2 | ✅ PASS | Questions appeared as expected |
   | 3 | ⚠️ PARTIAL | Response accepted but flow interrupted |
   | 4 | ⏸️ SKIPPED | Cannot test without step 3 completion |
   | 5 | ⏸️ SKIPPED | Cannot test without step 3 completion |

   ### Console Errors
   - ✅ No critical errors found
   - ⚠️ 2 warnings (React Router future flags - non-critical)

   ### Network Errors
   - ✅ No 4xx/5xx errors detected

   ### Success Criteria
   - [x] Gathering flow works exactly as before refactor
   - [ ] Flexible input parsing still works correctly (FAILED)
   - [x] Question batching still works correctly
   - [x] No console errors in browser DevTools
   - [x] No network request failures (4xx/5xx)

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

3. **Create results markdown section:**
   - Format according to plan (see Step 5 in plan for format)
   - Include execution date, test gate ID, overall status
   - Include test execution table with all steps
   - Include console errors section
   - Include network errors section
   - Include prerequisites status (checked)
   - Include success criteria status

### Step 8: Update Story File

1. **Read the current story file** again (in case it changed)
2. **Check if results section already exists:**
   - Search for `## Frontend Test Gate Results` heading
   - If exists, ask user: "Results section already exists. Overwrite? (yes/no)"
   - If user says 'no', skip update and just display results
3. **Append or replace results section:**
   - If no existing section: append at the end of the file
   - If replacing: replace entire `## Frontend Test Gate Results` section
4. **Write updated content back to story file**
5. **Display confirmation:**
   ```
   ✅ Test results saved to: notes/sprint-artifacts/{story-id}-{name}.md
   ```

### Step 9: Cleanup and Completion

1. Display final message:
   ```
   ✅ Frontend test gate execution complete!

   Summary:
   - Story: {story-id}
   - Gate: {gate-id}
   - Status: {overall-status}
   - Steps Executed: {completed}/{total}
   - Steps Passed: {passed}
   - Steps Failed: {failed}

   📄 Full results saved to story file.
   📸 Screenshots captured for each step.
   ```

2. Optionally close the test tab (ask user first if they want to keep it open for inspection)

## Error Handling

### Story File Not Found
- Message: "❌ Story file not found for '{story-id}'"
- List available story files: Use Glob `notes/sprint-artifacts/*.md` and display first 10
- Suggest: "Available stories with test gates: 28-5, 28-2, 25-1, ..."

### No Frontend Test Gate Section
- Message: "❌ Story {story-id} does not have a Frontend Test Gate section"
- Suggest: "This story may not require browser testing, or the test gate hasn't been created yet."

### Browser Extension Not Connected
- Message: "❌ Browser extension not connected. Please ensure Claude-in-Chrome extension is installed and connected."
- Provide link: "https://claude.ai/chrome"
- Exit command

### Localhost Not Running
- If navigation to localhost:5173 fails:
- Message: "❌ Unable to connect to localhost:5173. Please ensure the frontend is running."
- Suggest: "Run 'npm run dev' in the frontend directory."
- Ask: "Retry connection? (yes/no)"

### Element Not Found
- If `find` tool cannot locate element:
- Message: "⚠️ Could not locate element: {ui_element}"
- Take screenshot for debugging
- Mark step as FAIL
- Continue to next step

### Test Step Timeout
- If step takes longer than 30 seconds:
- Message: "⚠️ Step {step_number} timed out after 30 seconds"
- Capture screenshot
- Mark as FAIL
- Continue to next step

## Notes and Best Practices

1. **Always capture screenshots** - They're invaluable for debugging failures
2. **Continue on failure** - Don't stop at first failure; complete all steps for comprehensive results
3. **Check prerequisites** - Ensure user confirms prerequisites before starting
4. **Console/network checks** - These are critical success criteria; always check them
5. **Update story file** - Results must be saved for tracking and history
6. **Clear communication** - Display progress and results clearly in chat
7. **Handle dev actions** - Skip browser automation for "(Dev)" prefixed steps

## Limitations

- Requires browser extension connected (mcp__claude-in-chrome)
- Assumes localhost:5173 is running and accessible
- Expected results are interpreted manually (not programmatic assertions)
- Cannot auto-fix failures (debugging is manual)
- Screenshot filenames are auto-generated (not customizable)
- Single story execution at a time (no batch mode)

## Future Enhancements

- Support for multiple story IDs in one command
- Generate reusable Playwright Python scripts from test executions
- Video recording of test execution
- Headless mode for CI/CD integration
- Auto-retry failed steps with configurable retry count
- Test gate result history and comparison across runs
- Custom screenshot naming and organization
