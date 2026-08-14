# Your First Task

This guide assumes you have [installed Janus](./install.md) and authenticated at least one
provider. It walks through one complete task: pick a folder, describe what you want, watch the
agent work, review the result, and start the next one.

## Choose a Workspace

A workspace is a folder on your computer that Janus works inside. It can hold anything —
documents, research notes, data, or code. The agent reads and writes files in that folder and
nowhere else by default.

The first time you open Janus, the main screen says **Choose a workspace to begin** with an
**Add workspace** button. Select it, then browse to a folder or type a path.

You can add more workspaces at any time from the Command Palette (`Cmd/Ctrl + K`) →
**Add workspace**. The same flow can clone a hosted repository instead of using a local folder —
see [Source control integrations](./source-control.md).

## Describe the Outcome

With a workspace selected, Janus opens a draft task: a headline asking what you would like to
accomplish, a row of task starters, and the message composer. The starters — **Synthesize
research**, **Prepare a brief**, **Organize files**, **Analyze data**, and **Build or fix
software** — fill the composer with a ready-made prompt you can edit before sending.

Write what you want as an outcome, not a list of steps: "summarize the interviews in this
folder into one page" works better than micromanaging how to get there.

The composer footer holds two controls worth knowing before your first send:

- The model picker shows the current provider and model; select it to switch.
- The mode control sets the [permission mode](./permission-modes.md) — how much the agent does
  on its own before stopping to ask you, from **Supervised** to **Full access**.

Send the message and the task begins.

## Supervise Progress

While the task runs, the conversation shows the agent's progress as it happens: narrated work
updates interleaved with a log of tool activity — files read, commands run, edits made. Long
stretches collapse automatically; expand them if you want the detail.

The agent may stop and ask for your input:

- **Approvals.** In modes that require them, the agent shows the exact command or edit it wants
  to make. Choose **Approve once**, **Always allow this session**, **Decline**, or
  **Cancel turn**.
- **Questions.** When the agent needs a decision, it presents options you can click (or pick
  with the number keys), or you can write your own answer instead.

To halt the agent mid-turn, use the stop button that replaces the send button while the task is
running (labeled **Stop generation**). You can then redirect it with a new message.

## Review the Result

When a turn finishes, a card under the response lists what changed — for example
**3 changed files**. Select **Show files** to see the list, or **Open diff** to inspect a diff:
a before/after view of every changed file. The files themselves are real files in your
workspace folder on disk, so you can also open them in any other app.

Every turn also ends with a checkpoint — a saved snapshot of the workspace at that point. If a
turn went the wrong way, hover over one of your earlier messages and select
**Revert to this message**; Janus confirms with **Revert this task to checkpoint N** and
restores the workspace files to that point. Reverting is how you undo agent work safely, so
experiment freely.

## Keep Going

When a task is done, settle it: choose **Settle task** from the task's context menu in the
sidebar. Settled tasks move out of your active list but keep their full history — you can
reopen one with **Un-settle task**.

Start the next task with the **New task** button in the sidebar. Each task is its own
conversation with its own permission mode and its own checkpoints, so keep tasks small and
focused rather than running one forever.

## Next Steps

- [Permission modes](./permission-modes.md): choosing how much the agent asks first
- [Organizing tasks](./thread-sidebar.md): pinning and arranging the sidebar
- [Keeping Janus up to date](./updating.md): automatic and manual updates
