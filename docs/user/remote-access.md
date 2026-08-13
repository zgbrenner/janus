# Remote Access

Use this when you want to connect to a Janus environment from another device, such as a browser on
another computer, a phone or tablet browser, or a second Janus desktop install.

Janus ships as a desktop app that bundles its own server. That server normally listens only on the
machine it runs on. To reach it from somewhere else, turn on network access and pair the other
device with a one-time pairing link.

## Recommended Setup

Use a trusted private network that meshes your devices together, such as a tailnet.

That gives you:

- a stable address to connect to
- transport security at the network layer
- less exposure than opening the server to the public internet

## Enabling Network Access

There are two ways to reach a Janus environment from another device: expose the desktop app's
backend on the network, or have the desktop app launch Janus on another machine over SSH.

### Option 1: Desktop App

If you are already running the desktop app and want to make it reachable from other devices:

1. Open **Settings** → **Connections**.
2. Under **This environment**, toggle **Network access** on. This will restart the app and run the backend on all network interfaces.
3. The settings panel will show the default reachable endpoint, with a `+N` control when more endpoints are available. Expand it to inspect alternatives such as loopback, LAN, private-network, or HTTPS endpoints.
4. Use **Create link** to generate a pairing link you can share with another device.

The default endpoint controls the QR code and primary copy action for pairing links. You can change it from the expanded endpoint list. The preference is stored by endpoint type, so choosing the local LAN endpoint survives normal IP address changes when you move between networks.

When no user default is saved, the app uses the built-in LAN endpoint for pairing links when
available. You can set another endpoint as the default from the expanded endpoint list.

- Non-loopback HTTP endpoints are useful for direct LAN pairing.
- Loopback-only endpoints are not useful for another device unless that device is the same machine.

Open the pairing link on the other device:

- scan the QR code from a phone or tablet and open the link in its browser
- open the link in a browser on another computer that can reach the address
- in another Janus desktop app, open **Settings** → **Connections**, choose **Add environment** → **Remote link**, and paste the full pairing URL — it fills the **Host** and **Pairing code** fields automatically

If the copied link points at a LAN address such as `http://192.168.x.y:3773`, open it from a device
on the same network that can reach that address.

### Tailscale Endpoints

When the desktop app can detect Tailscale, it adds Tailnet endpoints to the reachable endpoint list.

Depending on your Tailscale setup, this may include:

- the machine's `100.x.y.z` Tailnet IP
- a MagicDNS name
- an HTTPS MagicDNS endpoint when Tailscale Serve is configured for this backend

The Tailscale HTTPS endpoint uses the clean MagicDNS URL, such as
`https://machine.tailnet.ts.net/`, and is off until you opt in. Turn on **Enable Tailscale HTTPS**
on the **Tailscale HTTPS** row in **Settings** → **Connections**. The desktop app restarts the
backend, then the server asks Tailscale Serve to proxy HTTPS traffic to the local backend. Turn the
same switch off to stop it.

The Tailscale support is an endpoint provider add-on. The core remote model still works without Tailscale: LAN HTTP endpoints, custom HTTPS endpoints, and SSH-launched environments all use the same saved environment and pairing flow.

### Option 2: Desktop-Managed SSH Launch

Use this when you want the desktop app to start or reuse Janus on another machine over SSH.

1. Open **Settings** → **Connections**.
2. Under **Remote environments**, choose **Add environment**.
3. Select **SSH**.
4. Enter the SSH host or alias, such as `example.com` or an entry from your SSH config, along with the username and port if needed.
5. Confirm the launch. The desktop app probes the host, starts or reuses a remote Janus server, opens a local port forward, and saves the environment.

After setup, the desktop app connects to a local forwarded HTTP/WebSocket endpoint. The remote host still owns the actual Janus server, workspaces, files, git state, terminals, and provider sessions.

SSH launch is a desktop feature because it needs local process and SSH access. Once the environment is paired and saved, it uses the same environment list and connection model as direct LAN, Tailscale, or HTTPS environments.

#### SSH Launch Troubleshooting

The desktop SSH launcher connects with a non-interactive `sh` session, writes a small launcher script under `~/.t3/ssh-launch/<host-key>/` on the remote host, starts or reuses a remote Janus server, and forwards the remote loopback port back to your desktop.

The remote host must have a compatible Node.js runtime. Janus requires a Node.js version in this range:

```text
^22.16 || ^23.11 || >=24.10
```

During SSH launch, Janus first checks whether `node` is on `PATH`. If it is missing, the launcher
looks in the usual install directories and tries to activate a version manager if it finds one
(Volta, asdf, mise, fnm, nodenv, nvm). That covers most setups, but a version manager that only
initializes from an interactive shell profile will not be picked up.

If launch fails with `node: command not found`, a port-scan failure, or a message that the remote Node version does not satisfy the required range, SSH into the host and check the same non-interactive shell path Janus uses:

```bash
ssh user@example.com 'sh -lc "command -v node && node --version"'
```

If that does not print a compatible Node version, configure your version manager for non-interactive shells or install a compatible Node binary in one of the searched locations. For example, with nvm you may need a default alias:

```bash
nvm alias default 24
```

With mise, asdf, fnm, or nodenv, make sure the tool's shim directory is installed and resolves to a Node version satisfying the range above without an interactive shell.

If reconnecting after an app update fails, retry the SSH launch once. The launcher compares its generated runner script, stops stale launcher-managed remote servers, clears the SSH launch PID/port state, and starts a fresh remote server. You should not normally need to delete `~/.t3/ssh-launch` on the remote host or stop remote server processes manually.

## Updating a Remote Server

When the Janus app and a remote server use different versions, a warning appears in the
conversation and in **Settings** → **Connections**. Follow the action shown there: Janus may be
able to update and reconnect the server for you, or it may ask you to update the desktop app on
that machine or install the release from a copied download link.

Finish active work before updating because the server restarts briefly. For step-by-step guidance,
see [Keeping Janus Up to Date](./updating.md).

## How Pairing Works

The remote device does not need a long-lived secret up front.

Instead:

1. Creating a pairing link issues a one-time owner pairing token.
2. The remote device exchanges that token with the server.
3. The server creates an authenticated session for that device.

After pairing, future access is session-based. You do not need to keep reusing the original token unless you are pairing a new device.

## Managing Access Later

Manage access from **Settings** → **Connections** on the machine that hosts the environment.

Typical uses:

- use **Create link** to issue additional pairing links
- inspect active pairing links and client sessions under **Authorized clients**
- use **Revoke** to invalidate a pairing link or disconnect a client session you no longer trust

## Security Notes

- Treat pairing URLs and pairing tokens like passwords.
- Prefer sharing endpoints on a trusted private network, such as a Tailnet IP, instead of exposing the server broadly.
- Anyone with a valid pairing credential can create a session until that credential expires or is revoked.
- Pairing links keep the credential in the URL hash, but it can still be exposed through browser history, screenshots, logs, or copy/paste.
- Revoke pairing links or client sessions you no longer trust from **Settings** → **Connections**.
