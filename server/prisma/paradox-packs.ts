// Age/role-targeted dilemma packs for Private Circles — 50 dilemmas each.
// Content is intentionally terse — same shape as the global Paradox table's rows.

export interface PackParadox {
  title: string;
  description: string;
  optionA: string;
  optionB: string;
  category: string;
}

// Ages 11–14. Fairness, friendship, honesty, responsibility.
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
  {
    title: "The Group Chat Screenshot",
    description:
      "Someone in your group chat said something mean about a classmate. The classmate asks you if anyone has been talking about them.",
    optionA: "Show them the screenshot.",
    optionB: "Keep the chat private.",
    category: "Honesty",
  },
  {
    title: "The Extra Change",
    description:
      "The cafeteria worker gives you five dollars too much in change. The line is long and nobody noticed.",
    optionA: "Go back and return it.",
    optionB: "Keep it — it was their mistake.",
    category: "Honesty",
  },
  {
    title: "The Tryout Spot",
    description:
      "You and your best friend both try out for the last spot on the team. The coach asks you who tried harder in practice.",
    optionA: "Say your friend did, even though it was you.",
    optionB: "Tell the truth and take the spot.",
    category: "Friendship",
  },
  {
    title: "The Shared Password",
    description:
      "A friend gives you their game password to help them level up. You see private messages in their account.",
    optionA: "Tell them you saw the messages.",
    optionB: "Say nothing and log out.",
    category: "Privacy",
  },
  {
    title: "The New Kid",
    description:
      "A new student sits alone at lunch. Your friends say if you sit with them, you can't sit with the group anymore.",
    optionA: "Sit with the new kid.",
    optionB: "Stay with your friends.",
    category: "Kindness",
  },
  {
    title: "The Copied Homework",
    description:
      "Your friend copied your homework and the teacher thinks you copied theirs.",
    optionA: "Tell the teacher the truth.",
    optionB: "Take the blame to protect your friend.",
    category: "Fairness",
  },
  {
    title: "The Broken Window",
    description:
      "Your younger brother broke a neighbor's window with a ball. Your parents think it was the wind.",
    optionA: "Tell your parents what happened.",
    optionB: "Let your brother tell them himself — or not.",
    category: "Responsibility",
  },
  {
    title: "The Surprise Party Lie",
    description:
      "Your friend asks if you're doing anything Saturday. You're planning their surprise party.",
    optionA: "Lie to keep the surprise.",
    optionB: "Avoid the question but don't lie.",
    category: "Honesty",
  },
  {
    title: "The Viral Video",
    description:
      "A video of a classmate tripping is going around. It's funny, and everyone is sharing it.",
    optionA: "Share it — everyone has seen it already.",
    optionB: "Refuse to share and ask others to stop.",
    category: "Kindness",
  },
  {
    title: "The Science Fair Help",
    description:
      "Your parent offers to basically build your science project. Other kids' parents are doing the same.",
    optionA: "Accept the help to keep up.",
    optionB: "Do it yourself even if it looks worse.",
    category: "Fairness",
  },
  {
    title: "The Lost Phone",
    description:
      "You find a phone on the bus. It isn't locked, and you could look through it to find the owner.",
    optionA: "Look through it to find who owns it.",
    optionB: "Hand it to the driver without looking.",
    category: "Privacy",
  },
  {
    title: "The Captain's Choice",
    description:
      "You're team captain picking sides in gym. Your friend is slow, and the other kids will be annoyed if you pick them early.",
    optionA: "Pick your friend first.",
    optionB: "Pick the strongest players first.",
    category: "Friendship",
  },
  {
    title: "The Cheating Sibling",
    description:
      "You see your older sister cheating on an online quiz at home. She asks you not to tell.",
    optionA: "Tell your parents.",
    optionB: "Keep her secret.",
    category: "Honesty",
  },
  {
    title: "The Class Pet Accident",
    description:
      "You forgot to feed the class hamster over the weekend, and it got sick. Nobody knows whose turn it was.",
    optionA: "Admit it was your turn.",
    optionB: "Stay quiet — it's recovering anyway.",
    category: "Responsibility",
  },
  {
    title: "The Unfair Rule",
    description:
      "Your school bans phones at lunch, but teachers use theirs. A student petition is going around.",
    optionA: "Sign the petition.",
    optionB: "Follow the rule without complaining.",
    category: "Fairness",
  },
  {
    title: "The Birthday Invite",
    description:
      "You're allowed to invite ten people to your party. There are eleven kids in your friend group.",
    optionA: "Invite ten and leave one out.",
    optionB: "Invite nobody from the group to keep it fair.",
    category: "Fairness",
  },
  {
    title: "The Teacher's Mistake",
    description:
      "Your teacher marked a wrong answer as correct on your test, giving you an A instead of a B.",
    optionA: "Point out the mistake.",
    optionB: "Keep the A.",
    category: "Honesty",
  },
  {
    title: "The Rumor",
    description:
      "You hear a rumor that a classmate's parents are getting divorced. Your friends want to know if it's true.",
    optionA: "Say what you heard.",
    optionB: "Refuse to pass it on.",
    category: "Kindness",
  },
  {
    title: "The Borrowed Book",
    description:
      "You lost a library book you borrowed from a friend. They haven't asked for it back yet.",
    optionA: "Tell them now and offer to replace it.",
    optionB: "Wait and hope they forget.",
    category: "Responsibility",
  },
  {
    title: "The Online Stranger",
    description:
      "Someone you met in an online game is nice to you and asks which school you go to.",
    optionA: "Tell them — they seem friendly.",
    optionB: "Keep it private and tell a parent.",
    category: "Safety",
  },
  {
    title: "The Easy Grade",
    description:
      "Your group's presentation is weak. One member wants to say they did research they didn't do.",
    optionA: "Go along with it.",
    optionB: "Insist the group tells the truth.",
    category: "Honesty",
  },
  {
    title: "The Bullied Friend",
    description:
      "Your friend is being teased. Standing up for them might make the teasing turn on you.",
    optionA: "Stand up for them out loud.",
    optionB: "Comfort them privately afterward.",
    category: "Courage",
  },
  {
    title: "The Chores Deal",
    description:
      "Your parents pay you to do chores. You paid your little brother half to do them for you.",
    optionA: "That's smart business.",
    optionB: "That's not what your parents paid for.",
    category: "Fairness",
  },
  {
    title: "The Spoiled Game",
    description:
      "Your friend lends you a new video game and you accidentally scratch the disc.",
    optionA: "Tell them right away.",
    optionB: "Return it and hope it still works.",
    category: "Responsibility",
  },
  {
    title: "The Secret Crush",
    description:
      "A friend tells you who they have a crush on. Another friend begs you to tell.",
    optionA: "Keep the secret.",
    optionB: "Tell — they'll find out anyway.",
    category: "Friendship",
  },
  {
    title: "The Shortcut",
    description:
      "The quickest way home is across a neighbor's yard they've asked people to stay off. Nobody's home.",
    optionA: "Take the shortcut.",
    optionB: "Go the long way.",
    category: "Respect",
  },
  {
    title: "The Free Trial",
    description:
      "A game offers a free trial that turns into a paid subscription. You could use your parent's card without asking and cancel in time.",
    optionA: "Use the card — you'll cancel.",
    optionB: "Ask first.",
    category: "Honesty",
  },
  {
    title: "The Talent Show",
    description:
      "Your friend wants to sing in the talent show but they're not very good. They ask what you think.",
    optionA: "Encourage them honestly but kindly.",
    optionB: "Tell them they're great.",
    category: "Honesty",
  },
  {
    title: "The Credit",
    description:
      "You came up with the main idea for a group project. A louder group member presents it as theirs.",
    optionA: "Speak up in front of the class.",
    optionB: "Let it go to avoid drama.",
    category: "Fairness",
  },
  {
    title: "The Recess Game",
    description:
      "The older kids took over the field you always play on. They say first come, first served.",
    optionA: "Argue that you were there first every day.",
    optionB: "Find somewhere else to play.",
    category: "Fairness",
  },
  {
    title: "The Forgotten Lunch",
    description:
      "You see a classmate with no lunch who seems embarrassed. You could share yours, but you're hungry.",
    optionA: "Share your lunch.",
    optionB: "Tell a teacher instead.",
    category: "Kindness",
  },
  {
    title: "The Pet Promise",
    description:
      "You promised to walk the dog every day if you got one. Now you're busy and your mom does it.",
    optionA: "Keep your promise even if it's hard.",
    optionB: "Promises can change when life changes.",
    category: "Responsibility",
  },
  {
    title: "The Answer Key",
    description:
      "You find the answer key to tomorrow's quiz in the hallway.",
    optionA: "Hand it in without looking.",
    optionB: "Look — finding it isn't cheating.",
    category: "Honesty",
  },
  {
    title: "The Club Rule",
    description:
      "Your club says new members must do an embarrassing dare. You're now a leader of the club.",
    optionA: "Keep the tradition.",
    optionB: "End the dare rule.",
    category: "Kindness",
  },
  {
    title: "The Grandparent's Gift",
    description:
      "Your grandparent knitted you a sweater you'll never wear. They ask if you love it.",
    optionA: "Say you love it.",
    optionB: "Thank them without saying you love it.",
    category: "Honesty",
  },
  {
    title: "The Team Loss",
    description:
      "Your team lost because you missed an easy shot. A teammate blames the referee.",
    optionA: "Admit it was your miss.",
    optionB: "Let the ref take the blame.",
    category: "Responsibility",
  },
  {
    title: "The Line Cut",
    description:
      "Your friend lets you cut in line for lunch. The kids behind you complain.",
    optionA: "Go to the back of the line.",
    optionB: "Stay — your friend invited you.",
    category: "Fairness",
  },
  {
    title: "The Volunteer Hours",
    description:
      "You need volunteer hours for school. A friend offers to sign a form saying you did hours you didn't.",
    optionA: "Take the signature.",
    optionB: "Do the hours for real.",
    category: "Honesty",
  },
  {
    title: "The Lonely Neighbor",
    description:
      "An elderly neighbor always wants to chat when you walk by. You're usually in a hurry.",
    optionA: "Stop and talk for a few minutes.",
    optionB: "Wave and keep going.",
    category: "Kindness",
  },
  {
    title: "The Cross-Town Wallet",
    description:
      "You find a wallet with twenty dollars and an ID. The owner lives across town.",
    optionA: "Return it with all the money.",
    optionB: "Return it but keep a small reward.",
    category: "Honesty",
  },
];

