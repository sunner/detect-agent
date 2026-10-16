# Desktop environment marker evidence

Recorded on 2026-10-16. WorkBuddy, Grok Bot and QoderWork-family rules below are
based on static inspection of installed macOS distribution artifacts. No agent
was launched and no real environment values, user configuration or session
contents were collected for these tests. Locations refer to the packaged files,
including minified line numbers, not unpublished source repositories. The
synthetic test cases do not establish coverage of every platform or execution mode.

## WorkBuddy

Inspected WorkBuddy 5.8.3, bundle ID `com.tencent.workbuddy.mac`.

- `Contents/Resources/app.asar` SHA-256:
  `a7eff702411704d140d7d8d706fe9e711d9b13e304928481c9eba0af9c06f731`.
- Inside that archive, `main/main-bootstrap.js:77` (`buildDaemonProcessEnv`)
  constructs `WORKBUDDY_APPLICATION_NAME`, `WORKBUDDY_APP_NAME` and
  `WORKBUDDY_IS_PACKAGED`; the daemon spawn at line 75 merges this object into
  the inherited environment. `main/sidecar-manager.js:16`
  (`buildSidecarProcessEnv`) also preserves inherited variables for its spawn.
- `Contents/Resources/app.asar.unpacked/cli/dist/codebuddy-lite-wb.mjs` SHA-256:
  `9eacdcdaaf3d53877ca4eac53836a446770b9a40f5dc6382b43230c73fdc5448`.
  Its `buildChildProcessEnv` at line 1684 supplies the ordinary shell and PTY
  spawn environments. The intervening cleanup at line 1819 removes trace/request
  fields rather than these product-name markers. The sandbox path at line 1134
  carries the target environment in an execution request; native sandbox
  propagation was not dynamically tested.

The rule accepts exact `WorkBuddy` in either complete product-name key. It does
not accept the unprefixed `APPLICATION_NAME` / `APP_NAME`, packaging flags, or
configuration directories alone. Renamed or branded variants may not match.
The public [product guide](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Product-Guide)
describes the product, but does not establish these markers as a stable public API.

## Grok Bot

Inspected Grok Bot 0.71.2, bundle ID `com.anysphere.sand`.

- `Contents/Resources/app.asar` SHA-256:
  `055b087a9bacc3be4e5f80c468edf2fd031dd5b928ab2e7da7e01dd10de0e860`.
- `dist/local-exec-daemon/main.cjs:756` (`iZe`) supplies both `SAND_AGENT=1`
  and `CURSOR_AGENT=1` to the local executor. Line 611 (`pI`) passes this
  environment to the Bash initialization at line 602 (`Jae`) and the Zsh
  initialization at line 608 (`Wae`), which merge it into the child environment.

