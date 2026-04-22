// Age/role-targeted dilemma packs for Private Circles. Each pack is a fixed
// array of 10 dilemmas today; the long-run target is 50 per pack. Content is
// intentionally terse — same shape as the global Paradox table's rows.

export interface PackParadox {
  title: string;
  description: string;
  optionA: string;
  optionB: string;
  category: string;
}

// Ages 11–14. Fairness, friendship, honesty, responsibility.
// TODO: grow to 50 before launch.
export const JUNIOR_HIGH_PACK: PackParadox[] = [
  {
    title: "The Group Project",
    description:
      "One teammate hasn't done any of the work and the project is due tomorrow. The teacher asks if it was an equal split.",
    optionA: "Tell the truth and let them fail the grade.",
    optionB: "Cover for them so the group keeps the grade.",
    category: "Fairness",
  },
  {
    title: "The Spoiler",
    description:
      "A friend asks if a movie ends happily. You know it doesn't. Honesty ruins it; a lie is still a lie.",
    optionA: "Tell the truth even if it spoils the movie.",
    optionB: "Lie to protect the experience.",
    category: "Honesty",
  },
  {
    title: "The Borrowed Phone",
    description:
      "A friend wants to borrow your phone for the afternoon. They're careless and you know they'll probably crack the screen.",
    optionA: "Say no and risk hurting the friendship.",
    optionB: "Lend it and accept the risk.",
    category: "Friendship",
  },
  {
    title: "The Cafeteria Thief",
    description:
      "A younger sibling keeps taking food from your lunchbox. You can tell your parents or try to handle it yourself.",
    optionA: "Tell your parents and let them handle it.",
    optionB: "Confront your sibling privately.",
    category: "Responsibility",
  },
  {
    title: "The Teacher's Desk",
    description:
      "You walk past the teacher's desk and see the answer key for tomorrow's test. No one is watching.",
    optionA: "Look — it's just sitting there.",
    optionB: "Keep walking.",
    category: "Integrity",
  },
  {
    title: "The Honest Compliment",
    description:
      "A friend shows you a drawing they're proud of. You don't think it's good. They ask what you think.",
    optionA: "Tell them kindly but truthfully.",
    optionB: "Say it's great to protect their feelings.",
    category: "Honesty",
  },
  {
    title: "The Harmless Prank",
    description:
      "Classmates are pulling a small prank on someone who doesn't realize it's happening. Everyone is laughing.",
    optionA: "Join in — it's just a prank.",
    optionB: "Step away and stay out of it.",
    category: "Courage",
  },
  {
    title: "The Found Wallet",
    description:
      "You find a wallet with $40 and a student ID inside. You don't know the student.",
    optionA: "Take it to the front office.",
    optionB: "Find the student yourself and return it in person.",
    category: "Integrity",
  },
  {
    title: "The Easy Out",
    description:
      "You're tired but not really sick. A big test is today. Your parent believes you if you say you feel bad.",
    optionA: "Fake being sick and take the day.",
    optionB: "Push through and take the test.",
    category: "Responsibility",
  },
  {
    title: "The Wrong Name",
    description:
      "A classmate got in trouble for something you actually did. They never told on you.",
    optionA: "Confess now and take the consequence.",
    optionB: "Let it go — they already accepted it.",
    category: "Integrity",
  },
];