// Ages 14–18. Justice, identity, society, ethics.
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
  {
    title: "The College Essay Coach",
    description:
      "A paid coach offers to 'polish' your college essay — in practice, rewrite most of it. Many applicants do this.",
    optionA: "Use the coach.",
    optionB: "Write it yourself, rough edges and all.",
    category: "Integrity",
  },
  {
    title: "The Fake ID",
    description:
      "Your friends got fake IDs for a concert that's 21+. You're the only one without one.",
    optionA: "Get one so you can go.",
    optionB: "Skip the concert.",
    category: "Law",
  },
  {
    title: "The Screenshot Leak",
    description:
      "Someone shares a private photo of a classmate in a big group chat. You could report it to the school.",
    optionA: "Report it.",
    optionB: "Leave the chat and stay out of it.",
    category: "Privacy",
  },
  {
    title: "The Unpaid Internship",
    description:
      "An unpaid internship would look great on applications, but only students who can afford not to work can take it.",
    optionA: "Take it — opportunities are opportunities.",
    optionB: "Turn it down on principle.",
    category: "Fairness",
  },
  {
    title: "The Teammate's Injury",
    description:
      "Your teammate is hiding an injury so they can play in the championship. The coach doesn't know.",
    optionA: "Tell the coach.",
    optionB: "Respect their choice.",
    category: "Autonomy",
  },
  {
    title: "The AI Homework",
    description:
      "An AI tool can write your history essay in seconds. The teacher hasn't banned it explicitly.",
    optionA: "Use it and edit the result.",
    optionB: "Write it yourself.",
    category: "Integrity",
  },
  {
    title: "The Party Photos",
    description:
      "Photos from a party show a classmate drinking. They're applying for a scholarship with a good-conduct clause.",
    optionA: "Delete the photos you posted.",
    optionB: "It's their responsibility, not yours.",
    category: "Responsibility",
  },
  {
    title: "The Valedictorian Gap",
    description:
      "You're second in class by 0.01 GPA. You could take an easy elective to pass the leader.",
    optionA: "Take the easy class.",
    optionB: "Take the class you actually want.",
    category: "Ambition",
  },
  {
    title: "The Dress Code",
    description:
      "The dress code is enforced much more strictly on girls than boys. A walkout is planned during a test.",
    optionA: "Join the walkout.",
    optionB: "Take the test and protest another way.",
    category: "Justice",
  },
  {
    title: "The Ex's Secret",
    description:
      "Your ex told you something private while you were dating. Now they're spreading rumors about you.",
    optionA: "Reveal their secret to defend yourself.",
    optionB: "Keep it private anyway.",
    category: "Loyalty",
  },
  {
    title: "The Job Offer",
    description:
      "A part-time job pays well but means quitting the school play your friends are counting on.",
    optionA: "Take the job.",
    optionB: "Stay in the play.",
    category: "Commitment",
  },
  {
    title: "The Overheard Threat",
    description:
      "You overhear a student joking about bringing a weapon to school. It's probably nothing.",
    optionA: "Report it.",
    optionB: "Don't ruin someone's life over a joke.",
    category: "Safety",
  },
  {
    title: "The Sibling's Car",
    description:
      "You borrowed your sibling's car without asking and scraped it. They haven't noticed.",
    optionA: "Tell them and pay for it.",
    optionB: "Fix it quietly if you can.",
    category: "Honesty",
  },
  {
    title: "The Influencer Deal",
    description:
      "A brand offers you money to post about a product you don't actually use.",
    optionA: "Take the deal.",
    optionB: "Only promote what you use.",
    category: "Honesty",
  },
  {
    title: "The Group Grade",
    description:
      "One member of your group did nothing. The teacher asks everyone to rate each other privately.",
    optionA: "Rate them honestly.",
    optionB: "Rate everyone the same.",
    category: "Fairness",
  },
  {
    title: "The Coach's Favorite",
    description:
      "The coach plays their own kid over better players. Complaining could cost you playing time.",
    optionA: "Raise it with the athletic director.",
    optionB: "Keep your head down.",
    category: "Justice",
  },
  {
    title: "The Plagiarized Friend",
    description:
      "You notice your friend's award-winning poem closely copies a published poem.",
    optionA: "Tell your friend you noticed.",
    optionB: "Say nothing — it's not your business.",
    category: "Integrity",
  },
  {
    title: "The Curfew",
    description:
      "Your parents set a curfew you think is unfair. You could sneak back in after it without them knowing.",
    optionA: "Keep the curfew while arguing to change it.",
    optionB: "Sneak out — the rule is unfair.",
    category: "Authority",
  },
  {
    title: "The Anonymous Account",
    description:
      "An anonymous account is posting mean things about teachers. You know who runs it.",
    optionA: "Tell the school.",
    optionB: "Stay out of it.",
    category: "Loyalty",
  },
  {
    title: "The Climate Strike",
    description:
      "Students are skipping school on Friday for a climate strike. Absences will count against you.",
    optionA: "Strike.",
    optionB: "Go to class.",
    category: "Civic Duty",
  },
  {
    title: "The Tutor's Answers",
    description:
      "Your tutor gives you answers to homework instead of teaching you. Your grades are up.",
    optionA: "Ask them to teach you instead.",
    optionB: "Take the grades.",
    category: "Integrity",
  },
  {
    title: "The Prom Date",
    description:
      "You agreed to go to prom with a friend. Your crush just asked you.",
    optionA: "Keep your promise.",
    optionB: "Go with your crush and apologize.",
    category: "Loyalty",
  },
  {
    title: "The Exam Leak",
    description:
      "Someone posted tomorrow's exam online. Half the class has already seen it.",
    optionA: "Look — the field is already uneven.",
    optionB: "Don't look and tell the teacher.",
    category: "Fairness",
  },
  {
    title: "The Vape Confession",
    description:
      "Your younger sibling confides that they vape. They beg you not to tell your parents.",
    optionA: "Tell your parents.",
    optionB: "Keep the secret and talk to them yourself.",
    category: "Responsibility",
  },
  {
    title: "The Charity Shortcut",
    description:
      "Your club raised less than its fundraising goal. A member suggests padding the total with their parent's donation and calling it student-raised.",
    optionA: "Report the real number.",
    optionB: "Accept the donation as student-raised.",
    category: "Honesty",
  },
  {
    title: "The Talent Recruit",
    description:
      "A rival school offers you a sports scholarship to transfer. Your team would be crushed.",
    optionA: "Transfer.",
    optionB: "Stay with your team.",
    category: "Loyalty",
  },
  {
    title: "The Debate Side",
    description:
      "You're assigned to argue a side of a debate you find morally wrong.",
    optionA: "Argue it as well as you can.",
    optionB: "Refuse the assignment.",
    category: "Integrity",
  },
  {
    title: "The Driving Text",
    description:
      "Your friend is texting while driving you home. You feel awkward saying anything.",
    optionA: "Ask them to stop.",
    optionB: "Stay quiet — it's their car.",
    category: "Safety",
  },
  {
    title: "The Late Assignment",
    description:
      "You missed a deadline because you didn't plan well. A classmate got an extension by claiming illness.",
    optionA: "Claim illness too.",
    optionB: "Accept the late penalty.",
    category: "Honesty",
  },
  {
    title: "The Biased Teacher",
    description:
      "A teacher grades students who share their politics more generously.",
    optionA: "Report the pattern.",
    optionB: "Write what they want to hear.",
    category: "Justice",
  },
  {
    title: "The Inherited Phone",
    description:
      "Your parent gives you their old phone. Their private messages are still on it.",
    optionA: "Wipe it without reading.",
    optionB: "Glance through — it's yours now.",
    category: "Privacy",
  },
  {
    title: "The Senior Prank",
    description:
      "The senior prank will cost the janitors hours of cleanup. Everyone's participating.",
    optionA: "Join in.",
    optionB: "Opt out and help clean.",
    category: "Respect",
  },
  {
    title: "The Club Election",
    description:
      "You're running for club president against your best friend. You could win by sharing something embarrassing about them.",
    optionA: "Don't use it.",
    optionB: "Politics is politics.",
    category: "Integrity",
  },
  {
    title: "The Store Mistake",
    description:
      "Your employer accidentally paid you double this week.",
    optionA: "Tell them.",
    optionB: "Keep quiet — it's their error.",
    category: "Honesty",
  },
  {
    title: "The Social Media Pile-on",
    description:
      "A classmate posted something offensive. Everyone is piling on them online.",
    optionA: "Join in — they deserve it.",
    optionB: "Talk to them privately instead.",
    category: "Justice",
  },
  {
    title: "The Recommendation Letter",
    description:
      "Your favorite teacher asks you to draft your own recommendation letter for them to sign.",
    optionA: "Write it honestly.",
    optionB: "Make yourself sound amazing.",
    category: "Honesty",
  },
  {
    title: "The Ride Home",
    description:
      "A friend who's been drinking insists they're fine to drive you home.",
    optionA: "Refuse and find another way.",
    optionB: "Trust them — they know their limits.",
    category: "Safety",
  },
  {
    title: "The Gap Year",
    description:
      "Your parents want you to go straight to college. You want a gap year to work and travel.",
    optionA: "Take the gap year.",
    optionB: "Follow your parents' plan.",
    category: "Autonomy",
  },
  {
    title: "The Mascot Change",
    description:
      "Your school's mascot is offensive to a local community. Alumni want to keep it for tradition.",
    optionA: "Change it.",
    optionB: "Keep the tradition.",
    category: "Respect",
  },
  {
    title: "The Secret Test Retake",
    description:
      "A teacher lets one student secretly retake a test because of a family emergency. You find out.",
    optionA: "That's fair — they had an emergency.",
    optionB: "Everyone should get the same chance.",
    category: "Fairness",
  },
];

