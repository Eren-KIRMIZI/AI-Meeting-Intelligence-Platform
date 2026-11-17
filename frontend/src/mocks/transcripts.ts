/**
 * Demo transcripts. Keeping them out of the services layer means the UI can
 * offer a realistic sample without pretending a provider is connected.
 */

const productSync = `Ayşe: Let's start with onboarding v2. Sarah, where are we?
Sarah: The checklist is almost done. I will finalize the onboarding checklist by Thursday.
Emre: The mobile navigation spec is ready for the design critique on Wednesday.
Ravi: Transcript QA is still the release blocker. Large uploads fail on retry.
Ayşe: We agreed to ship onboarding v2 to a 10% cohort first.
Sarah: I need to review the invited-member edge cases before the rollout.
Lucas: Risk: if QA slips past Friday, the launch date moves.
Ayşe: Action item for Ravi: close transcript QA edge cases by Friday.
Mina: I will add the Acme notes to the research repository tomorrow.
Emre: Let's go with the icon-only sidebar for desktop.
Ayşe: Nadia will prepare the launch announcement draft next week.
Ravi: I can share the QA report with the team by EOD.
Ayşe: Great. Next step is a short launch readiness review on Monday.
Sarah: I will schedule the review and send the invite today.`;

const researchReadout = `Mina: We ran eight onboarding interviews this week.
Mina: The biggest friction is the empty workspace on day one.
Emre: Design should prepare a first-run checklist for new teams.
Ravi: We agreed to keep the guided setup optional for returning users.
Mina: Risk: teams with imported data may skip the checklist entirely.
Ayşe: Action item for Emre: draft the first-run checklist by Tuesday.
Ravi: I will review the import edge cases and share notes tomorrow.
Mina: Next step is a follow-up readout with customer success next week.`;

const leadership = `Ayşe: The Q1 narrative needs one clear promise.
Lucas: We agreed to adopt meeting-to-execution as the Q1 product narrative.
Sarah: Engineering can support a weekly decision review if it stays lightweight.
Nadia: Marketing needs the narrative one-pager before the brand launch.
Ayşe: Lucas will publish the weekly decision review ritual.
Ayşe: I will draft the Q1 narrative one-pager by Friday.
Lucas: Risk: decision velocity drops if owners are not assigned in the room.
Sarah: Next step is to review decision throughput in two weeks.`;

const acmeDiscovery = `Mina: Walk us through how calls turn into follow-ups today.
Lucas: Acme loses about four hours a week rewriting notes and chasing owners.
Mina: The operations lead wants one owner per action item.
Ravi: We agreed to prototype single-owner action extraction.
Lucas: I will share the follow-up template with Acme tomorrow.
Mina: I will add the Acme notes to the research repository.
Ravi: Risk: imported notes may not map cleanly to our transcript format.
Mina: Next step is a follow-up session with the Acme operations team next week.`;

export const sampleTranscripts: Record<string, string> = {
  'm-product-sync': productSync,
  'm-product-sync-past': productSync,
  'm-design-critique': productSync,
  'm-research-readout': researchReadout,
  'm-research-synthesis': researchReadout,
  'm-leadership': leadership,
  'm-acme': acmeDiscovery,
};

export const defaultSampleTranscript = productSync;

export function sampleTranscriptFor(meetingId: string): string {
  return sampleTranscripts[meetingId] ?? defaultSampleTranscript;
}
