---
packageVersion: 1.0.0
packageId: core
---

# /plan Command

Create a new plan document for tracking work through guided discovery.

## Overview

Plans are structured markdown documents with YAML frontmatter that track features, initiatives, projects, and other work.

## Input Modes

### Mode 1: From Existing Idea
```
/plan idea:[idea_id]
```
Read `nimbalyst-local/tracker/ideas.md`, find the matching idea by ID, and use it as the starting point.

### Mode 2: New Idea
```
/plan [description]
```

## Discovery Process

Before generating the plan, gather the information needed to create a comprehensive and actionable plan.

1. **Analyze the idea/description** to identify what's unclear or underspecified
2. **Ask clarifying questions ONE AT A TIME** - determine what questions are needed based on the specific idea. Wait for each response before asking the next question.
3. **Continue until you have enough context** to write a clear, unambiguous plan with granular tasks
4. **Generate the plan** using the gathered context
5. **Ask for review**: "Does this capture what you're building? Any adjustments?"
6. **If from existing idea**: Offer to update the idea status to `planned` in ideas.md

## File Location and Naming

**Location**: `nimbalyst-local/plans/[descriptive-name].md`

**Naming conventions**:
- Use kebab-case: `user-authentication-system.md`, `marketing-campaign-q4.md`
- Be descriptive: The filename should clearly indicate what the plan is about

## Required YAML Frontmatter

```yaml
---
planStatus:
  planId: plan-[unique-identifier]
  title: [Plan Title]
  status: draft
  planType: feature
  priority: medium
  owner: [your-name]
  stakeholders: []
  tags: []
  created: "YYYY-MM-DD"
  updated: "YYYY-MM-DDTHH:MM:SS.sssZ"
  progress: 0
---
```

## Status Values

- `draft`: Initial planning phase
- `ready-for-development`: Approved and ready to start
- `in-development`: Currently being worked on
- `in-review`: Implementation complete, pending review
- `completed`: Successfully completed
- `rejected`: Plan has been rejected or cancelled
- `blocked`: Progress blocked by dependencies

## Plan Types

Common plan types:
- `feature`: New feature development
- `bug-fix`: Bug fix or issue resolution
- `refactor`: Code refactoring/improvement
- `system-design`: Architecture/design work
- `research`: Research/investigation task
- `initiative`: Large multi-feature effort
- `improvement`: Enhancement to existing feature

## Usage

When the user types `/plan [description]`:

1. Extract key information from the description
2. Generate unique `planId` from description (kebab-case)
3. Choose appropriate `planType` based on description
4. Set `created` to today's date, `updated` to current timestamp
5. Create file in `nimbalyst-local/plans/` with proper frontmatter
6. Include relevant sections based on plan type

## Best Practices

- Keep plans focused on a single objective
- Update progress regularly as work proceeds
- Use tags to categorize related plans
- Add stakeholders who need visibility
- Set realistic due dates when applicable