// Undergrad/grad. Applied philosophy, political philosophy, professional ethics.
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
  {
    title: "The Ghostwritten Thesis",
    description:
      "A classmate is paying someone to write their thesis. You found the listing.",
    optionA: "Report it.",
    optionB: "It's not your problem.",
    category: "Academic Integrity",
  },
  {
    title: "The Research Shortcut",
    description:
      "Your lab's results won't replicate. Your PI suggests dropping the outlier runs before submission.",
    optionA: "Refuse and push for full reporting.",
    optionB: "Drop them — everyone trims outliers.",
    category: "Research Ethics",
  },
  {
    title: "The Legacy Admit",
    description:
      "You learn your admission was likely helped by your parent being an alumnus.",
    optionA: "Speak out against legacy admissions.",
    optionB: "Accept it quietly.",
    category: "Fairness",
  },
  {
    title: "The Free Speech Invite",
    description:
      "A student group invites a speaker whose views many find hateful. Protesters plan to block the event.",
    optionA: "Let the event go ahead.",
    optionB: "Block it.",
    category: "Free Speech",
  },
  {
    title: "The TA's Grade",
    description:
      "As a TA, you're asked to give a struggling athlete a passing grade they didn't earn.",
    optionA: "Refuse.",
    optionB: "Go along — the department wants it.",
    category: "Integrity",
  },
  {
    title: "The Exam Accommodation",
    description:
      "A classmate gets extra exam time for a disability you suspect they're exaggerating.",
    optionA: "Report your suspicion.",
    optionB: "Assume good faith.",
    category: "Fairness",
  },
  {
    title: "The Startup Equity",
    description:
      "Your startup co-founder did less work but wants an equal split as originally agreed.",
    optionA: "Honour the 50/50.",
    optionB: "Renegotiate based on effort.",
    category: "Fairness",
  },
  {
    title: "The Lab Animal",
    description:
      "Your research requires experiments that cause animal suffering but could help cure a disease.",
    optionA: "Continue the research.",
    optionB: "Find another project.",
    category: "Bioethics",
  },
  {
    title: "The Roommate's Breakdown",
    description:
      "Your roommate is struggling badly but begs you not to tell anyone.",
    optionA: "Tell the counselling service.",
    optionB: "Respect their wishes.",
    category: "Autonomy",
  },
  {
    title: "The Study Drug",
    description:
      "Prescription stimulants are everywhere during finals. A friend offers you some.",
    optionA: "Take them.",
    optionB: "Refuse.",
    category: "Fairness",
  },
  {
    title: "The Recorded Lecture",
    description:
      "A professor makes offensive comments in a lecture. You could post the recording online.",
    optionA: "Post it.",
    optionB: "Report it through official channels.",
    category: "Accountability",
  },
  {
    title: "The Divestment Vote",
    description:
      "The student body votes on divesting the endowment from fossil fuels, which could cut scholarship funding.",
    optionA: "Divest.",
    optionB: "Keep the investments.",
    category: "Sustainability",
  },
  {
    title: "The Co-Author",
    description:
      "A senior researcher wants their name on your paper despite contributing nothing.",
    optionA: "Add them — it helps you get published.",
    optionB: "Refuse.",
    category: "Research Ethics",
  },
  {
    title: "The Housing Lottery",
    description:
      "You can swap into better housing by claiming a medical need you don't have.",
    optionA: "Claim it.",
    optionB: "Take your assignment.",
    category: "Honesty",
  },
  {
    title: "The Unpaid Labor",
    description:
      "Your professor expects grad students to work 70-hour weeks without extra pay.",
    optionA: "Organise with other students.",
    optionB: "Accept it as the cost of a career.",
    category: "Labor",
  },
  {
    title: "The Data Scrape",
    description:
      "You could scrape public social media data for your thesis without users' consent.",
    optionA: "Scrape it — it's public.",
    optionB: "Only use consented data.",
    category: "Privacy",
  },
  {
    title: "The Group Chat Cheat",
    description:
      "Your class group chat is sharing answers during an online exam.",
    optionA: "Leave and report.",
    optionB: "Leave quietly.",
    category: "Academic Integrity",
  },
  {
    title: "The Hiring Network",
    description:
      "Your uncle can get you a top internship through connections other applicants don't have.",
    optionA: "Take it.",
    optionB: "Apply through the normal process.",
    category: "Fairness",
  },
  {
    title: "The Controversial Paper",
    description:
      "Your honest findings support a politically unpopular conclusion.",
    optionA: "Publish anyway.",
    optionB: "Reframe or delay it.",
    category: "Research Ethics",
  },
  {
    title: "The Fraternity Hazing",
    description:
      "Your fraternity's initiation involves dangerous hazing. You're now in charge of it.",
    optionA: "End it.",
    optionB: "Keep it safer but keep the tradition.",
    category: "Safety",
  },
  {
    title: "The Scholarship Fib",
    description:
      "A scholarship is for first-generation students. Your parent attended college briefly but didn't finish.",
    optionA: "Apply — it's technically true.",
    optionB: "Don't apply.",
    category: "Honesty",
  },
  {
    title: "The Climate Flight",
    description:
      "Your dream conference is overseas. The flight's emissions bother you.",
    optionA: "Fly.",
    optionB: "Attend online.",
    category: "Sustainability",
  },
  {
    title: "The Professor's Crush",
    description:
      "A professor is flirting with you and hints it could help your grade.",
    optionA: "Report it.",
    optionB: "Ignore it and keep your head down.",
    category: "Power",
  },
  {
    title: "The Open Source Theft",
    description:
      "A company is using your open-source code in violation of its license.",
    optionA: "Fight it publicly.",
    optionB: "Let it go.",
    category: "Justice",
  },
  {
    title: "The Assisted Dying Vote",
    description:
      "Your bioethics class debates legalising assisted dying for people with terminal illness.",
    optionA: "Legalise it.",
    optionB: "Keep it illegal.",
    category: "Bioethics",
  },
  {
    title: "The Exam Leak Tip",
    description:
      "Someone anonymously sends you the final exam. You could use it or report it.",
    optionA: "Report it.",
    optionB: "Delete it unopened and say nothing.",
    category: "Academic Integrity",
  },
  {
    title: "The Unsafe Lab",
    description:
      "Your lab ignores safety rules to save time. Reporting it could end your position.",
    optionA: "Report it.",
    optionB: "Work around the risks.",
    category: "Safety",
  },
  {
    title: "The Tuition Strike",
    description:
      "Students are refusing to pay tuition to protest rising fees.",
    optionA: "Join the strike.",
    optionB: "Pay and protest another way.",
    category: "Justice",
  },
  {
    title: "The Study Abroad Spot",
    description:
      "You and a friend applied for one study-abroad spot. You could mention their poor grades to the selection panel.",
    optionA: "Mention it.",
    optionB: "Let your application speak for itself.",
    category: "Fairness",
  },
  {
    title: "The Faked Survey",
    description:
      "Your survey got too few responses. A teammate suggests filling in plausible fake ones.",
    optionA: "Refuse.",
    optionB: "Do it — the trend is obvious anyway.",
    category: "Research Ethics",
  },
  {
    title: "The Activist Grade",
    description:
      "A professor gives extra credit for attending a political rally.",
    optionA: "Complain.",
    optionB: "Go — it's extra credit.",
    category: "Freedom",
  },
  {
    title: "The Mentor's Mistake",
    description:
      "Your mentor published a paper with an error that undermines their main result.",
    optionA: "Raise it with them.",
    optionB: "Let someone else find it.",
    category: "Integrity",
  },
  {
    title: "The Club Funding",
    description:
      "Your club can get funding by inflating its membership numbers.",
    optionA: "Inflate them.",
    optionB: "Report the real numbers.",
    category: "Honesty",
  },
  {
    title: "The Gene Edit",
    description:
      "A professor proposes editing embryos to prevent a hereditary disease.",
    optionA: "Support the research.",
    optionB: "Oppose it.",
    category: "Bioethics",
  },
  {
    title: "The Exam Conflict",
    description:
      "Your religious holiday falls on the final exam. The professor offers no alternative.",
    optionA: "Skip the holiday.",
    optionB: "Skip the exam and appeal.",
    category: "Freedom",
  },
  {
    title: "The Whistleblower Friend",
    description:
      "Your friend leaked documents showing the university covered up a scandal. They're now being disciplined.",
    optionA: "Support them publicly.",
    optionB: "Stay out of it.",
    category: "Accountability",
  },
  {
    title: "The Free Textbooks",
    description:
      "You can download pirated textbooks that cost hundreds of dollars.",
    optionA: "Download them.",
    optionB: "Pay or borrow.",
    category: "Law",
  },
  {
    title: "The Diversity Hire",
    description:
      "Your student society is choosing between two equally qualified candidates for a role.",
    optionA: "Pick the candidate who adds diversity.",
    optionB: "Flip a coin.",
    category: "Fairness",
  },
  {
    title: "The Lab Credit",
    description:
      "An undergraduate did key work on your project. Your PI wants to leave them off the author list.",
    optionA: "Insist they're included.",
    optionB: "Defer to your PI.",
    category: "Research Ethics",
  },
  {
    title: "The Campus Surveillance",
    description:
      "The university proposes cameras across campus to reduce crime.",
    optionA: "Support the cameras.",
    optionB: "Oppose them.",
    category: "Privacy",
  },
];

