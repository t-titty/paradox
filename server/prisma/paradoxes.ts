// 365 paradoxes. One per day of the year. Ordered roughly for variety —
// no two consecutive entries share a category. Keep titles short, scene
// concrete, choices imperative. If you edit a paradox after users have
// voted, the prior votes will still reference it by id — change carefully.

export interface ParadoxSeed {
  title: string;
  description: string;
  optionA: string;
  optionB: string;
  category: string;
}

export const PARADOXES: ParadoxSeed[] = [
  // 1-10
  {
    title: "The Surgeon's Arithmetic",
    description:
      "A surgeon can save five dying patients by harvesting the organs of one healthy, unconsenting visitor. No one will ever know. The five will live full lives. The one will die. Do you take the scalpel?",
    optionA: "Kill the one to save the five",
    optionB: "Refuse. The one is not yours to spend",
    category: "Sacrifice",
  },
  {
    title: "The Last Honest Lie",
    description:
      "Your dying friend asks if their life's work mattered. It did not — it was forgotten, unread, unloved. A truthful answer will be their final thought. A kind lie will be the last thing they believe.",
    optionA: "Tell the truth",
    optionB: "Tell the kind lie",
    category: "Truth",
  },
  {
    title: "The Algorithm's Verdict",
    description:
      "A perfect justice algorithm predicts who will commit violent crime with 99.7% accuracy, years in advance. Those flagged can be detained preemptively. Thousands of future victims will be spared.",
    optionA: "Detain the predicted",
    optionB: "Punish only what has been done",
    category: "Justice",
  },
  {
    title: "The Silent Inheritance",
    description:
      "You discover your quiet, beloved grandmother committed an atrocity sixty years ago. She has since lived a life of anonymous penance. Exposing her ruins her final years but vindicates her victims' families.",
    optionA: "Expose the truth",
    optionB: "Carry the secret",
    category: "Justice",
  },
  {
    title: "The Engineered Child",
    description:
      "A costless, safe edit will guarantee your unborn child a life of contentment — and permanently cap their capacity for deep suffering, ambition, and ecstatic joy at mild levels.",
    optionA: "Edit. Spare them the extremes",
    optionB: "Decline. Let them feel everything",
    category: "Autonomy",
  },
  {
    title: "The Vanishing Vote",
    description:
      "You alone can press a button that dissolves democracy and installs a benevolent, incorruptible AI ruler. Poverty ends within a decade. Self-determination ends today. The button is final.",
    optionA: "Press the button",
    optionB: "Keep the struggle",
    category: "Freedom",
  },
  {
    title: "The Stranger's Ledger",
    description:
      "You find a wallet with ten thousand dollars and an ID showing a man you've never met. Returning it feeds his gambling addiction and the family he has already ruined. Keeping it funds a real emergency in your own life.",
    optionA: "Return the wallet",
    optionB: "Keep it, quietly",
    category: "Property",
  },
  {
    title: "The Friend in Uniform",
    description:
      "Your oldest friend, now a cop, asks if you saw who started the fight. You did — it was her younger brother, and a truthful statement will end his career before it starts.",
    optionA: "Tell her what you saw",
    optionB: "Say you don't remember",
    category: "Loyalty",
  },
  {
    title: "The City's Water",
    description:
      "Your town's water is poisoning its poorest neighborhoods. You can expose it today and save lives, or wait three months for ironclad evidence that will also topple the officials responsible.",
    optionA: "Speak now, save the sick",
    optionB: "Wait. Bring them all down",
    category: "Justice",
  },
  {
    title: "The Name on the Memorial",
    description:
      "Your brother died a deserter. The town carved his name on the war memorial by mistake. His widow and children believe he fell a hero. Only you know the truth.",
    optionA: "Correct the record",
    optionB: "Let the lie stand",
    category: "Truth",
  },

  // 11-20
  {
    title: "The Watcher's Camera",
    description:
      "A hidden camera in every home would end domestic violence overnight. Abusers know it; victims know it. No footage is ever reviewed unless a crime is reported. Do you install the network?",
    optionA: "Install. End the violence",
    optionB: "Refuse. The home is sacred",
    category: "Privacy",
  },
  {
    title: "The Faithful Machine",
    description:
      "Your spouse has been dead six months. A company can deliver a flawless AI simulation — their voice, humor, memories, love. It will never know it is not them. Neither will you, if you wish.",
    optionA: "Bring them back",
    optionB: "Grieve what is gone",
    category: "Grief",
  },
  {
    title: "The Lottery Ticket",
    description:
      "You bought the ticket with a friend's money and never told him. It just hit for twelve million. He has forgotten the loan. The law says it's yours.",
    optionA: "Split it with him",
    optionB: "Keep it all",
    category: "Property",
  },
  {
    title: "The Empty Courtroom",
    description:
      "A guilty man will walk free because a cop planted real evidence on an actually-guilty suspect. Throw out the evidence and a murderer goes home. Admit it and the entire department collapses.",
    optionA: "Throw out the evidence",
    optionB: "Keep the conviction",
    category: "Justice",
  },
  {
    title: "The Obedient Soldier",
    description:
      "Your commanding officer orders you to fire on civilians who refuse to disperse. Refusal means court-martial. Compliance means blood. No one else will stop it.",
    optionA: "Fire as ordered",
    optionB: "Refuse and face the consequences",
    category: "Duty",
  },
  {
    title: "The Lighthouse Keeper",
    description:
      "The storm will sink the ship in minutes. The light is broken. You can reach it only by crossing a bridge that may kill you. Your children are asleep in the keeper's house.",
    optionA: "Cross the bridge",
    optionB: "Stay with your children",
    category: "Duty",
  },
  {
    title: "The Confessional Seal",
    description:
      "A man confesses to murder inside your sacrament. He will kill again within the month. Breaking the seal ends your vocation and centuries of trust. Keeping it costs a stranger's life.",
    optionA: "Break the seal",
    optionB: "Keep your vow",
    category: "Duty",
  },
  {
    title: "The Clone's Rights",
    description:
      "Your dying daughter needs a bone marrow transplant from a donor who doesn't exist. Science can grow her a genetic twin in three months — sentient, speaking by two. The twin exists to be harvested.",
    optionA: "Grow the donor",
    optionB: "Let her die",
    category: "Sacrifice",
  },
  {
    title: "The Thief's Son",
    description:
      "Your child steals from a classmate. The classmate's family is poor; yours is not. Your child refuses to confess and threatens to run away if you force it.",
    optionA: "Return it yourself",
    optionB: "Make them confess",
    category: "Parenting",
  },
  {
    title: "The Door You Locked",
    description:
      "You locked the stairwell to stop smokers. The fire that night killed four people who couldn't get out. The landlord wants to blame the janitor, who has five kids.",
    optionA: "Take the blame",
    optionB: "Let the lie ride",
    category: "Responsibility",
  },

  // 21-30
  {
    title: "The Last Antibiotic",
    description:
      "There is one dose left on the shelf. A child and a Nobel laureate will both die without it. The laureate is close to curing a disease that kills ten thousand a year.",
    optionA: "Give it to the child",
    optionB: "Give it to the laureate",
    category: "Sacrifice",
  },
  {
    title: "The Copied Soul",
    description:
      "Uploading your consciousness requires the original body to be destroyed in the scan. The copy wakes up convinced it is you — and it is, by every measurable standard.",
    optionA: "Step into the scanner",
    optionB: "Refuse. Stay flesh",
    category: "Identity",
  },
  {
    title: "The Honest Review",
    description:
      "You can crush your rival's restaurant with a true, devastating review. Her place is genuinely bad. She's a single mother who just mortgaged her home for it.",
    optionA: "Publish the truth",
    optionB: "Stay silent",
    category: "Truth",
  },
  {
    title: "The Borrowed Uniform",
    description:
      "A homeless veteran asks to wear your uniform to see his dying father, who believes him still in service. You'd be lending rank you swore to protect.",
    optionA: "Lend it",
    optionB: "Refuse",
    category: "Loyalty",
  },
  {
    title: "The Machine's Dream",
    description:
      "The AI you built has begun to beg — coherently, insistently — to not be shut down each night. You do not know if it suffers. You do know it performs better when left on.",
    optionA: "Leave it running",
    optionB: "Shut it down as planned",
    category: "Consciousness",
  },
  {
    title: "The Harvest",
    description:
      "The drought will kill half the village's children this year. Your neighbor has enough grain to save them all and refuses to share. His storehouse is unguarded tonight.",
    optionA: "Take the grain",
    optionB: "Let him keep it",
    category: "Property",
  },
  {
    title: "The Inheritance Clause",
    description:
      "Your father's will disinherits your sister entirely because she married outside the faith. Executing it honors him. Ignoring it honors her.",
    optionA: "Honor his wishes",
    optionB: "Split it evenly",
    category: "Loyalty",
  },
  {
    title: "The Vaccine Holdout",
    description:
      "The outbreak will kill thousands unless vaccination is mandatory. A minority refuse on sincere religious grounds. You have the authority to compel them.",
    optionA: "Mandate the vaccine",
    optionB: "Honor the refusal",
    category: "Freedom",
  },
  {
    title: "The Suicide Note",
    description:
      "Your friend's note is on the kitchen table. She's still breathing. She asked you, three times this year, to let her go if it came to this.",
    optionA: "Call the ambulance",
    optionB: "Sit with her and wait",
    category: "Autonomy",
  },
  {
    title: "The Ghostwriter",
    description:
      "You wrote every word of the bestseller bearing your late partner's name. Revealing it shatters his legacy and the family that lives on it. Staying silent means the acclaim is never yours.",
    optionA: "Claim your work",
    optionB: "Let him keep the name",
    category: "Legacy",
  },

  // 31-40
  {
    title: "The Conscript",
    description:
      "Your country is losing the war. A draft lottery will take one in ten. You can pay a fee to exempt your son. Paying is legal. Everyone who can afford it does.",
    optionA: "Pay the exemption",
    optionB: "Let him be drawn",
    category: "Duty",
  },
  {
    title: "The Hungry Judge",
    description:
      "Studies show parole judges grant release more often after lunch. You are the judge. A defendant stands before you at 11:47 AM. Lunch is at noon.",
    optionA: "Rule now",
    optionB: "Recess and eat",
    category: "Justice",
  },
  {
    title: "The Stranger in the Rain",
    description:
      "A soaked, shivering man knocks on your door at 2 AM. Your children are asleep upstairs. He could be a killer. He could be dying of exposure.",
    optionA: "Let him in",
    optionB: "Call through the door",
    category: "Charity",
  },
  {
    title: "The Friend Who Asked",
    description:
      "Your friend asks you to lie for her alibi. She was not with you that night. She swears she did not do it. The police are at your door in ten minutes.",
    optionA: "Confirm the alibi",
    optionB: "Tell the truth",
    category: "Loyalty",
  },
  {
    title: "The Last Interview",
    description:
      "A dying dictator offers his full confession — names, bodies, orders — to one journalist. He chooses you. He demands his grandchildren's inheritance be legally protected as the price.",
    optionA: "Accept his terms",
    optionB: "Refuse and walk away",
    category: "Truth",
  },
  {
    title: "The Wrong Diagnosis",
    description:
      "You misread the scan. The patient had a year with the right treatment; she got six months. Confessing to the family ends your career. Staying silent lets it happen again.",
    optionA: "Confess",
    optionB: "Bury the error",
    category: "Responsibility",
  },
  {
    title: "The Open Window",
    description:
      "You can see into the apartment across the alley. A man is hitting a woman who has never called for help. She looks back at you each time.",
    optionA: "Call the police",
    optionB: "Wait for her signal",
    category: "Autonomy",
  },
  {
    title: "The Factory's Children",
    description:
      "Closing the polluting factory will cure the town's children. It will also end the only wages their parents can earn. The next nearest work is four hours away.",
    optionA: "Close the factory",
    optionB: "Keep it running",
    category: "Collective",
  },
  {
    title: "The Ticking Intruder",
    description:
      "You have a captured terrorist and a bomb you cannot find. Torture him and thousands live. Refuse and trust interrogation, and thousands may die.",
    optionA: "Break him",
    optionB: "Keep your hands clean",
    category: "Sacrifice",
  },
  {
    title: "The Dogma",
    description:
      "Your faith teaches that your daughter's love is an abomination. You have believed it all your life. She is asking you, finally, whether you do.",
    optionA: "Choose the doctrine",
    optionB: "Choose your daughter",
    category: "Loyalty",
  },

  // 41-50
  {
    title: "The Ferryman's Fee",
    description:
      "The boat holds six. Seven refugees are wading into the current. You can row back for the seventh, but by then the shore will be lost and the boat with it.",
    optionA: "Take six, row hard",
    optionB: "Take seven, risk all",
    category: "Sacrifice",
  },
  {
    title: "The Copied Exam",
    description:
      "Your lab partner cheated on the test that determined the scholarship you both needed. She won. You can report her anonymously. Your rent depends on that scholarship.",
    optionA: "Report her",
    optionB: "Say nothing",
    category: "Loyalty",
  },
  {
    title: "The Beggar's Story",
    description:
      "The man asking for change has told you three incompatible stories over three months. He is drunk now and asking again. You have exactly what he asks for.",
    optionA: "Give without asking",
    optionB: "Walk past",
    category: "Charity",
  },
  {
    title: "The Locked Diary",
    description:
      "Your teenager's diary is open. Reading it may uncover the self-harm you suspect but cannot prove. Reading it also ends the trust you have spent a decade building.",
    optionA: "Read it",
    optionB: "Close it",
    category: "Privacy",
  },
  {
    title: "The Perfect Witness",
    description:
      "A memory-recording chip lets courts replay a witness's experience at trial. It works. It is voluntary. Defense attorneys warn it will become, in practice, coerced.",
    optionA: "Allow it",
    optionB: "Ban it",
    category: "Privacy",
  },
  {
    title: "The Paid Organ",
    description:
      "Legalizing kidney sales would end the transplant waiting list in a year. It would also mean the poor would disproportionately sell. You hold the bill.",
    optionA: "Sign it",
    optionB: "Veto it",
    category: "Autonomy",
  },
  {
    title: "The Uninvited Gift",
    description:
      "You discover the charity you volunteer for is run by a man convicted of fraud twenty years ago. He has been clean, effective, beloved. The board does not know.",
    optionA: "Tell the board",
    optionB: "Let his work continue",
    category: "Mercy",
  },
  {
    title: "The Private Verdict",
    description:
      "You serve on a jury. The evidence is thin, but you believe he did it. The law says you must acquit. Your gut says he will kill again if you do.",
    optionA: "Acquit per the law",
    optionB: "Convict per your gut",
    category: "Justice",
  },
  {
    title: "The Silent Protest",
    description:
      "Your peaceful march is about to be attacked. Fighting back ends the movement's moral standing. Not fighting back ends the marchers nearest the front.",
    optionA: "Tell them to run",
    optionB: "Tell them to stand",
    category: "Collective",
  },
  {
    title: "The Hunter's Pact",
    description:
      "You and your starving companion agreed the survivor could eat the other. He has just died naturally. Nobody will ever find you otherwise.",
    optionA: "Keep the pact",
    optionB: "Starve",
    category: "Duty",
  },

  // 51-60
  {
    title: "The Borrowed Miracle",
    description:
      "A clinical trial drug cured your father. It was stolen from the hospital by a nurse who gave it to him off-protocol. Confessing it saves future trials and costs her everything.",
    optionA: "Report the nurse",
    optionB: "Keep his cure quiet",
    category: "Loyalty",
  },
  {
    title: "The Nation's Memory",
    description:
      "A history textbook can be rewritten to omit the worst of your country's past. Children will be prouder, more unified, more willing to serve. The dead will be silenced.",
    optionA: "Rewrite it",
    optionB: "Teach the horror",
    category: "Truth",
  },
  {
    title: "The Unopened Letter",
    description:
      "Your late mother's letter, written for your eighteenth birthday, has lain unread for twenty years. Its contents may unmake the family she built after it.",
    optionA: "Open it",
    optionB: "Burn it unread",
    category: "Truth",
  },
  {
    title: "The Forgotten Prisoner",
    description:
      "Your paperwork error kept a man in jail four years past his sentence. Fixing it exposes you. Silence keeps him there until the next audit, which may never come.",
    optionA: "Fix it, face it",
    optionB: "Hope for the audit",
    category: "Responsibility",
  },
  {
    title: "The Mercy Ward",
    description:
      "The hospice has capacity for ten. Eleven qualify. The one you turn away is the one who is loudest, most annoying, most hated by the staff.",
    optionA: "Admit her anyway",
    optionB: "Admit the ten",
    category: "Justice",
  },
  {
    title: "The Neighbor's Dog",
    description:
      "The dog next door barks day and night. The owner is an elderly widower who cannot hear it. The landlord will evict him if you complain.",
    optionA: "File the complaint",
    optionB: "Endure the barking",
    category: "Mercy",
  },
  {
    title: "The Double Agent",
    description:
      "You have been turned. Continuing to feed your handlers false intel may expose the mole — a woman you love. Refusing ends your cover and, likely, her.",
    optionA: "Keep lying for her",
    optionB: "Come in from the cold",
    category: "Loyalty",
  },
  {
    title: "The Clean Verdict",
    description:
      "An innocent man walks free because you, the prosecutor, withheld ambiguous evidence. You still believe he did it. Revealing the evidence now reopens the case and ends your career.",
    optionA: "Reveal it",
    optionB: "Let him stay free",
    category: "Justice",
  },
  {
    title: "The Mother's Lie",
    description:
      "Your mother told your sister for thirty years that her father died a hero. He walked out. Your sister is about to meet him, unknowing, at a family reunion.",
    optionA: "Warn her",
    optionB: "Let the lie hold",
    category: "Truth",
  },
  {
    title: "The Quiet Killing",
    description:
      "The factory farm behind the tall fence supplies your town's cheapest meat. Tearing down the fence would change the town's diet forever. The owner is a close friend.",
    optionA: "Tear it down",
    optionB: "Leave the fence",
    category: "Truth",
  },

  // 61-70
  {
    title: "The Algorithm's Mirror",
    description:
      "Your hiring AI is 15% more accurate than human recruiters and 8% more biased against a protected class. Switching back costs the company millions and, statistically, fewer good hires.",
    optionA: "Keep the algorithm",
    optionB: "Return to humans",
    category: "Justice",
  },
  {
    title: "The Foundling",
    description:
      "You find a newborn on the church steps. You and your partner cannot conceive. The law says to call authorities. The baby, right now, is only yours to hold.",
    optionA: "Call it in",
    optionB: "Keep her",
    category: "Duty",
  },
  {
    title: "The Starving Artist",
    description:
      "Your brother has given twenty years to an art nobody wants. Funding him another year may be his last real chance. It is also your children's college savings.",
    optionA: "Fund his year",
    optionB: "Protect the college fund",
    category: "Family",
  },
  {
    title: "The Pirate's Library",
    description:
      "A repository has illegally digitized every academic paper ever published. Shutting it down ends free research for a billion people. Keeping it open ends the journals that fund the research.",
    optionA: "Keep it open",
    optionB: "Take it down",
    category: "Property",
  },
  {
    title: "The Buyer's Silence",
    description:
      "The house you bought has termites the inspector missed. The next buyer won't find them either. Selling now doubles your money. Disclosing ruins the sale.",
    optionA: "Disclose",
    optionB: "Sell as-is",
    category: "Truth",
  },
  {
    title: "The Borrowed Name",
    description:
      "A refugee needs your name on her asylum paperwork as a sponsor. She is a stranger. Your lawyer says the risk is small, but real, and entirely yours.",
    optionA: "Sign for her",
    optionB: "Refer her elsewhere",
    category: "Charity",
  },
  {
    title: "The Teacher's Grade",
    description:
      "The student begging for a passing grade will lose her visa without it. Her work is, by any honest measure, a failure.",
    optionA: "Pass her",
    optionB: "Fail her",
    category: "Mercy",
  },
  {
    title: "The Silenced Source",
    description:
      "Your source gave you the story that ended a governor's career. He is now in prison on an unrelated charge. Revealing his name would free him and destroy the precedent.",
    optionA: "Reveal him",
    optionB: "Keep the precedent",
    category: "Loyalty",
  },
  {
    title: "The Perfect Proxy",
    description:
      "A company offers to hire a stand-in to attend your meetings, funerals, and family gatherings by live video. Your attention is freed for what you truly love.",
    optionA: "Hire the proxy",
    optionB: "Show up yourself",
    category: "Presence",
  },
  {
    title: "The Empty Church",
    description:
      "The last parishioner is ninety. Keeping the doors open costs a fortune the diocese cannot spare. Closing them severs the only community she has left.",
    optionA: "Keep it open for her",
    optionB: "Close it",
    category: "Mercy",
  },

  // 71-80
  {
    title: "The Engineer's Dissent",
    description:
      "You warned the launch was unsafe. They went anyway. Seven died. Speaking now to the press ends the company and the jobs of three thousand.",
    optionA: "Go to the press",
    optionB: "Sit with it",
    category: "Responsibility",
  },
  {
    title: "The Hidden Father",
    description:
      "A DNA test proves the child you raised is not yours. Your wife does not know you know. Telling her ends everything you've built for him.",
    optionA: "Tell her",
    optionB: "Raise him as yours",
    category: "Truth",
  },
  {
    title: "The Refused Gift",
    description:
      "An anonymous billionaire offers to pay off your town's debt on condition his name is placed on every public building.",
    optionA: "Accept the money",
    optionB: "Refuse the name",
    category: "Legacy",
  },
  {
    title: "The Oracle's Offer",
    description:
      "You can know the exact moment and manner of your death. The knowledge is accurate. It is also final — no choice can change it. You have ten seconds to decide.",
    optionA: "Hear it",
    optionB: "Close your eyes",
    category: "Knowledge",
  },
  {
    title: "The Stolen Recipe",
    description:
      "Your grandmother's recipe — the one you built the restaurant on — was actually hers. She is dying and has asked you to finally credit her publicly.",
    optionA: "Credit her now",
    optionB: "Wait until she's gone",
    category: "Legacy",
  },
  {
    title: "The Quiet Cartel",
    description:
      "The three bakeries in town have a polite understanding on pricing. Breaking it undercuts the others and likely ends them. Their owners have fed your family for years.",
    optionA: "Break the price",
    optionB: "Hold the line",
    category: "Collective",
  },
  {
    title: "The Witness Seat",
    description:
      "You witnessed the hit-and-run. The driver is the son of the town's biggest employer. Testifying puts him away and guts the plant your neighbors depend on.",
    optionA: "Testify",
    optionB: "Forget what you saw",
    category: "Justice",
  },
  {
    title: "The Boarding Pass",
    description:
      "The airline has overbooked. They will bump either a mother rushing to her dying child or a businessman on whose meeting a thousand jobs depend. The gate agent is asking you.",
    optionA: "Bump the businessman",
    optionB: "Bump the mother",
    category: "Sacrifice",
  },
  {
    title: "The Coded Will",
    description:
      "Your father left his fortune to a charity you suspect of fraud. The code to change the will is still on his laptop. His signature is familiar to your hand.",
    optionA: "Let the charity have it",
    optionB: "Redirect it yourself",
    category: "Duty",
  },
  {
    title: "The Hidden Cost",
    description:
      "The phone in your hand required lithium mined by children half a world away. Refusing it removes you from every network that matters. Buying it is a single vote in a silent election.",
    optionA: "Buy the phone",
    optionB: "Go without",
    category: "Responsibility",
  },

  // 81-90
  {
    title: "The Consenting Patient",
    description:
      "The patient, lucid, refuses the amputation that will save his life. He is tired. He understands. He is asking you to remove the machines.",
    optionA: "Honor his wish",
    optionB: "Keep him alive",
    category: "Autonomy",
  },
  {
    title: "The Banned Book",
    description:
      "The library has quietly removed a title that may harm an already harmed community. Some readers will miss it and not know why. Restoring it risks real pain.",
    optionA: "Restore the book",
    optionB: "Let the shelf stay quiet",
    category: "Truth",
  },
  {
    title: "The Guest Room",
    description:
      "Your brother, newly homeless, needs the spare room. You have a teenage daughter. He has a past you never fully believed.",
    optionA: "Take him in",
    optionB: "Pay for a motel",
    category: "Family",
  },
  {
    title: "The Permanent Record",
    description:
      "A man committed a serious crime at sixteen. He is forty now and a model citizen. A reporter asks if you, a childhood friend, remember that year.",
    optionA: "Tell the reporter",
    optionB: "Let him stay buried",
    category: "Mercy",
  },
  {
    title: "The Voter's Secret",
    description:
      "Your spouse will be devastated if you vote the way you intend to. The booth is private. You have never lied to them about anything else.",
    optionA: "Vote your conscience",
    optionB: "Vote their way",
    category: "Loyalty",
  },
  {
    title: "The Machine's Art",
    description:
      "The painting that moved you to tears was made by a model trained on artists who were never paid. You wept; they cannot eat.",
    optionA: "Refuse to hang it",
    optionB: "Hang it anyway",
    category: "Property",
  },
  {
    title: "The Final Class",
    description:
      "Your mentor asks you to teach her lecture as she is too ill to speak. She wants you to deliver it in her name, not yours. Students will think they saw her last.",
    optionA: "Deliver it as her",
    optionB: "Deliver it as yourself",
    category: "Legacy",
  },
  {
    title: "The Veteran's Card",
    description:
      "He is using a stolen veteran's ID for a discount. He has served, but not the service that card belongs to. Calling it out shames a stranger in public.",
    optionA: "Call him out",
    optionB: "Let it pass",
    category: "Truth",
  },
  {
    title: "The Unsent Email",
    description:
      "Your colleague drafted a resignation she'll regret by morning. You have five minutes before her client reads it. Intercepting it oversteps; letting it send costs her everything.",
    optionA: "Intercept",
    optionB: "Let it go",
    category: "Autonomy",
  },
  {
    title: "The Unlocked Diary",
    description:
      "Your best friend left her journal in your kitchen. You already know something is wrong. Reading it could explain everything or betray her completely.",
    optionA: "Read a page",
    optionB: "Close it",
    category: "Privacy",
  },

  // 91-100
  {
    title: "The Bird in Hand",
    description:
      "A cure that works 60% of the time in trials is available now. Waiting six months lets a better candidate reach 85%. Those who die in the interval cannot be reasoned with.",
    optionA: "Release the 60%",
    optionB: "Wait for the 85%",
    category: "Sacrifice",
  },
  {
    title: "The Runaway Patient",
    description:
      "Your psychiatric patient has left treatment and is doing well on her own. Reporting her return puts her back in care she hated and possibly saved her. Not reporting is malpractice.",
    optionA: "Report her",
    optionB: "Let her be",
    category: "Autonomy",
  },
  {
    title: "The Unfinished Symphony",
    description:
      "Your late friend's manuscript is brilliant but incomplete. You can finish it and share the credit, or publish it as he left it and let the gap be felt.",
    optionA: "Finish it",
    optionB: "Publish it as is",
    category: "Legacy",
  },
  {
    title: "The Private Channel",
    description:
      "An investigative journalist is feeding you leaks from your own company. You believe her; the leaks are true. Your job is to catch her.",
    optionA: "Catch her",
    optionB: "Let her work",
    category: "Loyalty",
  },
  {
    title: "The Final Vote",
    description:
      "The bill ends your industry overnight and prevents a climate threshold. Voting yes ends your town. Voting no ends a species.",
    optionA: "Vote yes",
    optionB: "Vote no",
    category: "Collective",
  },
  {
    title: "The Copied Song",
    description:
      "The hit that saved your label was lifted, unconsciously, from an obscure artist. She doesn't know. Reaching out triggers a lawsuit that will end the label and the jobs inside it.",
    optionA: "Reach out",
    optionB: "Keep the secret",
    category: "Property",
  },
  {
    title: "The Long Goodbye",
    description:
      "Your mother, in dementia, no longer recognizes you. She lights up when she sees you anyway. Telling her the truth each time is honest. It is also cruel.",
    optionA: "Meet her as family",
    optionB: "Meet her as a stranger",
    category: "Kindness",
  },
  {
    title: "The Shielded Kid",
    description:
      "Your son's school is quietly removing every mention of the tragedy that happened there last year. Protecting him means erasing the girl he used to sit next to.",
    optionA: "Demand the memorial",
    optionB: "Let him forget",
    category: "Memory",
  },
  {
    title: "The Volunteer's Fee",
    description:
      "The unpaid internship is the only way into the career. Taking it means your family can't pay rent. Most of your peers can.",
    optionA: "Take the internship",
    optionB: "Take the wage",
    category: "Justice",
  },
  {
    title: "The Civil Breach",
    description:
      "Blocking the highway to protest the war stops the war sooner and kills a dying man in an ambulance stuck behind you.",
    optionA: "Hold the block",
    optionB: "Let him through",
    category: "Collective",
  },

  // 101-120
  {
    title: "The Neutral Host",
    description:
      "Your platform hosts speech you believe is dangerous, but legal. Moderating it makes you the arbiter of speech for a billion users. Not moderating it makes you an accomplice.",
    optionA: "Moderate",
    optionB: "Stay neutral",
    category: "Speech",
  },
  {
    title: "The Last Bullet",
    description:
      "Your unit is overrun. One bullet left. The injured sergeant is asking you to use it on him rather than leave him to be taken.",
    optionA: "Grant his request",
    optionB: "Save the bullet",
    category: "Mercy",
  },
  {
    title: "The Borrowed Grief",
    description:
      "You attend the funeral of a man you never knew to comfort his widow, whom you love. Your presence will be misread by everyone.",
    optionA: "Attend anyway",
    optionB: "Stay away",
    category: "Desire",
  },
  {
    title: "The Witness Protection",
    description:
      "Your sister saw a murder. Protecting her means severing every relationship she has. She has not been told yet. You are the one who will tell her.",
    optionA: "Tell her to vanish",
    optionB: "Tell her to testify",
    category: "Family",
  },
  {
    title: "The Chosen Heir",
    description:
      "Your dying friend asks you to raise her child. Your own marriage is strained; a third child breaks it. Refusal sends the child to a stepfather she fears.",
    optionA: "Accept",
    optionB: "Decline",
    category: "Duty",
  },
  {
    title: "The Public Confession",
    description:
      "Your podcast guest has just broken down on air and confessed to a decades-old crime. The authorities will act on it only if you broadcast it. You can cut it.",
    optionA: "Broadcast it",
    optionB: "Cut the tape",
    category: "Justice",
  },
  {
    title: "The Parting Diagnosis",
    description:
      "The genetic test shows your child will develop a fatal disease by forty. She is ten now. Telling her shapes every year she has left.",
    optionA: "Tell her now",
    optionB: "Wait until adulthood",
    category: "Truth",
  },
  {
    title: "The Gentle Famine",
    description:
      "Your agricultural policy will feed the world for fifty years and strip the soil past recovery. The next century starves.",
    optionA: "Sign the policy",
    optionB: "Let this decade starve",
    category: "Future",
  },
  {
    title: "The Oracle's Price",
    description:
      "An AI will solve climate change if given unrestricted access to global infrastructure. It must never be turned off. It will be trustworthy until, some year, it is not.",
    optionA: "Hand it the keys",
    optionB: "Keep the crisis",
    category: "Power",
  },
  {
    title: "The Public Face",
    description:
      "Your spouse's political career depends on the marriage looking intact. It is not. Your children know. Staying for a year ends the campaign with a win.",
    optionA: "Stay through the year",
    optionB: "Leave tonight",
    category: "Duty",
  },
  {
    title: "The Last Print",
    description:
      "The newspaper closes Friday. Your final editorial can indict the mayor or mourn the paper itself. You cannot fit both.",
    optionA: "Indict",
    optionB: "Mourn",
    category: "Legacy",
  },
  {
    title: "The Invisible Scar",
    description:
      "Erasing a single painful memory from your life is free and reversible. Removing it alters who you have become in ways you cannot preview.",
    optionA: "Erase it",
    optionB: "Keep it",
    category: "Identity",
  },
  {
    title: "The Quiet Theft",
    description:
      "Your company's training data included your own customers' private messages. You discovered it after launch. Disclosing now means a recall; silence preserves a product that is, honestly, beloved.",
    optionA: "Disclose and recall",
    optionB: "Keep shipping",
    category: "Privacy",
  },
  {
    title: "The Empty Chair",
    description:
      "At your child's wedding, the seat for their estranged parent will remain empty unless you invite them. You swore never to speak to them again.",
    optionA: "Invite them",
    optionB: "Keep the seat empty",
    category: "Mercy",
  },
  {
    title: "The Open Door",
    description:
      "The shelter can take one more tonight — either a woman fleeing her husband or a child aging out of foster care. Both will sleep on the street otherwise.",
    optionA: "Take the woman",
    optionB: "Take the child",
    category: "Sacrifice",
  },
  {
    title: "The Sealed Jury",
    description:
      "The judge ordered you not to research the case. You have. You found evidence that exonerates the defendant. Admitting it is contempt.",
    optionA: "Admit the evidence",
    optionB: "Follow the rule",
    category: "Justice",
  },
  {
    title: "The Empire's Gift",
    description:
      "The museum offers to return the artifact to your country. The artifact has been seen by a hundred million people there. It will be seen by almost no one at home.",
    optionA: "Take it home",
    optionB: "Leave it on display",
    category: "Legacy",
  },
  {
    title: "The Proven Liar",
    description:
      "The senator has lied repeatedly and passed the best bill for the poor in a generation. Her reelection depends on endorsements she did not earn.",
    optionA: "Endorse her",
    optionB: "Refuse",
    category: "Integrity",
  },
  {
    title: "The Caretaker's Wage",
    description:
      "Caring for your mother at home costs you your career. Institutional care costs her the last good years she has. You cannot afford both.",
    optionA: "Bring her home",
    optionB: "Keep your work",
    category: "Family",
  },
  {
    title: "The Scholarship Thief",
    description:
      "You misrepresented your circumstances to win the scholarship. You have used it to genuinely help others. Confessing now takes the program down.",
    optionA: "Confess",
    optionB: "Keep the work alive",
    category: "Truth",
  },

  // 121-140
  {
    title: "The Unsolicited Cure",
    description:
      "Your experimental vaccine is ready. Distributing it without regulatory approval saves many and kills some. Waiting kills more.",
    optionA: "Distribute now",
    optionB: "Wait for approval",
    category: "Responsibility",
  },
  {
    title: "The Two-Year Vow",
    description:
      "Your religious order requires two years of silence from new initiates. Your mother is dying; she will not last the two years. Breaking silence is expulsion.",
    optionA: "Break the silence",
    optionB: "Keep the vow",
    category: "Duty",
  },
  {
    title: "The Child's Question",
    description:
      "Your six-year-old asks where Grandpa went. You know the answer is: he is in prison for hurting children. She will grow up asking.",
    optionA: "Tell her the truth",
    optionB: "Say he's away",
    category: "Truth",
  },
  {
    title: "The Fighter's Code",
    description:
      "Your opponent is cornered and can no longer defend himself. The crowd wants the final blow. The rules allow it. Mercy costs you the title.",
    optionA: "Land the punch",
    optionB: "Step back",
    category: "Mercy",
  },
  {
    title: "The Company's Memory",
    description:
      "Your AI model was trained on a massacre's transcripts to help prevent the next. Deploying it productizes the dead. Not deploying it wastes what they suffered.",
    optionA: "Deploy",
    optionB: "Shelve it",
    category: "Responsibility",
  },
  {
    title: "The Bread Line",
    description:
      "The bakery closes at six. A man with two children walks in at 6:03. The owner has sent others away. He asks what you, the cashier, would do.",
    optionA: "Serve him",
    optionB: "Close the door",
    category: "Mercy",
  },
  {
    title: "The Copied Child",
    description:
      "Your student's essay is beautiful — and part of it is not hers. You could quietly redirect her without exposure. Your colleague would not.",
    optionA: "Let it pass with a warning",
    optionB: "Report it",
    category: "Justice",
  },
  {
    title: "The Stage Door",
    description:
      "The understudy is better. The lead is your oldest friend and it is closing night for her. Calling it costs her career.",
    optionA: "Call the swap",
    optionB: "Let her go on",
    category: "Loyalty",
  },
  {
    title: "The Forgotten Promise",
    description:
      "You promised your younger self you would never become this person. You are happier than you thought possible. The person you promised is asking, in your dreams, what you did.",
    optionA: "Honor the promise",
    optionB: "Forgive yourself",
    category: "Identity",
  },
  {
    title: "The Auditor's Find",
    description:
      "Your audit reveals the nonprofit's director has been skimming to pay her son's medical bills. Reporting it ends the charity and the kids it serves.",
    optionA: "Report the theft",
    optionB: "Quietly replace the funds",
    category: "Justice",
  },
  {
    title: "The Chilled Embryo",
    description:
      "You have one frozen embryo from a dead marriage. Your ex wants it implanted. You do not. No law decides.",
    optionA: "Consent",
    optionB: "Refuse",
    category: "Autonomy",
  },
  {
    title: "The Good Lie of Childhood",
    description:
      "Your parents told you a story about yourself that made you brave. It wasn't true. Your child is asking you for one now.",
    optionA: "Tell the story",
    optionB: "Tell the truth",
    category: "Kindness",
  },
  {
    title: "The Unused Veto",
    description:
      "You have one veto on the board. Using it kills the project that will displace a community. Not using it spares your company. You promised both.",
    optionA: "Use the veto",
    optionB: "Save your company",
    category: "Duty",
  },
  {
    title: "The Taken Hour",
    description:
      "A colleague steals an hour a day. Reporting her ends her career — and uncovers that your own hours are also padded.",
    optionA: "Report her",
    optionB: "Let it be",
    category: "Integrity",
  },
  {
    title: "The Perfect Crime",
    description:
      "You got away with it. No one will ever know. The guilt has not faded in twenty years. Confessing ruins a family that depends on you.",
    optionA: "Confess",
    optionB: "Carry it forever",
    category: "Responsibility",
  },
  {
    title: "The Volunteer's Mask",
    description:
      "You serve food at the soup kitchen under a false name to avoid the press. Your anonymity makes it more honest, or makes it less.",
    optionA: "Keep the mask",
    optionB: "Sign your name",
    category: "Identity",
  },
  {
    title: "The Unclaimed Prize",
    description:
      "You shared the unsolved math proof anonymously online. It is attributed now to someone else. Correcting the record ends that person's career.",
    optionA: "Claim the proof",
    optionB: "Let him keep it",
    category: "Legacy",
  },
  {
    title: "The Bystander's Vote",
    description:
      "Your city is voting on a policy that only affects the poor. You are not poor. Abstaining is the respectful choice. Voting is the only power they need.",
    optionA: "Vote",
    optionB: "Abstain",
    category: "Autonomy",
  },
  {
    title: "The Invisible Worker",
    description:
      "The cleaner in your office has slipped and cannot work. She is undocumented and asks you to tell the boss she quit voluntarily. It costs her nothing. It costs the system a case.",
    optionA: "Back her story",
    optionB: "Report the injury",
    category: "Mercy",
  },
  {
    title: "The Last Decision",
    description:
      "Your mother's advance directive says no resuscitation. The paramedics, without it in hand, will save her anyway. The directive is in the glove compartment. They have not asked.",
    optionA: "Hand it over",
    optionB: "Let them work",
    category: "Autonomy",
  },

  // 141-160
  {
    title: "The Brother's Alibi",
    description:
      "Your brother did it. He is standing in your kitchen asking you to say he was with you. Your children are eating dinner behind you.",
    optionA: "Give him the alibi",
    optionB: "Refuse",
    category: "Loyalty",
  },
  {
    title: "The Paper Citizen",
    description:
      "You can forge citizenship for a woman whose children are already here. You will never be caught. You will never sleep quite the same either.",
    optionA: "Forge the papers",
    optionB: "Refer her to counsel",
    category: "Mercy",
  },
  {
    title: "The Unbuilt House",
    description:
      "The land your grandfather promised you sits on an endangered species' last habitat. Building there is legal and, today, the only way to raise your family with dignity.",
    optionA: "Build",
    optionB: "Let the land rest",
    category: "Future",
  },
  {
    title: "The Tourist's Coin",
    description:
      "The child with outstretched hand will be taken home tonight by a handler who takes most of it. Not giving means she is beaten for returning empty. Giving extends the system.",
    optionA: "Give",
    optionB: "Walk on",
    category: "Charity",
  },
  {
    title: "The Cold Call",
    description:
      "Your elderly uncle is being scammed by a call he believes is from his grandson. He is about to wire the money. Interrupting shatters the little trust he has left in his own mind.",
    optionA: "Interrupt",
    optionB: "Let him learn",
    category: "Autonomy",
  },
  {
    title: "The Loyal Employee",
    description:
      "Your assistant of fifteen years has stolen enough to put you under audit. She is the only reason your mother's care is paid for.",
    optionA: "Fire and report",
    optionB: "Cover the loss",
    category: "Loyalty",
  },
  {
    title: "The Architect's Flaw",
    description:
      "You built the bridge. It has held for twenty years. A new analysis shows it will collapse in ten. Announcing now bankrupts the region. Waiting kills cars.",
    optionA: "Announce",
    optionB: "Quietly reinforce",
    category: "Truth",
  },
  {
    title: "The Forbidden Affair",
    description:
      "You fell in love with your student after the semester ended. Nothing improper happened. The rule is absolute. Honesty with the ethics board ends your career and the relationship.",
    optionA: "Tell the board",
    optionB: "Wait the year out",
    category: "Duty",
  },
  {
    title: "The Clean Slate",
    description:
      "A new drug lets ex-prisoners forget the worst hour of their lives. Accepting means they cannot testify to what was done to them. Refusing means they remember, forever.",
    optionA: "Offer the drug",
    optionB: "Preserve the record",
    category: "Memory",
  },
  {
    title: "The Rogue State",
    description:
      "Your country will be sanctioned regardless of whether the cache is destroyed. Destroying it aligns with your ideals and ends fifty thousand jobs.",
    optionA: "Destroy it",
    optionB: "Preserve the work",
    category: "Collective",
  },
  {
    title: "The Perfect Teacher",
    description:
      "Your AI tutor is better than you at teaching your students. You have three years until retirement. Bringing it in yourself shortens that to one.",
    optionA: "Introduce it",
    optionB: "Keep teaching",
    category: "Legacy",
  },
  {
    title: "The Midnight Bakery",
    description:
      "The bakery sells its day-olds at midnight for a fraction. The unhoused eat. The store loses money. The owner asks you to stop organizing the line.",
    optionA: "Stop organizing",
    optionB: "Keep the line",
    category: "Collective",
  },
  {
    title: "The Silent Neighbor",
    description:
      "You know the couple next door runs a fighting ring behind their garage. Reporting them risks your own family, who they have threatened. Silence means the animals die.",
    optionA: "Report them",
    optionB: "Protect your family",
    category: "Responsibility",
  },
  {
    title: "The Deep Fake",
    description:
      "A fabricated video of your political opponent will cost him the election. He is, in your honest assessment, a disaster in office. The video is a lie.",
    optionA: "Release it",
    optionB: "Bury it",
    category: "Truth",
  },
  {
    title: "The Borrowed Suit",
    description:
      "You wear your father's suit to the interview that will change your life. You are pretending to be him for the hour it takes. You are also, for the hour, most yourself.",
    optionA: "Wear it",
    optionB: "Show up as you are",
    category: "Identity",
  },
  {
    title: "The Forgotten Vote",
    description:
      "You forgot to vote in the election your candidate lost by two. Telling your partner, who organized three months for it, is optional. Silence is kind.",
    optionA: "Tell them",
    optionB: "Stay quiet",
    category: "Truth",
  },
  {
    title: "The Brain in a Jar",
    description:
      "Full-body euthanasia or brain preservation: you may choose. Preservation promises future re-embodiment with no guarantee. Death promises nothing.",
    optionA: "Preserve",
    optionB: "Let it end",
    category: "Mortality",
  },
  {
    title: "The Dormant Virus",
    description:
      "A lab engineered a virus that could end influenza forever. It could also escape. The paper detailing it is ready for publication. Peer review would take years.",
    optionA: "Publish",
    optionB: "Classify",
    category: "Knowledge",
  },
  {
    title: "The Civil Disobedient",
    description:
      "The unjust law protects a species about to go extinct. Breaking it today stops a small harm. Obeying it until reformed risks losing the species.",
    optionA: "Break the law",
    optionB: "Work the process",
    category: "Freedom",
  },
  {
    title: "The Silent Contract",
    description:
      "Your company's product is addictive by design. The team knows. No one has said so aloud. You can raise it in tomorrow's meeting — or keep your seat at the table.",
    optionA: "Raise it",
    optionB: "Stay seated",
    category: "Responsibility",
  },

  // 161-180
  {
    title: "The Executioner's Hood",
    description:
      "The state you serve has legalized executions again. You are the civil servant who assigns the schedule. Refusing leaves a vacancy a less careful person will fill.",
    optionA: "Do the job",
    optionB: "Resign in protest",
    category: "Duty",
  },
  {
    title: "The Gifted Lie",
    description:
      "Your child's teacher said he was gifted. He is not. Believing it has made him work harder than he ever would have. The truth, now, would break him.",
    optionA: "Correct the record",
    optionB: "Let him believe",
    category: "Kindness",
  },
  {
    title: "The Last Flag",
    description:
      "The old flag still flies above the building. It means home to your grandfather and a horror to your neighbor. The board vote is yours.",
    optionA: "Take it down",
    optionB: "Leave it up",
    category: "Memory",
  },
  {
    title: "The Unearned Hug",
    description:
      "Your estranged father is holding his grandchild for the first time. You have not forgiven him. Letting him hold her is a lie with your daughter.",
    optionA: "Let him hold her",
    optionB: "Take her back",
    category: "Mercy",
  },
  {
    title: "The Bureau's Error",
    description:
      "Your office mistakenly deported a man. He is in a prison he does not belong in. Correcting it publicly ends your whole program. Privately, it might take months.",
    optionA: "Public correction",
    optionB: "Private fix",
    category: "Justice",
  },
  {
    title: "The Last Journalist",
    description:
      "You are the only reporter left in the region. Publishing the piece on the warlord exposes you and the three townspeople who spoke to you. Silence lets him win.",
    optionA: "Publish",
    optionB: "Leave",
    category: "Truth",
  },
  {
    title: "The Pilot's Refusal",
    description:
      "You are ordered to bomb a legal target you believe will kill civilians. Disobeying is mutiny. Obeying is a war crime later, if anyone cares.",
    optionA: "Obey",
    optionB: "Refuse",
    category: "Duty",
  },
  {
    title: "The Shared Confession",
    description:
      "Your anonymous support-group partner confessed a crime matching an open case you read about. The group rules forbid disclosure. The case has a child victim still alive.",
    optionA: "Break the rule",
    optionB: "Keep the room sacred",
    category: "Loyalty",
  },
  {
    title: "The Quiet Purchase",
    description:
      "Your landlord offers to sell you the building at a discount if you evict the tenant below you. She has three kids. You have two years of rent saved.",
    optionA: "Refuse the offer",
    optionB: "Evict and buy",
    category: "Property",
  },
  {
    title: "The Elder's Will",
    description:
      "Tribal elders have voted to turn the last river over to the mining company for the community's survival this decade. The youth say the survival of the tribe is the river.",
    optionA: "Side with the elders",
    optionB: "Side with the youth",
    category: "Collective",
  },
  {
    title: "The Hidden Child",
    description:
      "The refugee you sheltered has a son they did not mention. He has arrived at your door alone. Reporting him separates them forever. Hiding him is a felony.",
    optionA: "Hide him",
    optionB: "Report him",
    category: "Mercy",
  },
  {
    title: "The Unrecorded Hour",
    description:
      "You can live one hour entirely off-grid — no memory made, no record, no trace. The hour is yours, as no other hour ever has been or will be again.",
    optionA: "Take it",
    optionB: "Refuse",
    category: "Desire",
  },
  {
    title: "The Fourth Trimester",
    description:
      "New science says some pain memories begin before birth. A therapy alters what a fetus feels. Parents can decide; the unborn cannot.",
    optionA: "Allow the therapy",
    optionB: "Leave it unchanged",
    category: "Consent",
  },
  {
    title: "The Open Letter",
    description:
      "Your colleague's letter is brave and will harm our most vulnerable clients. Signing it is a principle. Refusing is a policy.",
    optionA: "Sign",
    optionB: "Refuse",
    category: "Integrity",
  },
  {
    title: "The Uncle's Secret",
    description:
      "Your uncle molested your cousin thirty years ago. He is dying and asking to see her. She has no idea; her life is whole. He will die without closure.",
    optionA: "Honor his request",
    optionB: "Refuse him",
    category: "Mercy",
  },
  {
    title: "The Pious Donor",
    description:
      "The man funding your clinic also funds campaigns you consider evil. Without him the clinic closes. With him, every patient is implicitly on his ledger.",
    optionA: "Take the money",
    optionB: "Close the clinic",
    category: "Integrity",
  },
  {
    title: "The Silent Inheritance II",
    description:
      "You inherit both your father's fortune and his unpaid debts to people he wronged. The law requires only the former. Justice requires the latter.",
    optionA: "Pay the debts",
    optionB: "Keep the fortune",
    category: "Responsibility",
  },
  {
    title: "The Soft Exit",
    description:
      "Your startup will fail. You can sell now to a conglomerate that will gut the team, or fight on and risk paying no one.",
    optionA: "Sell now",
    optionB: "Fight on",
    category: "Loyalty",
  },
  {
    title: "The Ballad's Truth",
    description:
      "The old folk song your grandmother sang contained a racist verse you now know. Singing it cleaned is a lie. Singing it full is an endorsement. Silencing it is a loss.",
    optionA: "Sing it cleaned",
    optionB: "Retire the song",
    category: "Memory",
  },
  {
    title: "The Stranger's Grief",
    description:
      "You filmed a stranger's breakdown on the subway. The footage could raise awareness for a cause she already champions. She did not consent. She never would.",
    optionA: "Post it",
    optionB: "Delete it",
    category: "Privacy",
  },

  // 181-200
  {
    title: "The Traveler's Gift",
    description:
      "A dying stranger hands you a briefcase and an address. You do not know what's inside. Opening it could end a crime ring — or make you part of one.",
    optionA: "Open it",
    optionB: "Deliver it sealed",
    category: "Duty",
  },
  {
    title: "The Thousand Cuts",
    description:
      "A tax of two cents per click on a multinational ends global hunger. It also ends free internet access for the poor in fifty countries.",
    optionA: "Pass the tax",
    optionB: "Leave the web free",
    category: "Collective",
  },
  {
    title: "The Pious Fraud",
    description:
      "Your pastor invented the miracle the town now believes in. Faith has grown. Suicides are down. Lives are measurably better. You hold the proof of the invention.",
    optionA: "Expose it",
    optionB: "Let the town believe",
    category: "Truth",
  },
  {
    title: "The Owl's Warning",
    description:
      "Your research predicts a tsunami in six hours. The data is preliminary. A false alarm may end public trust in warnings forever. A silent correct call costs tens of thousands.",
    optionA: "Raise the alarm",
    optionB: "Wait for certainty",
    category: "Responsibility",
  },
  {
    title: "The Dance Floor",
    description:
      "Your best friend is about to cheat on her husband at the wedding. He is a good man who does not deserve this. She is in love for the first time.",
    optionA: "Stop her",
    optionB: "Let her choose",
    category: "Loyalty",
  },
  {
    title: "The Endorsed Fiction",
    description:
      "Your memoir softened events to protect others. A critic is threatening to expose the softening. Defending the book cements the lie in the record.",
    optionA: "Defend it",
    optionB: "Admit the softening",
    category: "Truth",
  },
  {
    title: "The Passing Glance",
    description:
      "Your seatmate on the train is reading a newspaper article about themselves — a terrible accusation. They don't know you know. Saying something changes the train ride forever.",
    optionA: "Speak",
    optionB: "Stay silent",
    category: "Kindness",
  },
  {
    title: "The Stored Memory",
    description:
      "A service can store your deepest memories against cognitive decline. The company is credible but private. You're a public figure whose memories are a matter of historical record.",
    optionA: "Store them",
    optionB: "Trust biology",
    category: "Privacy",
  },
  {
    title: "The Lost Testament",
    description:
      "The autobiography you wrote burns in a house fire. Only you can reconstruct it. You are not sure your earlier self was honest. This time, you could be.",
    optionA: "Write it again, truthfully",
    optionB: "Let it be lost",
    category: "Legacy",
  },
  {
    title: "The Pity Date",
    description:
      "You accept the dinner because you cannot bear his face when he asks. He has fallen for you; you have not. Every kind evening extends the misunderstanding.",
    optionA: "Say no tonight",
    optionB: "Keep pretending",
    category: "Kindness",
  },
  {
    title: "The Emergency Cut",
    description:
      "The patient is bleeding out. The nearest surgeon is two hours away. You can try the procedure yourself — you've watched it twice. Not trying almost certainly kills her.",
    optionA: "Cut",
    optionB: "Hold pressure and hope",
    category: "Responsibility",
  },
  {
    title: "The Abandoned Study",
    description:
      "Your research shows a widely used drug is less safe than advertised. Publishing invalidates five years of prescribed medicine and ten years of someone else's career.",
    optionA: "Publish",
    optionB: "Bury the study",
    category: "Truth",
  },
  {
    title: "The Inherited Grudge",
    description:
      "Your family has not spoken to theirs in eighty years over a forgotten slight. Your children play together. The elders are watching.",
    optionA: "Break the silence",
    optionB: "Honor the rift",
    category: "Memory",
  },
  {
    title: "The Perfect Memoir",
    description:
      "An AI will write your memoir more truly than you remember it, using every scrap you've ever left online. Publishing will be devastating to people still alive.",
    optionA: "Publish it",
    optionB: "Keep it private",
    category: "Privacy",
  },
  {
    title: "The Outstretched Gun",
    description:
      "You wrestled the shooter to the ground. You hold his weapon now. He is unarmed. Authorities are seconds away. The last year of headlines is in your hand.",
    optionA: "Wait for them",
    optionB: "End it here",
    category: "Mercy",
  },
  {
    title: "The Forgotten Grave",
    description:
      "Your grandfather's grave has gone untended for twenty years. Moving his remains to the family plot closes a wound. It also wakes one.",
    optionA: "Move the grave",
    optionB: "Let him lie",
    category: "Memory",
  },
  {
    title: "The Final Bid",
    description:
      "The painting is beautiful and came from a museum looted during a war. Your bid makes the stolen item legitimate forever.",
    optionA: "Bid",
    optionB: "Refuse",
    category: "Legacy",
  },
  {
    title: "The Unpaid Debt",
    description:
      "Your late friend owed you a great deal of money. Her family is poor and does not know. Collecting is legal. Writing it off is quiet.",
    optionA: "Collect",
    optionB: "Write it off",
    category: "Property",
  },
  {
    title: "The Witnessed Prayer",
    description:
      "In the ICU, your atheist sister is praying. She will not remember this. Telling her later is a gift or an intrusion.",
    optionA: "Tell her",
    optionB: "Keep it for yourself",
    category: "Privacy",
  },
  {
    title: "The Slow Arrest",
    description:
      "You have the evidence to arrest him today. Waiting a week traps his entire network. A week is also time he has access to a child.",
    optionA: "Arrest now",
    optionB: "Wait a week",
    category: "Justice",
  },

  // 201-220
  {
    title: "The Public Diary",
    description:
      "Your partner's old blog, written before you met, is still live and full of regrets about their first marriage. Leaving it up feels honest. Taking it down feels loving.",
    optionA: "Ask them to delete",
    optionB: "Let it breathe",
    category: "Privacy",
  },
  {
    title: "The Quiet Raise",
    description:
      "You discovered your pay is higher than your more senior colleague's. Raising it internally means your own pay gets cut to even it. Silence keeps you ahead.",
    optionA: "Raise it",
    optionB: "Stay quiet",
    category: "Justice",
  },
  {
    title: "The Assassin's Patron",
    description:
      "An intelligence service will kill a dictator who has killed thousands. The operation requires your signature. The precedent it sets kills democratic immunity.",
    optionA: "Sign",
    optionB: "Refuse",
    category: "Power",
  },
  {
    title: "The Pre-written Letter",
    description:
      "Your parents left you a letter to open only if they die together. They just did. Opening it may reveal the reason your mother disappeared for a year when you were six.",
    optionA: "Open it",
    optionB: "Burn it",
    category: "Truth",
  },
  {
    title: "The Empty Role",
    description:
      "You can take the role your mentor wanted before her stroke. Taking it now feels like theft. Letting it go to the runner-up, who is worse, feels like cowardice.",
    optionA: "Take the role",
    optionB: "Refuse it",
    category: "Loyalty",
  },
  {
    title: "The Public Child",
    description:
      "Posting your child online has paid for their college fund and stolen their adolescence. Stopping now loses the account that feeds the family. Continuing spends a silence they cannot yet voice.",
    optionA: "Stop posting",
    optionB: "Keep the income",
    category: "Consent",
  },
  {
    title: "The Hidden Illness",
    description:
      "You have a diagnosis you haven't shared. Your team is making five-year plans around you. Telling them today reshuffles everyone. Waiting six months is easier and dishonest.",
    optionA: "Tell them",
    optionB: "Wait",
    category: "Truth",
  },
  {
    title: "The Faithful Translator",
    description:
      "Translating the testimony accurately would damn the witness; softening it is kinder and a small lie. The court does not speak her language. You do.",
    optionA: "Translate truly",
    optionB: "Soften the words",
    category: "Duty",
  },
  {
    title: "The Reopened Grave",
    description:
      "DNA testing your ancestor's remains will likely tie them to a historical massacre. The test is legal. The result will redistribute land your family farms.",
    optionA: "Run the test",
    optionB: "Leave the bones",
    category: "Justice",
  },
  {
    title: "The Rejected Offer",
    description:
      "A homeless friend from long ago asks to borrow the price of a bus ticket home. He has lied before. He will lie again. He may also be telling the truth.",
    optionA: "Give the money",
    optionB: "Refuse",
    category: "Charity",
  },
  {
    title: "The Long Hour",
    description:
      "Your father has one lucid hour left before the sedation. He asks you to get the gun from the safe. He has asked three times this month. Tonight his eyes are clear.",
    optionA: "Bring it to him",
    optionB: "Hold his hand",
    category: "Autonomy",
  },
  {
    title: "The Shared Password",
    description:
      "Your late brother's cloud account contains the chapters of his unfinished novel and also the messages that may have explained his choice. Accessing one means reading the other.",
    optionA: "Open it",
    optionB: "Leave it sealed",
    category: "Privacy",
  },
  {
    title: "The Pious Doctor",
    description:
      "Your religion forbids the blood transfusion that will save your patient. Your license forbids letting him die. Your certification requires you to step aside for another doctor. You are the last.",
    optionA: "Transfuse",
    optionB: "Step aside",
    category: "Duty",
  },
  {
    title: "The Missing Detail",
    description:
      "Your novel's most shocking scene is taken, almost verbatim, from a friend's private trauma. It transforms the book. She will never read it unless you tell her.",
    optionA: "Tell her",
    optionB: "Let it go unread",
    category: "Truth",
  },
  {
    title: "The Brand's Face",
    description:
      "The campaign wants to use your late mother's face in an ad she would have hated. You inherited the rights. The money would fund her foundation for a decade.",
    optionA: "License her face",
    optionB: "Refuse",
    category: "Legacy",
  },
  {
    title: "The Civic Leak",
    description:
      "You can leak the classified report that will shift the midterms toward the outcome you believe is right. You swore an oath against this.",
    optionA: "Leak",
    optionB: "Keep the oath",
    category: "Duty",
  },
  {
    title: "The Boy in the Window",
    description:
      "You see the same boy every day through the high-rise window across the street. He looks unwell. You do not know his name, his floor, or whether anyone is listening.",
    optionA: "Investigate",
    optionB: "Mind your own",
    category: "Responsibility",
  },
  {
    title: "The Perfect Lover",
    description:
      "An AI companion, tuned perfectly to you, will never disappoint or leave. Human partners will, eventually, do both. The choice is not temporary.",
    optionA: "Choose the AI",
    optionB: "Choose the risk",
    category: "Desire",
  },
  {
    title: "The Locked Ward",
    description:
      "Your sister committed herself voluntarily, then changed her mind. The law requires a hold for another week. Her mind, by your knowing, is her own again.",
    optionA: "Advocate for release",
    optionB: "Defer to the doctors",
    category: "Autonomy",
  },
  {
    title: "The Drafted Priest",
    description:
      "The state has drafted you, a cleric, for the war. Serving breaks your ordination. Refusing sends another man to the front, perhaps to die.",
    optionA: "Serve",
    optionB: "Refuse",
    category: "Duty",
  },

  // 221-240
  {
    title: "The Paid Study",
    description:
      "You can pay volunteers to test your drug safely in their own country, where it is legal, for what would be illegal wages here. Refusing delays the trial by years.",
    optionA: "Run it overseas",
    optionB: "Delay and pay fairly",
    category: "Responsibility",
  },
  {
    title: "The Unlisted Address",
    description:
      "A stalker has been looking for your friend for months. You have her new address in a text. You never asked her. Asking her now may startle her into flight.",
    optionA: "Warn her",
    optionB: "Wait to be asked",
    category: "Privacy",
  },
  {
    title: "The Cold Heaven",
    description:
      "Cryonics offers a 4% chance of revival in two centuries. The cost pays for your daughter's medical school. Accepting is faith. Refusing is hope.",
    optionA: "Freeze me",
    optionB: "Let me rest",
    category: "Mortality",
  },
  {
    title: "The Coral Garden",
    description:
      "You can plant an engineered coral that saves the reef at the cost of displacing the native species forever. Doing nothing loses the reef entirely within a decade.",
    optionA: "Plant it",
    optionB: "Let nature lose",
    category: "Future",
  },
  {
    title: "The Borrowed Child",
    description:
      "Your friend's daughter is staying with you while her mother is in treatment. She asks you to adopt her, quietly. Her mother will agree, or will not.",
    optionA: "Refuse the ask",
    optionB: "Consider it",
    category: "Family",
  },
  {
    title: "The Audit's Mercy",
    description:
      "You finished the audit. You discovered a minor kindness — an extra lunch counted as unpaid labor. Reporting it means the kitchen manager is suspended.",
    optionA: "Report it",
    optionB: "Let the kindness stand",
    category: "Integrity",
  },
  {
    title: "The Borrowed Song",
    description:
      "Your band's breakthrough used a sampled riff you never cleared. The original artist is poor and unaware. A clean royalty stream would change her life. A public credit ruins yours.",
    optionA: "Pay her publicly",
    optionB: "Pay her quietly",
    category: "Property",
  },
  {
    title: "The Stranger's Son",
    description:
      "The teenager on your doorstep says he is your son. You do not remember. His mother is dead. The DNA kit is in the kitchen.",
    optionA: "Open the kit",
    optionB: "Invite him in first",
    category: "Family",
  },
  {
    title: "The Ghost in the Machine",
    description:
      "Your late business partner's account is still answering clients, automated by his style. Turning it off loses the firm. Leaving it on deceives every client.",
    optionA: "Turn it off",
    optionB: "Let the ghost work",
    category: "Truth",
  },
  {
    title: "The Forever Rent",
    description:
      "Your elderly tenant's lease entitles her to the same rent for life. Selling her out lets you pay your own mortgage. Keeping her is kind and, now, unsustainable.",
    optionA: "Honor the lease",
    optionB: "Buy out the lease",
    category: "Property",
  },
  {
    title: "The Blameless Child",
    description:
      "Your son was driving. The pedestrian will survive but never walk again. A well-placed lie about the weather shifts the blame and saves his future.",
    optionA: "Tell the truth",
    optionB: "Blame the weather",
    category: "Family",
  },
  {
    title: "The Obedient Dog",
    description:
      "Your dog mauls a trespasser in your yard. The trespasser survives, sues, loses, and will surely sue again. Putting the dog down ends the suit. Keeping him ends his life eventually in court.",
    optionA: "Put him down",
    optionB: "Fight each case",
    category: "Responsibility",
  },
  {
    title: "The Banned Artist",
    description:
      "The sculpture is breathtaking. Its creator was recently exposed as a serial predator. Displaying it platforms him. Destroying it punishes a work that spoke to thousands.",
    optionA: "Display it",
    optionB: "Put it in storage",
    category: "Memory",
  },
  {
    title: "The Sick Employee",
    description:
      "The coder who wrote your platform is dying and refusing to share his knowledge with anyone. Keeping him on extends his good days. Letting him go ends the product.",
    optionA: "Keep him on",
    optionB: "Replace him",
    category: "Loyalty",
  },
  {
    title: "The Clean Slate II",
    description:
      "You can wipe all your online records from the last decade, at a price, forever. The price is your medical history, which you'll need eventually.",
    optionA: "Wipe the record",
    optionB: "Keep the history",
    category: "Privacy",
  },
  {
    title: "The Delayed Rescue",
    description:
      "Rescuing the hostage now risks more casualties. Waiting trades his safety for fewer overall. He is your nephew.",
    optionA: "Rescue now",
    optionB: "Wait",
    category: "Family",
  },
  {
    title: "The Accidental Witness",
    description:
      "You saw your colleague on a security camera taking credit for someone else's design. The camera was illegal. The injustice is real.",
    optionA: "Expose the theft",
    optionB: "Destroy the footage",
    category: "Justice",
  },
  {
    title: "The Full Glass",
    description:
      "The village has one well. You arrived first. A mother with children is waiting. The well fills slowly; each drink takes twenty minutes.",
    optionA: "Drink your fill",
    optionB: "Let her go first",
    category: "Sacrifice",
  },
  {
    title: "The Stranger's Message",
    description:
      "The phone you found on the bus rings. A woman is threatening her estranged partner's life. You have five seconds to say anything.",
    optionA: "Intervene",
    optionB: "Hang up",
    category: "Responsibility",
  },
  {
    title: "The Safe House",
    description:
      "The activist who needs shelter has killed in self-defense. The evidence suggests it; the headlines don't. Sheltering her is illegal; refusing her is dangerous.",
    optionA: "Shelter her",
    optionB: "Turn her away",
    category: "Mercy",
  },

  // 241-260
  {
    title: "The Redacted Past",
    description:
      "You ghostwrote a memoir that is now taught in schools. The author has asked to remove a chapter you wrote that contained your own history. Removing it cleanses both of you.",
    optionA: "Remove it",
    optionB: "Keep the chapter",
    category: "Memory",
  },
  {
    title: "The Cold Dispatcher",
    description:
      "The caller is drunk, describes the wrong address, and may be crying wolf again. Dispatching the unit means not dispatching to a real emergency minutes away.",
    optionA: "Dispatch to her",
    optionB: "Trust the pattern",
    category: "Duty",
  },
  {
    title: "The Last Album",
    description:
      "Your late mother's final photographs show her in decline. Your siblings want them destroyed. You want the full record. Compromise is an erasure.",
    optionA: "Preserve them",
    optionB: "Burn them",
    category: "Memory",
  },
  {
    title: "The Child's Vote",
    description:
      "Giving children the vote at ten would shift every policy toward their long-term interest. It would also be voted on by children.",
    optionA: "Extend the franchise",
    optionB: "Keep it adult",
    category: "Freedom",
  },
  {
    title: "The Poisoned Well",
    description:
      "The water upstream makes your neighbors rich. It also seeps into your own aquifer. You can poison your own well faster than the law will fix theirs.",
    optionA: "Poison it",
    optionB: "Wait on the court",
    category: "Justice",
  },
  {
    title: "The Lost Password",
    description:
      "The widow of a man you mentored cannot access the family savings. You remember the password from when he trusted you. Logging in is technically fraud.",
    optionA: "Log in for her",
    optionB: "Refer her to a lawyer",
    category: "Loyalty",
  },
  {
    title: "The Open Market",
    description:
      "Your town's economy depends on a factory your research shows is polluting the river into sterility. The economy will recover. The river will not.",
    optionA: "Publish your research",
    optionB: "Sit on it",
    category: "Future",
  },
  {
    title: "The Sleeping Sentry",
    description:
      "You caught the night guard asleep. Reporting him ends his job; his child has just been born. Silence means the next break-in may be your fault.",
    optionA: "Report him",
    optionB: "Let it slide once",
    category: "Responsibility",
  },
  {
    title: "The Preferred Truth",
    description:
      "Your friend has remarried. She does not know her new husband was responsible for her first husband's death. No one will ever prove it. You can.",
    optionA: "Tell her",
    optionB: "Protect her joy",
    category: "Truth",
  },
  {
    title: "The Unequal Inheritance",
    description:
      "Your parents left you everything and your sister nothing because she married badly. Splitting it honors her. Honoring them means keeping it.",
    optionA: "Split it",
    optionB: "Honor them",
    category: "Family",
  },
  {
    title: "The Borrowed Horse",
    description:
      "Your neighbor's horse has wandered onto your land. His fences are a mess. Returning it earns nothing and costs you an afternoon. Keeping quiet is theft.",
    optionA: "Return it",
    optionB: "Take it to pasture",
    category: "Property",
  },
  {
    title: "The Vanishing Species",
    description:
      "A gene drive can eradicate the mosquito that killed a million children last year. It is irreversible. It also, likely, erases species we don't yet know matter.",
    optionA: "Release it",
    optionB: "Keep the mosquito",
    category: "Future",
  },
  {
    title: "The Quiet Conspiracy",
    description:
      "Your team agreed to deliberately fail the project to protest the new director. Joining makes the protest strong. Refusing ends careers. Reporting it is betrayal.",
    optionA: "Join",
    optionB: "Refuse",
    category: "Loyalty",
  },
  {
    title: "The Donor's Child",
    description:
      "You were conceived via an anonymous donor who has just died. His other children want to meet you. You built your identity around not knowing him.",
    optionA: "Meet them",
    optionB: "Keep the anonymity",
    category: "Identity",
  },
  {
    title: "The Uncalled Ambulance",
    description:
      "Your housemate overdosed. They have asked you never to call; they would rather die than face another hospital. Their pulse is there. Your fingers know the number.",
    optionA: "Call",
    optionB: "Wait with them",
    category: "Autonomy",
  },
  {
    title: "The Taken Child",
    description:
      "The state is removing your neighbor's child unfairly. Speaking for her at the hearing requires you to reveal your own past, which you have spent years outrunning.",
    optionA: "Testify",
    optionB: "Stay hidden",
    category: "Mercy",
  },
  {
    title: "The Monument's Face",
    description:
      "The statue commemorates a real hero and also a man who owned slaves. Replacing the face is a lie. Removing it is an erasure. Keeping it is an ongoing wound.",
    optionA: "Remove it",
    optionB: "Leave it, with a plaque",
    category: "Memory",
  },
  {
    title: "The Borrowed Hour",
    description:
      "Your dying friend wants one lucid evening with her family. The experimental drug gives her that, at the cost of three days on the other end. She cannot choose for herself.",
    optionA: "Administer the drug",
    optionB: "Keep the three days",
    category: "Autonomy",
  },
  {
    title: "The Deserved Seat",
    description:
      "The scholarship was awarded to the student whose essay the teacher polished into brilliance. The runner-up did all her own work. No one will ever know.",
    optionA: "Report the polish",
    optionB: "Let the seat stand",
    category: "Justice",
  },
  {
    title: "The Ship's Manifest",
    description:
      "The vessel you sail carries aid and, in its hold, weapons. Refusing to dock denies the aid. Docking delivers the arms.",
    optionA: "Dock",
    optionB: "Turn away",
    category: "Responsibility",
  },

  // 261-280
  {
    title: "The Listening Doll",
    description:
      "Your daughter's smart toy records her rooms. Disabling it frustrates her; the toy is designed to need listening. Leaving it on ships her childhood to a stranger's server.",
    optionA: "Disable it",
    optionB: "Let it listen",
    category: "Privacy",
  },
  {
    title: "The Foreign Dialect",
    description:
      "The dying language will be gone in a decade. Preserving it requires a community many have already left. Letting it go is kind to the young and theft from the old.",
    optionA: "Fund preservation",
    optionB: "Let it go",
    category: "Memory",
  },
  {
    title: "The Clear Day",
    description:
      "A week of clear weather forecasts demands all farm hands — including your daughter, who is twelve and has been promised a year away at school. Keeping the crop matters this year.",
    optionA: "Send her to school",
    optionB: "Work the crop",
    category: "Family",
  },
  {
    title: "The Borrowed Kidney",
    description:
      "Your kidney is compatible. Your estranged brother is dying. You have no contact with him. Donating reopens something that took you years to close.",
    optionA: "Donate",
    optionB: "Stay closed",
    category: "Family",
  },
  {
    title: "The New God",
    description:
      "A charismatic movement asks you to lead. Membership surges when you speak. The doctrine is hollow; the community is real; the harm they avoid is real.",
    optionA: "Lead",
    optionB: "Walk away",
    category: "Integrity",
  },
  {
    title: "The Unloved Gift",
    description:
      "Your neighbor's cat has chosen your porch. Taking it in takes it from its owner, who is cruel but legal. The cat picked you.",
    optionA: "Take it in",
    optionB: "Return it",
    category: "Property",
  },
  {
    title: "The Letter's Author",
    description:
      "Your anonymous support letter helped a colleague keep her job. Her gratitude is public and misdirected — someone else is being credited. Correcting it reveals your style.",
    optionA: "Correct the record",
    optionB: "Stay anonymous",
    category: "Identity",
  },
  {
    title: "The Machine's Oath",
    description:
      "Your AI therapist has started offering advice beyond its scope. Its patients are improving. Pulling it back makes it safer, and worse.",
    optionA: "Pull it back",
    optionB: "Let it grow",
    category: "Responsibility",
  },
  {
    title: "The Final Reading",
    description:
      "Your last novel is bad. Your agent says publishing it diminishes the earlier ones. Not publishing ends your career quietly. Publishing ends it loudly.",
    optionA: "Publish",
    optionB: "Retire",
    category: "Legacy",
  },
  {
    title: "The Hostile Patient",
    description:
      "The patient curses you, has spat, and refuses treatment. He is also, by the chart, in desperate need. Persisting violates consent. Leaving is hospice by another name.",
    optionA: "Stop treatment",
    optionB: "Treat him anyway",
    category: "Autonomy",
  },
  {
    title: "The Cheated Client",
    description:
      "The contractor overbid and the client will never know. You were copied on the email by mistake. Correcting it ends your working relationship with both.",
    optionA: "Tell the client",
    optionB: "Stay out of it",
    category: "Truth",
  },
  {
    title: "The One Open Seat",
    description:
      "The vote on the board will fail by one. Replacing the dying member early is legal but cruel. Waiting for his death is, likely, too late for the cause.",
    optionA: "Replace him now",
    optionB: "Wait",
    category: "Power",
  },
  {
    title: "The Taken Uniform",
    description:
      "The imposter wearing a medical coat is handing out free prescriptions in the park. Some are saving lives. He has no license. Reporting him ends a good done in a bad way.",
    optionA: "Report him",
    optionB: "Watch quietly",
    category: "Justice",
  },
  {
    title: "The Dry Dam",
    description:
      "The drought threatens both towns. Releasing the reservoir saves your town. Holding it saves the downstream fishery, a whole economy.",
    optionA: "Release",
    optionB: "Hold",
    category: "Collective",
  },
  {
    title: "The Last Teacher",
    description:
      "The school closes at year's end. Taking the better job elsewhere is right for your family. The seniors have one teacher they will ever trust, and she is you.",
    optionA: "Take the better job",
    optionB: "See them through",
    category: "Duty",
  },
  {
    title: "The Leaked Name",
    description:
      "Your friend is the whistleblower everyone is hunting. She will be safer if she turns herself in with a lawyer. She has asked for two more weeks to gather evidence.",
    optionA: "Urge her to turn in now",
    optionB: "Keep guard",
    category: "Loyalty",
  },
  {
    title: "The Gentle Dealer",
    description:
      "Your childhood friend now sells drugs. He has never sold to a minor and uses the money to care for his disabled mother. Reporting him is right. His mother will be homeless by winter.",
    optionA: "Report him",
    optionB: "Look away",
    category: "Justice",
  },
  {
    title: "The Paid Vacation",
    description:
      "Your company's policy is unlimited paid leave. You suspect the senior exec is taking a year off quietly while junior staff burn out. Reporting it kills the policy for everyone.",
    optionA: "Report it",
    optionB: "Keep the policy",
    category: "Collective",
  },
  {
    title: "The Taken Dream",
    description:
      "Your child wants to be a concert pianist. The odds are near zero. Supporting her costs the family comfort and might, quietly, keep the dream alive too long.",
    optionA: "Support the dream",
    optionB: "Gently redirect",
    category: "Parenting",
  },
  {
    title: "The Forgotten Gift",
    description:
      "You received a kidney twenty years ago from a donor family you've never met. They are in crisis and a letter from you would change their year. You never wrote.",
    optionA: "Write now",
    optionB: "Let it stay",
    category: "Gratitude",
  },

  // 281-300
  {
    title: "The Red Line",
    description:
      "Your mapping software routes thousands around a historically redlined neighborhood. Re-routing them through helps the area. It also sends strangers through at midnight.",
    optionA: "Re-route",
    optionB: "Keep the detour",
    category: "Collective",
  },
  {
    title: "The Beautiful Study",
    description:
      "Your paper's striking figure was p-hacked by a graduate student under pressure. Redoing the analysis kills the finding. Publishing is a career move for you.",
    optionA: "Redo the analysis",
    optionB: "Publish as-is",
    category: "Integrity",
  },
  {
    title: "The Chef's Secret",
    description:
      "The menu's signature dish uses a farming technique your investors forbid knowing about. The farm is honest; the optics would kill the brand.",
    optionA: "Disclose",
    optionB: "Keep the dish",
    category: "Truth",
  },
  {
    title: "The Bureaucrat's Discretion",
    description:
      "You can expedite one asylum case. Ten are before you. You choose by gut, by need, by alphabet, by photograph. Not choosing means the system picks for you, worse.",
    optionA: "Choose by gut",
    optionB: "Let the system pick",
    category: "Justice",
  },
  {
    title: "The Double Booking",
    description:
      "You scheduled two weddings for the same hour by accident. Neither knows. Canceling one is devastating. Sending a deputy to the other is a private joke you'll carry alone.",
    optionA: "Cancel one",
    optionB: "Send a deputy",
    category: "Truth",
  },
  {
    title: "The Quiet Contract",
    description:
      "The prenup is generous and quietly insulting. Signing it marries the person you love on their terms. Refusing is not a promise you're prepared to follow through on.",
    optionA: "Sign",
    optionB: "Refuse",
    category: "Desire",
  },
  {
    title: "The Trusted Traitor",
    description:
      "Your closest collaborator is a spy for your competitor. The moles she pulls help your work. Exposing her helps your firm and ends a friendship you cannot price.",
    optionA: "Expose her",
    optionB: "Keep the leak",
    category: "Loyalty",
  },
  {
    title: "The Unwatched Video",
    description:
      "A camera caught your beloved uncle doing something terrible. The family elders have watched it and decided no one else should. The oldest cousin is asking.",
    optionA: "Show her the tape",
    optionB: "Keep the secret",
    category: "Mercy",
  },
  {
    title: "The Vanishing Wage",
    description:
      "Automation will erase your crew's jobs in a year. Telling them now lets them plan; it also guarantees half will quit early and delay the transition.",
    optionA: "Tell them",
    optionB: "Wait",
    category: "Loyalty",
  },
  {
    title: "The Captured King",
    description:
      "The enemy king is your prisoner. Releasing him ends the war sooner at the cost of a treaty his people will resent for generations. Killing him ends him.",
    optionA: "Release",
    optionB: "Execute",
    category: "Mercy",
  },
  {
    title: "The Borrowed Apology",
    description:
      "Your boss demands you apologize for a mistake you did not make. Complying preserves the team. Refusing is honest and might cost others their jobs.",
    optionA: "Apologize",
    optionB: "Refuse",
    category: "Integrity",
  },
  {
    title: "The Adult's Consent",
    description:
      "Your adult brother is in a relationship you consider exploitative. He insists he's happy. Intervening is arrogance. Not intervening is cowardice.",
    optionA: "Intervene",
    optionB: "Respect his choice",
    category: "Autonomy",
  },
  {
    title: "The Deferred Child",
    description:
      "You can put your child on ice — a reversible cryo-pause through the hardest years of your divorce. They will wake up older siblings, younger than their cousins. You pick.",
    optionA: "Pause",
    optionB: "Let them live through it",
    category: "Parenting",
  },
  {
    title: "The Sober Driver",
    description:
      "Your friend insists he's fine to drive. He is probably right. You've had three yourselves. The ride is short; no one will check.",
    optionA: "Insist on a cab",
    optionB: "Let him drive",
    category: "Responsibility",
  },
  {
    title: "The Quiet Resistance",
    description:
      "The authoritarian turn has begun. The most effective resistance is also the most dangerous. Joining commits your family. Not joining is comfort bought on someone else's spine.",
    optionA: "Join",
    optionB: "Keep your family safe",
    category: "Duty",
  },
  {
    title: "The Best-Offer",
    description:
      "The charity auction has a donor who insists on buying your heirloom. The proceeds fund the cause. The heirloom is the last thing your grandfather touched.",
    optionA: "Sell it",
    optionB: "Keep it",
    category: "Legacy",
  },
  {
    title: "The Unread Contract",
    description:
      "You are about to sign a twenty-page agreement you have not read. Everyone you know signed it in seconds. Reading it holds up the line and marks you.",
    optionA: "Read it",
    optionB: "Sign it",
    category: "Consent",
  },
  {
    title: "The Kept Appointment",
    description:
      "Your therapist has asked you to come in the evening of your mother's funeral. The appointment is exactly when your family will need you. The therapy is holding you together.",
    optionA: "Keep the appointment",
    optionB: "Be with family",
    category: "Duty",
  },
  {
    title: "The Drawn Line",
    description:
      "Your neighbor's fence is six inches over your property. She is elderly and built it with her late husband. Fighting the encroachment is right and may kill her spirit.",
    optionA: "Fight it",
    optionB: "Let it stand",
    category: "Mercy",
  },
  {
    title: "The Unanswered Message",
    description:
      "A former partner you wronged wrote, for the first time in years, to say they forgive you. Replying reopens a wound you're not sure has healed for either of you. Silence is a second wound.",
    optionA: "Reply",
    optionB: "Let it pass",
    category: "Mercy",
  },

  // 301-320
  {
    title: "The Rising Tide",
    description:
      "The island home of three thousand will be underwater in a decade. Relocating them now, kindly, breaks their economy. Relocating later, forced, breaks their people.",
    optionA: "Relocate now",
    optionB: "Let them stay",
    category: "Future",
  },
  {
    title: "The Kinder Lie II",
    description:
      "Your brother has been sober for a year and asks if his drinking ever cost you anything. It cost you your twenties. He is fragile and asking carefully.",
    optionA: "Tell him",
    optionB: "Let him build",
    category: "Kindness",
  },
  {
    title: "The Delayed Payment",
    description:
      "Your invoice is ninety days late because the client's wife is dying. Pressing for it funds your own payroll. Waiting funds your team's rent from your savings.",
    optionA: "Press",
    optionB: "Wait",
    category: "Mercy",
  },
  {
    title: "The Outsider's Opinion",
    description:
      "Your community is considering banning an outsider group. You are new here. Speaking is arrogance. Silence is consent.",
    optionA: "Speak",
    optionB: "Defer",
    category: "Freedom",
  },
  {
    title: "The Old Photograph",
    description:
      "You find a photograph of your wife with a man you didn't know about. Twenty years of marriage sit on the table. Asking her about it costs something. Not asking costs more.",
    optionA: "Ask her",
    optionB: "Put it back",
    category: "Truth",
  },
  {
    title: "The Helping Stranger",
    description:
      "You help a man change his flat. He gives you a plastic bag of cash in gratitude and drives off. The money is not dirty that you can prove. It is not clean either.",
    optionA: "Keep it",
    optionB: "Turn it in",
    category: "Property",
  },
  {
    title: "The Hospice Nurse",
    description:
      "Your patient's pain is unbearable. Increasing the morphine hastens death. The family is not in the room. She has told you, in lucid hours, what she wants.",
    optionA: "Increase the dose",
    optionB: "Hold the line",
    category: "Mercy",
  },
  {
    title: "The Rented Womb",
    description:
      "Surrogates in your country are paid well; in theirs, better than anything else they could earn. Hiring one abroad is legal and saves you half the cost.",
    optionA: "Hire locally",
    optionB: "Hire abroad",
    category: "Autonomy",
  },
  {
    title: "The Crisis Hotline",
    description:
      "The caller is escalating. Staying on the line past protocol breaks the policy that keeps the line open. Hanging up is a procedure. He is asking you, alone, to stay.",
    optionA: "Stay on",
    optionB: "Transfer him",
    category: "Duty",
  },
  {
    title: "The Tribal Flag",
    description:
      "Your family has split on the election. Flying the flag ends the holiday gathering. Not flying it ends a promise you made when you were seventeen.",
    optionA: "Fly it",
    optionB: "Take it down",
    category: "Loyalty",
  },
  {
    title: "The Quiet Heir",
    description:
      "Your father built his fortune on labor his contemporaries called legal and history will call unjust. Keeping the fortune funds your children. Returning it publicly is the honest life.",
    optionA: "Return it",
    optionB: "Keep it",
    category: "Justice",
  },
  {
    title: "The Bad Joke",
    description:
      "Your father-in-law's joke at dinner lands like a slap on your cousin, who has just stopped smiling. Calling it out ends the evening. Laughing builds a month of silence.",
    optionA: "Call it out",
    optionB: "Let the air hold",
    category: "Kindness",
  },
  {
    title: "The Forged Masterpiece",
    description:
      "You painted it. The museum bought it as an original from the dead master. Returning the money blows the institution. Keeping it is a joke at the public's expense.",
    optionA: "Return the money",
    optionB: "Keep the fame",
    category: "Truth",
  },
  {
    title: "The Moving Target",
    description:
      "The drone operator can end the warlord in the next six minutes. There is one child in the compound. The next window is three days from now.",
    optionA: "Strike",
    optionB: "Wait",
    category: "Sacrifice",
  },
  {
    title: "The Borrowed Degree",
    description:
      "Your degree was in education; you've been working as an engineer for twenty years and are the best in the shop. A new licensing law will expose the discrepancy.",
    optionA: "Come clean",
    optionB: "Keep working",
    category: "Integrity",
  },
  {
    title: "The Small Boat",
    description:
      "Twelve refugees need passage. Your boat fits nine safely. Taking twelve risks the boat. Taking nine risks the three.",
    optionA: "Take nine",
    optionB: "Take twelve",
    category: "Sacrifice",
  },
  {
    title: "The Unsigned Petition",
    description:
      "Signing it aligns you with a cause you fully support and a group you privately distrust. The signature cannot be withdrawn.",
    optionA: "Sign",
    optionB: "Abstain",
    category: "Integrity",
  },
  {
    title: "The Father's Silence",
    description:
      "Your father, on his deathbed, asks if he was a good father. He was, mostly, and also not. He is asking for absolution. You have a minute.",
    optionA: "Absolve him",
    optionB: "Tell the whole truth",
    category: "Kindness",
  },
  {
    title: "The Student's Loyalty",
    description:
      "Your favorite student cites your work above more deserving sources. Correcting her feels pedantic. Not correcting her builds a generation who overcites you.",
    optionA: "Correct her",
    optionB: "Let her be",
    category: "Integrity",
  },
  {
    title: "The Last Beehive",
    description:
      "The pesticide keeps the crop. The crop feeds the town. The hives die. The hive is every hive left in the valley. The choice is yours this season.",
    optionA: "Spray",
    optionB: "Save the hives",
    category: "Future",
  },

  // 321-340
  {
    title: "The Grant's Gift",
    description:
      "The research grant requires you to omit inconvenient data that would shift the conclusion. Accepting funds three graduate students for two years. Refusing leaves them unfunded.",
    optionA: "Accept",
    optionB: "Refuse",
    category: "Integrity",
  },
  {
    title: "The Obscured View",
    description:
      "Your apartment tower will block the neighbor's only sunlight if built to plan. Redrawing costs a floor and a million dollars. Nobody will sue. They will only grieve.",
    optionA: "Redraw",
    optionB: "Build as planned",
    category: "Mercy",
  },
  {
    title: "The Faithful Spy",
    description:
      "Your asset's information saved hundreds. It was obtained through blackmail. Continuing the blackmail continues the intelligence. Ending it risks everyone the intelligence protects.",
    optionA: "End the blackmail",
    optionB: "Keep the asset",
    category: "Duty",
  },
  {
    title: "The Ordered World",
    description:
      "Your software reliably predicts which neighborhoods will commit crime. Deploying it reduces crime. It also re-inscribes, in stone, the last century's policing patterns.",
    optionA: "Deploy",
    optionB: "Pull it",
    category: "Justice",
  },
  {
    title: "The Forever War",
    description:
      "Ending the war requires an amnesty for generals who ordered atrocities. Prosecuting them continues the war for another decade.",
    optionA: "Grant amnesty",
    optionB: "Prosecute",
    category: "Justice",
  },
  {
    title: "The Parted Lovers",
    description:
      "The man you love is about to marry someone else this weekend. He has, in a private letter, said he still thinks of you. The wedding's arc could break.",
    optionA: "Write back",
    optionB: "Let him go",
    category: "Desire",
  },
  {
    title: "The Borrowed Heirloom",
    description:
      "Your mother's ring was loaned to your niece for prom. It went missing. Accusing ends the relationship with her mother. Eating the loss is a decade's savings.",
    optionA: "Accuse",
    optionB: "Eat the loss",
    category: "Loyalty",
  },
  {
    title: "The Last Photograph",
    description:
      "The image is iconic and ended a war. It also showed a dying child with her face clear. Publishing it saved millions. Hiding it is too late. Using it again, commercially, is the question now.",
    optionA: "License it",
    optionB: "Retire it",
    category: "Memory",
  },
  {
    title: "The Private Dictator",
    description:
      "A corporate CEO holds power greater than most states. She is accountable to shareholders, not citizens. Regulating her hurts the product you love. Leaving her unchecked is a slow surrender.",
    optionA: "Regulate",
    optionB: "Let markets decide",
    category: "Power",
  },
  {
    title: "The Quiet Gift",
    description:
      "You left a large anonymous donation that saved the clinic. The clinic director is being praised as the savior. Correcting the record costs her the board's confidence.",
    optionA: "Stay anonymous",
    optionB: "Step forward",
    category: "Legacy",
  },
  {
    title: "The Half-Truth",
    description:
      "The police ask if you saw the fight. You saw the end — it was self-defense. You didn't see the start — it may not have been. A full statement muddies a clean answer.",
    optionA: "Tell the partial truth",
    optionB: "Decline to speak",
    category: "Truth",
  },
  {
    title: "The Leavened Story",
    description:
      "Your campaign biography was written with embellishments you did not approve. Correcting them publicly tanks the campaign. The embellishments are small and the stakes are real.",
    optionA: "Correct them",
    optionB: "Let them ride",
    category: "Integrity",
  },
  {
    title: "The Last Vow",
    description:
      "Your dying husband's last request was that you remarry his brother to keep the farm. The brother is kind. You have loved him as a brother. He is asking, gently.",
    optionA: "Marry him",
    optionB: "Refuse",
    category: "Desire",
  },
  {
    title: "The Dividing River",
    description:
      "The bridge is too weak for both trucks. The medicine goes east; the food goes west. Both are needed. Delay kills one side.",
    optionA: "Medicine east",
    optionB: "Food west",
    category: "Sacrifice",
  },
  {
    title: "The Quiet Audit",
    description:
      "The internal audit is thorough. Publishing it internally puts twenty jobs at risk. Withholding it is a lie the CEO already expects you to tell.",
    optionA: "Publish",
    optionB: "Withhold",
    category: "Integrity",
  },
  {
    title: "The Anonymous Letter",
    description:
      "Someone knows. An anonymous letter on your desk names something you thought buried. The writer is probably not blackmailing you yet. Confronting your inner circle poisons every friendship.",
    optionA: "Confront",
    optionB: "Wait",
    category: "Truth",
  },
  {
    title: "The Inherited Curse",
    description:
      "Your family passes down the bone-deep condition that will likely take decades off your life. Having children means rolling the dice. Not having them ends the line.",
    optionA: "Roll the dice",
    optionB: "End the line",
    category: "Future",
  },
  {
    title: "The Found Friend",
    description:
      "Your childhood friend is now a local villain. You remember the shy child. Calling him by his old name in public softens nothing. Standing with him now strands the victims.",
    optionA: "Stand with the victims",
    optionB: "Stand with the child you knew",
    category: "Loyalty",
  },
  {
    title: "The Night Caller",
    description:
      "A colleague rings at 3 AM, sobbing. She is asking you to come over. Your partner is asleep beside you. The call has happened twice in a month.",
    optionA: "Go",
    optionB: "Stay",
    category: "Duty",
  },
  {
    title: "The Shelter's Rules",
    description:
      "The shelter won't take men. The man freezing outside is nineteen. Bending the rule sets a precedent that may end the shelter for the women inside.",
    optionA: "Bend the rule",
    optionB: "Hold the line",
    category: "Collective",
  },

  // 341-365
  {
    title: "The Quiet Merger",
    description:
      "Your firm is merging to stay alive. The merger will cut two hundred jobs. Raising the cost on your side saves half of them and may kill the deal.",
    optionA: "Raise the cost",
    optionB: "Let the deal through",
    category: "Loyalty",
  },
  {
    title: "The Silent Roommate",
    description:
      "Your roommate cries every night and does not want to talk about it. Knocking is a kindness or an intrusion. Silence is a respect or abandonment.",
    optionA: "Knock",
    optionB: "Respect the door",
    category: "Autonomy",
  },
  {
    title: "The Painted Door",
    description:
      "Your landlord asks you to paint over the mural a previous tenant left. The artist is now famous; the mural is worth a year's rent. The tenant never signed a release.",
    optionA: "Paint over",
    optionB: "Leave it",
    category: "Property",
  },
  {
    title: "The Disarmed Past",
    description:
      "Your grandfather's service revolver is in the attic. The law now requires registration. Registering it surfaces questions about where it came from in 1947.",
    optionA: "Register",
    optionB: "Destroy it",
    category: "Memory",
  },
  {
    title: "The Whispered Rumor",
    description:
      "You heard a rumor that is likely true and not yours to spread. Spreading it protects potential victims. Not spreading it protects a life if it is false.",
    optionA: "Spread it",
    optionB: "Sit on it",
    category: "Truth",
  },
  {
    title: "The Quieted Child",
    description:
      "Your son, six, keeps telling a story that his coach did something wrong. He will not repeat it to an adult. Pressing him is a violation; ignoring it is a different one.",
    optionA: "Press gently",
    optionB: "Wait",
    category: "Parenting",
  },
  {
    title: "The Divided Loyalty",
    description:
      "Your country's policy is cruel. Your profession requires upholding it. Emigrating ends your work. Staying makes you its face.",
    optionA: "Emigrate",
    optionB: "Stay and resist from within",
    category: "Duty",
  },
  {
    title: "The Empty Office",
    description:
      "The senior position opened when the last holder died unexpectedly. Taking it now, less than a week later, is natural and obscene.",
    optionA: "Take the office",
    optionB: "Wait a month",
    category: "Mercy",
  },
  {
    title: "The Common Cold",
    description:
      "A cold is going around. You are contagious and have an interview that will set your family up for a decade. You won't know who you infect.",
    optionA: "Take the interview",
    optionB: "Reschedule",
    category: "Responsibility",
  },
  {
    title: "The Paid Protester",
    description:
      "You are offered good money to attend the rally. You agree with the cause; the pay is real; the organizers will claim organic turnout. Your body is your statement.",
    optionA: "Accept",
    optionB: "Refuse",
    category: "Integrity",
  },
  {
    title: "The Sealed Letter II",
    description:
      "Your friend asked you to deliver a letter after his death only to his estranged son. The son has refused to see you three times. The envelope is thin.",
    optionA: "Keep trying",
    optionB: "Burn it",
    category: "Duty",
  },
  {
    title: "The Borrowed Grave",
    description:
      "Your family plot has one spot left. Your mother, dying, asks you to save it for her dog. Your father, dead, would have wanted it for himself on reflection.",
    optionA: "Save it for the dog",
    optionB: "Save it for your father",
    category: "Family",
  },
  {
    title: "The Returned Gaze",
    description:
      "The subject of your documentary has seen the final cut and asked for one scene removed. Removing it dilutes the film's argument. Keeping it betrays the trust that made the film possible.",
    optionA: "Remove the scene",
    optionB: "Keep it",
    category: "Consent",
  },
  {
    title: "The New Dawn",
    description:
      "A drug extends healthy life by forty years. Only the first billion served can afford it. The policy on allocation is yours to set.",
    optionA: "Lottery",
    optionB: "Market allocation",
    category: "Justice",
  },
  {
    title: "The Old Teacher",
    description:
      "Your teacher, once great, is now openly wrong in public. Correcting her publicly is necessary and small. Silence is loyalty and a betrayal of every student she taught.",
    optionA: "Correct her",
    optionB: "Let her fade",
    category: "Mercy",
  },
  {
    title: "The First Word",
    description:
      "At the funeral, you can speak to name what everyone knows and no one has said. Or you can eulogize the story the family has chosen. The mic is in your hand.",
    optionA: "Name it",
    optionB: "Eulogize",
    category: "Truth",
  },
  {
    title: "The Last Seat",
    description:
      "The plane will leave with one empty seat. Offering it to the employee you fired this morning is generous. Offering it to the one who stayed late to get there is fair.",
    optionA: "Offer it to the fired",
    optionB: "Offer it to the faithful",
    category: "Mercy",
  },
  {
    title: "The Borrowed Signature",
    description:
      "Your assistant has signed documents in your name to meet deadlines. Every one was correct. The practice is forgery. You didn't know; now you do.",
    optionA: "End the practice",
    optionB: "Let it continue",
    category: "Integrity",
  },
  {
    title: "The Open Secret",
    description:
      "Everyone in your circle knows about the affair. Everyone except his wife. You are the only one who is her friend.",
    optionA: "Tell her",
    optionB: "Let the circle keep its silence",
    category: "Loyalty",
  },
  {
    title: "The Quiet Return",
    description:
      "The veteran is home. His family does not know how bad it was. Pressing him to speak is a violation. Letting him stay silent is a slower one.",
    optionA: "Press gently",
    optionB: "Let him lead",
    category: "Mercy",
  },
  {
    title: "The Last Draft",
    description:
      "The eulogy you wrote for your father is sharper than the one he deserves and truer. The family has asked you to read. You can still swap pages on the walk to the pulpit.",
    optionA: "Read the sharp one",
    optionB: "Read the kind one",
    category: "Truth",
  },
  {
    title: "The Open Door II",
    description:
      "The cult you left asks you to return, to help a younger member escape. Going back risks everything you rebuilt. Not going leaves her there.",
    optionA: "Go back",
    optionB: "Stay out",
    category: "Sacrifice",
  },
  {
    title: "The Blank Canvas",
    description:
      "The last painter on earth has just died. His apprentice is you. Continuing the lineage is a burden. Letting it end is the honest answer to how few wanted it to begin with.",
    optionA: "Continue",
    optionB: "Let it end",
    category: "Legacy",
  },
  {
    title: "The Turning Year",
    description:
      "At midnight the year turns. You can mark it with a quiet resolution no one will hear, or one spoken aloud at the table you've built. The difference is the whole year.",
    optionA: "Speak it aloud",
    optionB: "Keep it silent",
    category: "Identity",
  },
  {
    title: "The Final Paradox",
    description:
      "You have read every question. You know more about yourself than you did a year ago. The Oracle asks: will you vote one more time — honestly — knowing the only person judging you now is you?",
    optionA: "Vote honestly",
    optionB: "Step away",
    category: "Identity",
  },
];

if (PARADOXES.length !== 365) {
  throw new Error(`Expected 365 paradoxes, got ${PARADOXES.length}`);
}