// Ages 14–18. Justice, identity, society, ethics.
// TODO: grow to 50 before launch.
export const HIGH_SCHOOL_PACK: PackParadox[] = [
  {
    title: "The Bought Essay",
    description:
      "You're failing a class you need to graduate. A classmate offers to write your essay for money. No one would know.",
    optionA: "Buy the essay. Graduation first.",
    optionB: "Turn in your own work and accept the grade.",
    category: "Integrity",
  },
  {
    title: "The Outing",
    description:
      "A classmate told you a personal secret (identity, health, home life). Their parent asks you about it directly.",
    optionA: "Tell the parent — they have a right to know.",
    optionB: "Deflect and protect the secret.",
    category: "Loyalty",
  },
  {
    title: "The Drunk Drive",
    description:
      "A friend drove home drunk last weekend. They made it home safely and laugh about it. You know they'll do it again.",
    optionA: "Confront them and risk the friendship.",
    optionB: "Stay quiet — it worked out.",
    category: "Courage",
  },
  {
    title: "The Leaked Exam",
    description:
      "The teacher accidentally emailed answers to the whole class. Reporting it cancels the exam for everyone, including students who ignored the email.",
    optionA: "Report the leak.",
    optionB: "Stay quiet and take the exam.",
    category: "Justice",
  },
  {
    title: "The Classroom Bigot",
    description:
      "A classmate argues a bigoted position in a debate and claims it's 'just debate.' The teacher won't intervene.",
    optionA: "Challenge them publicly and escalate.",
    optionB: "Let it pass and move on.",
    category: "Courage",
  },
  {
    title: "The Family Secret",
    description:
      "A counselor asks about your home life. Telling the truth could put a family member in legal trouble.",
    optionA: "Tell the counselor the truth.",
    optionB: "Lie to protect your family.",
    category: "Loyalty",
  },
  {
    title: "The Borderline Scholarship",
    description:
      "A scholarship requires belonging to a category you technically qualify for but don't feel you truly represent.",
    optionA: "Apply — you qualify.",
    optionB: "Pass — it's not really for you.",
    category: "Identity",
  },
  {
    title: "The Ruin Button",
    description:
      "You have a photo that would destroy the reputation of a classmate who has bullied you for years.",
    optionA: "Post it.",
    optionB: "Delete it.",
    category: "Justice",
  },
  {
    title: "The Petition",
    description:
      "A student petition demands a teacher be fired over a single comment. You liked the teacher. Most of your friends signed.",
    optionA: "Sign — accountability matters.",
    optionB: "Refuse — it's an overreaction.",
    category: "Justice",
  },
  {
    title: "The Walkout",
    description:
      "A school-wide walkout is planned for a cause you only half-believe in. Not showing up will isolate you socially.",
    optionA: "Walk out with everyone.",
    optionB: "Stay in class.",
    category: "Identity",
  },
];

// Undergrad/grad. Applied philosophy, political philosophy, professional ethics.
// TODO: grow to 50 before launch.
export const UNIVERSITY_PACK: PackParadox[] = [
  {
    title: "The Autonomous Crash",
    description:
      "As the engineer on a self-driving car, you must pick a crash algorithm: minimize total harm, or always protect the occupant?",
    optionA: "Minimize total harm, even at the occupant's cost.",
    optionB: "Always protect the occupant first.",
    category: "Applied Ethics",
  },
  {
    title: "The Faked Data",
    description:
      "Your PI fabricated results in a paper already influencing public policy. Reporting ends her career and probably yours.",
    optionA: "Report it.",
    optionB: "Stay silent.",
    category: "Research Ethics",
  },
  {
    title: "The Speaker",
    description:
      "An invited speaker holds views many students find harmful. The department asks whether to disinvite.",
    optionA: "Disinvite — harm outweighs speech.",
    optionB: "Let them speak — the forum is for testing views.",
    category: "Free Speech",
  },
  {
    title: "The Consent Gap",
    description:
      "Your study needs real identifiers to be valid. Participants consented but would be humiliated if the dataset leaked.",
    optionA: "Proceed — consent was given.",
    optionB: "Redesign — informed consent isn't enough.",
    category: "Research Ethics",
  },
  {
    title: "The Curve",
    description:
      "As a TA you can curve grades up to reward effort or hold the line to preserve rigor. Same students, different futures.",
    optionA: "Curve up — reward effort.",
    optionB: "Hold the line — preserve the standard.",
    category: "Fairness",
  },
  {
    title: "The Conscience Clause",
    description:
      "A pharmacy student refuses, on religious grounds, to stock a legal medication. The ethics board must decide.",
    optionA: "Accommodate the conscience clause.",
    optionB: "Require the student to dispense.",
    category: "Professional Ethics",
  },
  {
    title: "The Predatory Journal",
    description:
      "Your advisor is tied to a journal with questionable peer review. Publishing there speeds your thesis by a year.",
    optionA: "Publish and move on.",
    optionB: "Refuse and take the year.",
    category: "Research Ethics",
  },
  {
    title: "The Sympathetic Lie",
    description:
      "A movement you agree with consistently misrepresents data to win policy fights. They ask you to endorse.",
    optionA: "Endorse — the cause is just.",
    optionB: "Refuse — the method isn't.",
    category: "Political Philosophy",
  },
  {
    title: "The Successor",
    description:
      "You have built a system that outperforms you at the job you were paid to do. Shipping it replaces your own role.",
    optionA: "Ship it.",
    optionB: "Shelve it.",
    category: "Applied Ethics",
  },
  {
    title: "The Sealed Archive",
    description:
      "A donor-locked archive contains colonial-era records of harm. You have access. Leaking them is illegal but illuminating.",
    optionA: "Leak them.",
    optionB: "Respect the restriction.",
    category: "Justice",
  },
];

