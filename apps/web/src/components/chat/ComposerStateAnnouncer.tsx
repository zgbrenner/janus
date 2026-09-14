import { memo } from "react";
import { type PendingApproval } from "../../session-logic";
import { approvalSummaryLabel } from "./ComposerPendingApprovalPanel";

interface ComposerStateAnnouncerProps {
  approval: PendingApproval | null;
}

/**
 * Speaks the composer takeover that a pending approval causes.
 *
 * When an approval arrives the composer stops being a message box: the editor
 * is emptied on screen and set read-only, and the toolbar is replaced by the
 * approve/decline buttons. Sighted users see all of that; until this existed
 * nothing on the chat surface was a live region, so a screen-reader user was
 * left typing into a field that had silently stopped accepting input.
 *
 * The element is rendered unconditionally and only its text changes. That is
 * deliberate: a live region inserted into the DOM already holding its text is
 * announced inconsistently, while one that is already present when its content
 * changes is the case screen readers handle reliably.
 */
export const ComposerStateAnnouncer = memo(function ComposerStateAnnouncer({
  approval,
}: ComposerStateAnnouncerProps) {
  return (
    <div aria-atomic="true" aria-live="polite" className="sr-only" role="status">
      {approval
        ? `${approvalSummaryLabel(approval.requestKind)}. The message box is read-only until you respond.`
        : ""}
    </div>
  );
});
