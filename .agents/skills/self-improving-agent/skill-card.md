## Description:

Captures learnings, errors, and corrections to enable continuous improvement. Use when: (1) A command or operation fails unexpectedly, (2) User corrects Claude ('No, that's wrong...', 'Actually...'), (3) User requests a capability that doesn't exist, (4) An external API or tool fails, (5) Claude realizes its knowledge is outdated or incorrect, (6) A better approach is discovered for a recurring task. Also review learnings before major tasks.

This skill is ready for commercial/non-commercial use.

## Publisher:

[pskoett](https://clawhub.ai/user/pskoett)

### License/Terms of Use:

MIT-0

## Use Case:

Developers and agent users use this skill to capture corrections, command failures, feature requests, outdated knowledge, and reusable best practices in workspace learning files. OpenClaw users can also opt into a hook that reminds agents to review learnings and sweeps ended sessions for possible errors.

### Deployment Geography for Use:

Global

## Known Risks and Mitigations:

Risk: The optional hook may read ended session transcripts and persist excerpts in .learnings, with only best-effort redaction.

Mitigation: Enable the hook only in trusted workspaces, keep .learnings out of version control, and review captured entries before sharing or promotion.

Risk: Automatically detected errors can include false positives or incomplete context.

Mitigation: Triage pending sweep entries before keeping them, promoting them, or converting them into workspace guidance.

Risk: Uninstall or cleanup commands can delete .learnings, which is user data.

Mitigation: Review or archive .learnings before running deletion commands.

## Reference(s):

- [ClawHub skill page](https://clawhub.ai/pskoett/skills/self-improving-agent)
- [OpenClaw integration guide](references/openclaw-integration.md)
- [Uninstall guide](references/uninstall.md)
- [Examples](references/examples.md)

## Skill Output:

**Output Type(s):** [Markdown, Files, Shell commands, Configuration, Guidance]

**Output Format:** [Markdown entries with inline shell commands and configuration snippets]

**Output Parameters:** [1D]

**Other Properties Related to Output:** [Creates or appends to .learnings files; the optional hook writes truncated, redacted error excerpts for later triage.]

## Skill Version(s):

4.0.2 (source: frontmatter, changelog, server evidence)

## Ethical Considerations:

Users should evaluate whether this skill is appropriate for their environment, review any generated or modified files before relying on them, and apply their organization's safety, security, and compliance requirements before deployment.