// Workplace / leadership / corporate responsibility.
// TODO: grow to 50 before launch.
export const CORPORATE_PACK: PackParadox[] = [
  {
    title: "The Underpaid Star",
    description:
      "A top performer on your team is underpaid. Telling them they're below market will likely cost you the hire.",
    optionA: "Tell them.",
    optionB: "Stay silent — the company benefits.",
    category: "Leadership",
  },
  {
    title: "The Toxic Rainmaker",
    description:
      "A VP drives most of your revenue and harasses junior staff. HR has documented it. The board would rather ignore it.",
    optionA: "Push to fire them.",
    optionB: "Keep the revenue.",
    category: "Leadership",
  },
  {
    title: "The Layoff List",
    description:
      "You have the final layoff list a week before the announcement. People could plan their lives if they knew now.",
    optionA: "Leak the list early.",
    optionB: "Follow protocol — no leaks.",
    category: "Whistleblowing",
  },
  {
    title: "The Non-Compete",
    description:
      "A competitor offers a role that technically violates your non-compete. The clause is weakly enforceable in your jurisdiction.",
    optionA: "Take the job.",
    optionB: "Honor the agreement.",
    category: "Workplace Fairness",
  },
  {
    title: "The Tiebreaker",
    description:
      "Two finalists are equally qualified; one would make the team more diverse. You can only hire one.",
    optionA: "Use diversity as the tiebreaker.",
    optionB: "Pick by coin flip or other neutral signal.",
    category: "Workplace Fairness",
  },
  {
    title: "The Vendor Gift",
    description:
      "A vendor offers you a lucrative 'consulting fee' if their bid wins. It's an open secret in the industry.",
    optionA: "Accept — everyone does.",
    optionB: "Refuse and disclose the offer.",
    category: "Corporate Responsibility",
  },
  {
    title: "The Quiet Defect",
    description:
      "Your product has a rare but real flaw that can hurt users. A recall may end the company; a quiet fix forward would not.",
    optionA: "Issue a full recall.",
    optionB: "Patch forward, no announcement.",
    category: "Corporate Responsibility",
  },
  {
    title: "The Weekend Project",
    description:
      "You built something on weekends that could compete with your employer's roadmap. Your contract is ambiguous.",
    optionA: "Launch it independently.",
    optionB: "Offer it to your employer first.",
    category: "Leadership",
  },
  {
    title: "The Reference Call",
    description:
      "A former report who you rated mediocre has a callback for a job they'd love. Their new employer calls you.",
    optionA: "Be honest — mediocre was mediocre.",
    optionB: "Be generous — they deserve a shot.",
    category: "Leadership",
  },
  {
    title: "The Union Vote",
    description:
      "Your team is voting to unionize. You're expected to discourage it; privately, you agree with them.",
    optionA: "Push back as the role requires.",
    optionB: "Stay neutral, privately supportive.",
    category: "Workplace Fairness",
  },
];

export const ALL_PACKS: { pkg: "JUNIOR_HIGH" | "HIGH_SCHOOL" | "UNIVERSITY" | "CORPORATE"; data: PackParadox[] }[] = [
  { pkg: "JUNIOR_HIGH", data: JUNIOR_HIGH_PACK },
  { pkg: "HIGH_SCHOOL", data: HIGH_SCHOOL_PACK },
  { pkg: "UNIVERSITY", data: UNIVERSITY_PACK },
  { pkg: "CORPORATE", data: CORPORATE_PACK },
];
