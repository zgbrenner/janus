# Keeping Janus Up to Date

The Janus desktop app updates itself from
[GitHub Releases](https://github.com/zgbrenner/janus/releases). The app bundles its own local
server, so updating the app updates everything on that machine.

## Automatic Updates

When a new release is available, an **Update available** pill appears in the sidebar.

1. Select **Update available** to download the update. The pill shows download progress.
2. When the download finishes, the pill changes to **Restart to update**. Select it and
   confirm.
3. Janus restarts into the new version.

Installing the update restarts Janus and interrupts any running tasks, so let active work
finish first; the confirmation dialog reminds you before anything restarts.

On Windows, Janus may remain closed for several minutes while the update installs, and no
installer window may appear. Janus reopens automatically when installation finishes.

You can dismiss the pill until the next launch. Dismissing it does not install anything — the
update stays available from **Settings**.

## Checking Manually

**Settings** → **About** shows the current version alongside a **Check for Updates** button.
When an update is available, the same button offers **Download** and then **Install**.

## Updating Manually

You can always download the newest release from
[GitHub Releases](https://github.com/zgbrenner/janus/releases) and install it over your
current version. See [Install Janus](./install.md) for the per-platform steps, the
first-launch security prompts, and how to verify the download. Updating does not remove your
saved tasks, settings, or workspace files.

## Intel Build on Apple Silicon

If the Intel (`x64`) build is running on an Apple Silicon Mac, it runs under Rosetta and Janus
shows a warning in the sidebar. Install the available update when offered, or download the
`arm64` build from [GitHub Releases](https://github.com/zgbrenner/janus/releases) and install
it in place of the Intel build.

## Connected Servers on Other Machines

If you connect to a Janus server running on another machine and the versions do not match,
Janus shows a warning with the right update option for that server. It appears in either of
these places:

- above the message box in the current conversation
- **Settings** → **Connections**, beside the affected connection

Because the server is managed by the desktop app on that machine, the fix is to open Janus
there and install the app update, then reopen it if needed. Janus does not update connected
servers silently in the background.