The local branch requires exact `SAND_AGENT=1` and precedes Cursor rules.
`CURSOR_AGENT` alone is shared compatibility context and is not an alternative
Grok Bot marker. The static evidence covers the described local shell path,
not complete cloud or PowerShell behavior. The [public architecture documentation](https://cursor.com/docs/grok-bot/teams#architecture)
distinguishes the cloud service from the local execution daemon. Grok Bot has a
separate result from Grok Build.

A separate user-provided ordinary-shell observation on **2026-10-16** reported
a Grok Bot cloud context with `CURSOR_AGENT` and the exact flags
`SAND_MANIFEST_V2=1` and `SAND_SUPERVISOR_ENABLED=1`, without `SAND_AGENT`.
The cloud branch requires all three conditions together. The infrastructure
flags alone and `CURSOR_AGENT` alone do not match this branch. This observation
was not reproduced by launching the cloud environment for this contribution.
These shared markers do not establish exclusive brand ownership or resolve
nested agents' immediate identity. No tenant, authentication, store, boot or VNC
identifier is used by the rule or included in the fixtures.

## QoderWork family

The inspected distribution was **QwenWorkCN 1.2.5**, bundle ID
`cn.qwenwork.desktop.mac`, which retains QoderWork runtime naming.

- `Contents/Resources/app.asar` SHA-256:
  `d946457e5e3d7761f7203111775388d5131293a337bf13430e0c26b8993536fb`.
- `out/main/main.js:654` (`composeQoderAgentSdkRuntimeEnv`) supplies
  `QODERWORK_IS_CN=true`. Workspace Bash at line 11824 and background Bash at
  line 11838 supply `QODERWORK_SOURCE_CHAT_ID`, with the distribution marker
  when applicable.
- `ShellExecutionService` at lines 2313–2316 forwards the request environment
  to `QxcSeatbeltBackend.runBash` at line 1048 and its child-process spawn.
  The target-environment filtering at line 888 retains these two marker names.
  The VM command builder at line 1412 also exports them on applicable paths;
  the VM was not started for this inspection.

The rule accepts a non-empty `QODERWORK_SOURCE_CHAT_ID` or exact
`QODERWORK_IS_CN=true`, returning only `qoderwork`. It does not infer region,
commercial branding, or model identity, and does not claim independent
inspection of every QoderWork/QwenWork distribution. Fixtures use a synthetic
chat ID. The [QwenWork introduction](https://qwenwork.cn/docs/product-introduction)
identifies the inspected brand; the [QoderWork hooks documentation](https://docs.qoder.com/qoderwork/hooks)
does not establish these markers for hook invocations.

## Cue

A user-provided Linux desktop-worker runtime observation on **2026-10-16**
identified Cue with `MANUS_LONG_DESKTOP_WORKER=1`. The variable prefix does not
establish a Manus product identity: the rule returns `cue` and accepts only
that exact value.
This observation was not reproduced by launching Cue during this contribution;
no inspected application version or artifact hash is claimed. Other `MANUS_`
path, endpoint or identifier variables are not independent detection conditions.
No real desktop identifier, path or endpoint is included in the evidence or tests.

## Muse

User-provided runtime observations on **2026-10-16** identified
`JARVIS_IS_ASSIGNED=1` in Muse's active-agent context and a non-empty
`JARVIS_TOOL_CALL_ID` during a tool call. Either condition identifies the
reported Muse context. The active-agent value must be exact `1`; the tool-call
ID is checked only for non-emptiness and is never reported by this detector.
Other instance, session, tier, timezone or region fields do not independently
match. These observations were not reproduced by launching Muse for this
contribution, and no inspected application version or artifact hash is claimed.
Fixtures use synthetic tool-call identifiers, never real runtime IDs.

## ManusStudio

A user reported the marker names `MANUS_ADDON_RUNTIME_SPEC_PATH` and
`MANUS_ADDON_RUNTIME_SPECS_REVISION` in an ordinary shell on **2026-10-16**,
without providing their values. The conditions treat them as addon-runtime
descriptors and conservatively require non-empty values, returning `manus-studio`.
This is user-reported shell evidence, not a locally reproduced shell probe or
validation of ManusStudio 2.0.7. The separate local static review did not confirm
these marker names or their propagation. No `ENABLED` value is guessed.
Tests use synthetic descriptor values; no real spec path or revision is recorded.

## Grok Build terminal marker

Public source at commit `2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8`
[documents the dual use of `GROK_AGENT`](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-tools/src/util/env.rs#L31):
the terminal-child marker is exact `1`, while other values can select an agent.
Both the [ordinary terminal path](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-tools/src/computer/local/terminal.rs#L3315)
and the [sandbox command path](https://github.com/xai-org/grok-build/blob/2bdd1d6a6369de0e8c68132ea4539e9abd9e14a8/crates/codegen/xai-grok-tools/src/computer/local/terminal.rs#L3391)
apply that marker. This extends the existing `grok` result without treating
arbitrary non-empty selector values as a match.

All of these markers can be set or inherited by other processes. They identify
environment context, not an authenticated immediate caller. Existing override
and first-match behavior still apply when several contexts coexist.
