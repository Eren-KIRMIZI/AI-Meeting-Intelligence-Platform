/**
 * Scripted conversation used by demo mode to exercise live captions, action
 * detection and the meeting report without a microphone. Every line is labelled
 * as demo content in the UI; live mode never imports this file.
 */
export interface DemoLine {
  speaker: string;
  text: string;
}

export const demoDialogue: DemoLine[] = [
  {
    speaker: 'Ayşe Yılmaz',
    text: 'We need to close the mobile onboarding gaps before the next cohort starts.',
  },
  {
    speaker: 'Emre Demir',
    text: 'I can take the frontend panel. I will have it ready by Tuesday.',
  },
  {
    speaker: 'Ayşe Yılmaz',
    text: 'Agreed. Emre owns the frontend panel and Sarah will review the empty states.',
  },
  {
    speaker: 'Sarah Chen',
    text: 'The transcript QA edge cases are still a blocker for the release.',
  },
  {
    speaker: 'Ayşe Yılmaz',
    text: "Let's move forward with a 10% cohort first, then expand after QA signs off.",
  },
  {
    speaker: 'Ravi Mehta',
    text: 'I will prepare the backend endpoint by Thursday.',
  },
  {
    speaker: 'Emre Demir',
    text: 'We should update the navigation spec before the design critique.',
  },
  {
    speaker: 'Nadia Ali',
    text: 'The brand review is delayed, so launch assets are at risk for January.',
  },
  {
    speaker: 'Ayşe Yılmaz',
    text: 'We decided to keep the January launch date and cut the secondary campaign.',
  },
  {
    speaker: 'Sarah Chen',
    text: 'I need to finalize the QA checklist by next week.',
  },
  {
    speaker: 'Ravi Mehta',
    text: 'The analytics dashboard is not ready, and that is a dependency for the cohort report.',
  },
  {
    speaker: 'Ayşe Yılmaz',
    text: 'Lucas will follow up with legal on the recording consent copy.',
  },
  {
    speaker: 'Emre Demir',
    text: 'Okay, I will share the revised panel with the team tomorrow.',
  },
  {
    speaker: 'Ayşe Yılmaz',
    text: 'To summarize: onboarding panel, QA checklist, backend endpoint and consent copy are the follow-ups.',
  },
];