// Workplace / leadership / corporate responsibility.
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
  {
    title: "The Inflated Forecast",
    description:
      "Your manager asks you to make next quarter's forecast look better for investors.",
    optionA: "Push back.",
    optionB: "Adjust it — forecasts are guesses anyway.",
    category: "Integrity",
  },
  {
    title: "The Exit Interview",
    description:
      "In your exit interview, you could honestly describe your manager's bullying.",
    optionA: "Be honest.",
    optionB: "Stay diplomatic to protect your reference.",
    category: "Accountability",
  },
  {
    title: "The Remote Monitor",
    description:
      "Leadership wants software that tracks remote employees' keystrokes.",
    optionA: "Implement it.",
    optionB: "Push back on privacy grounds.",
    category: "Privacy",
  },
  {
    title: "The Customer Data",
    description:
      "A partner offers to buy anonymised customer data. 'Anonymised' is generous.",
    optionA: "Sell it.",
    optionB: "Decline.",
    category: "Privacy",
  },
  {
    title: "The Promotion Bias",
    description:
      "You're on a promotion panel. The strongest candidate is about to go on parental leave.",
    optionA: "Promote them.",
    optionB: "Promote the second choice who'll be around.",
    category: "Fairness",
  },
  {
    title: "The AI Replacement",
    description:
      "You could automate your team's work with AI and cut three roles.",
    optionA: "Automate.",
    optionB: "Keep the team and grow them.",
    category: "Workforce",
  },
  {
    title: "The Bribe Culture",
    description:
      "In a new market, deals routinely require 'facilitation payments'.",
    optionA: "Pay to compete.",
    optionB: "Refuse and risk losing the market.",
    category: "Compliance",
  },
  {
    title: "The Silent Recall",
    description:
      "A product flaw rarely causes injuries. A recall would be enormously costly.",
    optionA: "Recall.",
    optionB: "Fix it quietly in the next version.",
    category: "Safety",
  },
  {
    title: "The Credit Steal",
    description:
      "Your boss presented your idea as their own to the executive team.",
    optionA: "Raise it with your boss.",
    optionB: "Let it go to protect the relationship.",
    category: "Fairness",
  },
  {
    title: "The Pay Gap",
    description:
      "You discover a colleague doing the same job is paid much less than you.",
    optionA: "Tell them.",
    optionB: "Keep compensation private.",
    category: "Fairness",
  },
  {
    title: "The Greenwashing Campaign",
    description:
      "Marketing wants to call the product 'eco-friendly' based on one minor change.",
    optionA: "Approve it.",
    optionB: "Block it.",
    category: "Honesty",
  },
  {
    title: "The Friend's Firing",
    description:
      "You're asked to fire a close friend for performance.",
    optionA: "Do it yourself.",
    optionB: "Ask someone else to.",
    category: "Leadership",
  },
  {
    title: "The Confidential Tip",
    description:
      "A friend at a competitor accidentally shares their pricing strategy.",
    optionA: "Use it.",
    optionB: "Ignore it and tell your legal team.",
    category: "Compliance",
  },
  {
    title: "The Overtime Ask",
    description:
      "A launch needs your team to work weekends for a month. They're already exhausted.",
    optionA: "Ask them anyway.",
    optionB: "Delay the launch.",
    category: "Workforce",
  },
  {
    title: "The Harassment Rumor",
    description:
      "You hear a rumor that a senior leader harasses junior staff. No one has filed a complaint.",
    optionA: "Report the rumor.",
    optionB: "Wait for evidence.",
    category: "Accountability",
  },
  {
    title: "The Supplier Labor",
    description:
      "A cheaper supplier is suspected of using child labour. It's not proven.",
    optionA: "Switch away.",
    optionB: "Stay until there's proof.",
    category: "Supply Chain",
  },
  {
    title: "The Sick Day",
    description:
      "An employee uses sick days for job interviews. You know because they told you.",
    optionA: "Report it.",
    optionB: "Look the other way.",
    category: "Loyalty",
  },
  {
    title: "The Diversity Data",
    description:
      "Your company's diversity report could be made to look better by changing how categories are counted.",
    optionA: "Change the method.",
    optionB: "Report it the old way.",
    category: "Honesty",
  },
  {
    title: "The Client's Request",
    description:
      "A major client asks you not to assign a particular employee to their account because of her background.",
    optionA: "Comply to keep the client.",
    optionB: "Refuse and risk losing them.",
    category: "Discrimination",
  },
  {
    title: "The Severance Deal",
    description:
      "Laid-off staff are offered severance only if they sign strict non-disparagement agreements.",
    optionA: "Include the clause.",
    optionB: "Remove it.",
    category: "Fairness",
  },
  {
    title: "The Algorithmic Hiring",
    description:
      "A hiring algorithm is efficient but rejects candidates from certain zip codes more often.",
    optionA: "Keep using it.",
    optionB: "Pause it until it's audited.",
    category: "Discrimination",
  },
  {
    title: "The Expense Padding",
    description:
      "Your team routinely pads expense reports a little. It's 'part of the culture'.",
    optionA: "Report it.",
    optionB: "Ignore it — the amounts are small.",
    category: "Integrity",
  },
  {
    title: "The Startup Pivot",
    description:
      "Your startup can survive by pivoting to a product you find ethically questionable.",
    optionA: "Pivot.",
    optionB: "Shut down.",
    category: "Purpose",
  },
  {
    title: "The Loyal Underperformer",
    description:
      "A 20-year employee is now underperforming. Younger staff are frustrated.",
    optionA: "Let them go.",
    optionB: "Find them a different role.",
    category: "Leadership",
  },
  {
    title: "The Lobbying Push",
    description:
      "Your company is lobbying against a regulation you personally support.",
    optionA: "Speak up internally.",
    optionB: "Stay out of it.",
    category: "Purpose",
  },
  {
    title: "The Return-to-Office",
    description:
      "Leadership mandates a full return to office. Many staff moved away during remote work.",
    optionA: "Enforce it.",
    optionB: "Push for flexibility.",
    category: "Workforce",
  },
  {
    title: "The Insider Hint",
    description:
      "A colleague hints the company is about to be acquired. Buying shares now would be lucrative.",
    optionA: "Buy shares.",
    optionB: "Don't.",
    category: "Compliance",
  },
  {
    title: "The Negative Review",
    description:
      "A competitor's product is genuinely better. A client asks for your honest view.",
    optionA: "Tell them.",
    optionB: "Steer them toward yours.",
    category: "Honesty",
  },
  {
    title: "The Safety Shortcut",
    description:
      "A contractor skipped a safety inspection to meet your deadline.",
    optionA: "Stop work until it's done.",
    optionB: "Accept the risk to stay on schedule.",
    category: "Safety",
  },
  {
    title: "The Volunteer Day",
    description:
      "Leadership wants a mandatory 'volunteer' day at a charity many staff disagree with.",
    optionA: "Make it optional.",
    optionB: "Keep it mandatory for team building.",
    category: "Freedom",
  },
  {
    title: "The Noncompliant Star",
    description:
      "Your top salesperson closes huge deals but routinely ignores compliance rules.",
    optionA: "Discipline them.",
    optionB: "Protect the revenue.",
    category: "Compliance",
  },
  {
    title: "The Leaked Memo",
    description:
      "An internal memo about planned layoffs leaks. Staff ask you if it's true.",
    optionA: "Confirm it.",
    optionB: "Say you can't comment.",
    category: "Honesty",
  },
  {
    title: "The Raise Request",
    description:
      "An employee threatens to quit unless they get a raise you can't give others.",
    optionA: "Give it.",
    optionB: "Refuse to set a precedent.",
    category: "Fairness",
  },
  {
    title: "The Data Breach",
    description:
      "Your company suffered a breach. Disclosure isn't legally required yet.",
    optionA: "Disclose now.",
    optionB: "Wait until it's required.",
    category: "Accountability",
  },
  {
    title: "The Political Customer",
    description:
      "A customer publicly holds views your staff find offensive. Staff want you to drop them.",
    optionA: "Drop the customer.",
    optionB: "Keep serving them.",
    category: "Freedom",
  },
  {
    title: "The Mentor's Secret",
    description:
      "Your mentor confides they're planning to leave and take clients with them.",
    optionA: "Warn the company.",
    optionB: "Keep the confidence.",
    category: "Loyalty",
  },
  {
    title: "The Accessibility Delay",
    description:
      "Making the product accessible will delay launch by three months.",
    optionA: "Delay.",
    optionB: "Launch now, fix later.",
    category: "Inclusion",
  },
  {
    title: "The Gig Workers",
    description:
      "Classifying drivers as employees would give them benefits but double your costs.",
    optionA: "Reclassify them.",
    optionB: "Keep them as contractors.",
    category: "Workforce",
  },
  {
    title: "The Board Seat",
    description:
      "You're offered a board seat at a company in an industry you think is harmful.",
    optionA: "Accept and push for change from inside.",
    optionB: "Decline.",
    category: "Purpose",
  },
  {
    title: "The Unpaid Trial",
    description:
      "Candidates are asked to complete a full day of unpaid 'trial work'.",
    optionA: "Keep the trial.",
    optionB: "Pay candidates or shorten it.",
    category: "Fairness",
  },
];

export const ALL_PACKS: { pkg: "JUNIOR_HIGH" | "HIGH_SCHOOL" | "UNIVERSITY" | "CORPORATE"; data: PackParadox[] }[] = [
  { pkg: "JUNIOR_HIGH", data: JUNIOR_HIGH_PACK },
  { pkg: "HIGH_SCHOOL", data: HIGH_SCHOOL_PACK },
  { pkg: "UNIVERSITY", data: UNIVERSITY_PACK },
  { pkg: "CORPORATE", data: CORPORATE_PACK },
];
