-- 027_seed_manager_bible.sql
-- Manager Handbook Bible — seeded from WHG_Managers_Reference_Guide_COMPLETE.pdf
-- and WHG_Managers_Reference_Guide_Addendum.docx.pdf (April 2026 versions).
--
-- 12 sections from the Reference Guide + 10 from the Addendum + 1 Visual Tools
-- index = 23 sections total. role_visibility='manager' so only admins and
-- managers see this. handbook_version=1 = Bible v1 (separate from staff
-- handbook v4). After applying this migration, run `npm run ingest` to
-- populate handbook_chunks for the Ask chatbot.

-- Idempotent: deletes any prior Bible v1 content before reseeding.
DELETE FROM handbook_sections WHERE language = 'en' AND handbook_version = 1 AND role_visibility = 'manager';

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 1, $T$Section 1 — The Manager's Role$T$, $BIBLE_1$Most people who become restaurant managers earned it by being great at their job. They were
reliable, fast, good with guests, and ownership noticed. That's how it should work. But here's the
thing almost nobody explains: being great at the job and leading people who do the job are two
completely different skills. One earns you the title. The other earns you the authority.
Your job as a manager is not to be the hardest worker on the floor. Your job is to be responsible
for the outcome of every shift. That means the guest experience, the pace of service, the
cleanliness of the building, the energy of the team, and the integrity of every transaction. When
it goes right, that's on you. When it goes wrong, that's also on you.
The fastest way to lose control of your restaurant is to wait until something becomes a problem
before you address it. Most issues in a restaurant are predictable — phones creeping out,
energy slowing, side work getting cut short, attitude starting to drift. Strong managers correct
those things early, calmly, and consistently. That prevents 80% of the problems that turn into
real headaches.

Your Three Non-Negotiables Every Shift
If you focus on nothing else, focus on these three things. Get these right and most of your
restaurant runs itself.
First: protect the guest experience. Guests don't care about your staffing problems or your prep
challenges or what's happening in the back. They experience speed, hospitality, cleanliness,
and energy. If the guest experience is slipping, nothing else you're doing matters enough to
justify it.
Second: protect execution and standards. Standards are either consistently enforced or slowly
dying — there is no middle ground. The moment you let one person slide, you've told the entire
team that standards are optional. They're watching for that. They will test it.
Third: protect the business. That means labor control, theft prevention, comp integrity, food
safety, and documentation of patterns when they emerge. Good vibes don't pay the bills.
Execution does.

The Four Types of Managers
Every manager falls into one of four patterns. Be honest with yourself about which one you
default to.
The Nice Manager avoids conflict. They let things slide because they don't want to upset
anyone. The team likes them — for a while. Then standards collapse, your best employees get
frustrated, and chaos fills the vacuum where structure should be. Long-term, kindness without
accountability is not kind at all.
The Angry Manager corrects with emotion. They threaten, they embarrass people publicly, and
the team complies out of fear. For a while it works. Then resentment builds, turnover spikes, and
the restaurant's culture becomes toxic. You can't build anything sustainable on fear.
The Ghost Manager hides in the office, stays on their phone, and only appears when something
has already exploded. The team effectively runs the restaurant. The manager is just a formality.

The Standard Manager — and this is what we need from you — is calm, present, and
observant. They correct small issues early before they become big ones. They're consistent
regardless of who's watching. The team respects them because they mean what they say and
follow through every time.
Aim to be the last one. Not because it sounds good on paper, but because it's the only version
that actually works long-term.

Authority Without Being a Jerk
Authority doesn't come from your volume or your mood. It comes from being clear about what
you expect, correcting things quickly and calmly when they drift, and following through every
single time. If you correct behavior and then don't follow through, you've taught the team one
thing: wait it out. The manager doesn't mean it.
The team is always asking the same question about you: do they mean what they say? If the
answer is yes, you get respected fast. If the answer is no, you lose it fast — and it takes a long
time to get back.

Coaching vs. Discipline
This is where managers get confused most often. Coaching is the right move when someone
has a skill gap, unclear expectations, or it's a first offense. Discipline is the right move when the
behavior is repeated, the expectation has already been set, and the employee is making a
choice to ignore it.
If someone understands what's expected and keeps doing it anyway, it's not a training issue
anymore. It's a decision. And decisions that violate standards need to be treated as such.

Documentation: Facts Only
When you document, you're not writing a journal entry and you're not making a case against
someone. You're recording facts that protect both the employee and the business. Date and
time. The behavior. The standard being violated. What you communicated. What happens next
if it repeats.
Example: "2/27, 7:10pm — employee on phone behind host stand while guests were waiting.
Coached. Standard: phones on break only. Next step: written warning if repeated."
That's it. Neutral. Specific. No emotion. Documentation done right protects you when situations
escalate — and it also protects the employee by creating a clear, fair record.

Scripts for Common Correction Moments
 First correction (soft):
 "Hey — quick reset. I need you back on standard."
 Second occurrence (firm):
 "We've talked about this already. Next step is documentation."
 Pattern (final warning territory):
 "This is now a performance issue. If it happens again, we move to final warning or
 termination."

Keep corrections short. The longer you talk, the more it becomes a lecture — and lectures don't
work. Say it, mean it, move on.$BIBLE_1$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 2, $T$Section 2 — Professional Standards & Daily Conduct$T$, $BIBLE_2$Professionalism doesn't collapse all at once. It drifts. Phones slowly come out. Energy gradually
drops. Side work gets a little rushed. Tone gets a little casual. Uniform loosens. Guests feel it
before management even sees it, and by the time it's obvious, it's already become the new
normal.
Your job is to stop the drift before it gains momentum. One small correction handled calmly and
early is worth ten big confrontations later. This is what separates restaurants that can scale from
ones that are completely dependent on owner presence.

Phones
The phone policy isn't about control — it's about distraction. Guests notice when staff are on
their phones. It communicates something about the restaurant whether you intend it to or not.
The standard is simple: phones are not visible during service, and phone use is limited to
breaks unless it's manager-level operational use.
When you correct phone violations, don't debate, don't explain, and don't make it a long
conversation during service. Keep it short and move on.
 During service:
 "Phone away. Break time only."
 Slow night, staff on phones:
 "Slow doesn't mean phone time. Find something productive."
If it keeps coming up with the same person, that's when it gets documented. One reminder is
coaching. Three reminders without change is a pattern, and patterns require documentation.

Attitude, Tone & Energy
Attitude problems spread faster than performance problems. A single employee with a
consistently negative tone can drag down the energy of an entire shift. Watch for eye-rolling,
sarcasm in guest areas, visible frustration during rush, the "that's not my job" reflex, and gossip
clusters. These are early warning signs that culture is slipping.
The hardest correction to have is with a strong performer who has a bad attitude. Managers
often avoid it because the person is skilled and they don't want to lose them. But toxic talent is
expensive. Your best employees don't want to work next to someone with a consistently
negative presence, and if you don't address it, they'll make a decision about whether they want
to stay.
 Attitude correction:
 "You're strong at the job, but your tone is hurting the team. Skill alone isn't enough here —
 I need the attitude to match."
 "You're picking on me":
 "I'm enforcing the same standard for everyone. If I ever miss something, tell me — but the
 standard stays."

Urgency

Urgency isn't about moving fast. It's about awareness — seeing what needs to happen and
making it happen without being told. Resetting a table before someone asks. Jumping in when
the kitchen falls behind. Refilling drinks proactively. These things are habits, and habits come
from culture. When someone is standing around while a teammate is getting slammed, that's
the moment to correct it.
 Lack of urgency:
 "If you see someone overwhelmed and you're free, you move. That's our culture."
"That's not my job" is a culture infection. It cannot survive here. When you hear it, address it
immediately and directly.
 "That's not my job":
 "If you're capable and it needs to be done, it's your job. We're team-first here."

Correction Standards
Quick, minor corrections happen on the floor — fast, calm, quiet. Sensitive corrections, attitude
issues, or anything that requires a real conversation happens privately. You never correct
someone publicly in a way that humiliates them, and you never discipline from an emotional
place. If you feel frustrated, give yourself 30 seconds before you speak. It makes a difference.
The rule: minor issue, quick fix on the floor. Sensitive or repeated issue, pull them aside. Safety
risk, immediate and firm regardless of setting. Never yell across the restaurant. Never
embarrass someone in front of guests or coworkers.$BIBLE_2$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 3, $T$Section 3 — Attendance, Tardies & Call-Outs$T$, $BIBLE_3$Attendance isn't about punishment — it's about reliability. When one employee is unreliable,
someone else gets overloaded, resentment builds among the team, service slows, and
coverage falls apart. One chronically late or absent employee affects five to ten other people
every single shift. The cost is real even when it doesn't feel urgent.
Attendance problems don't explode overnight. They build through patterns that get quietly
tolerated. Your job is to recognize patterns early and address them before they become the
expectation.

Situations vs. Patterns
Life happens. Flat tires. Sick kids. Genuine emergencies. When something is rare,
communicated early, and makes logical sense, it gets grace — and it should. That's being
human. The problem is when situations become patterns: always sick on Saturdays, always a
few minutes late, always something comes up after a time-off request gets denied. That's a
different conversation.
You're not judging someone's personal life. You're evaluating whether their reliability meets the
standard the job requires. Those are different things, and keeping that distinction clear will help
you stay calm and fair in these conversations.

Tardies
Being five to ten minutes late repeatedly is not minor. It communicates that the shift can wait for
them — that their time is more important than the team's. "On time" means clocked in and ready
to work. Not in the parking lot. Not walking through the door at start time. Ready at start time.

Scenario: Three tardies in 30 days
 First pattern conversation:
 "You've been late three times this month. That's becoming a pattern. Even five minutes
 affects the shift. Going forward, I need this to stop. Next time gets documented."
 "It's traffic":
 "If traffic is consistent, you need to leave earlier. Being late can't become normal."
If you correct a tardy pattern and the employee improves for 90 days clean, you reset. You're
not holding it against them forever. But if the same pattern returns immediately after a raise or
after you reset, the next step moves faster.

Call-Outs
Requiring a doctor's note for every single call-out isn't realistic in today's environment. But
accepting every call-out without any scrutiny invites abuse. Here's how to think about it:
- Occasional illness, communicated early: approve, wish them well, no lecture.
- Second illness in the same month: monitor the pattern, note it.
- Third call-out in 60 days: have a direct conversation, possible documentation.
- Consistent pattern around busy shifts or after denied time off: documentation required.

Scenario: "Sick" every Saturday or every busy night
 Pattern conversation:
 "I've noticed you're frequently unavailable on our busiest shifts. That pattern can't
 continue. If it happens again, it'll be documented and a note may be required."

Scenario: Calls out after denied time-off request
 Direct but calm:
 "You were denied time off for coverage reasons, and then called out. That can't become a
 workaround. This will be documented."
Stay logical, not accusatory. Let the facts make the point.

No Call / No Show
This is serious, but verify before assuming. Attempt contact twice and document the attempts.
Log the time. If there's no response, it's a strike. If it's repeated without a verified emergency,
escalation toward termination is appropriate.
"My phone died" the first time gets coaching. The second time gets documentation. The third
time gets a final warning. You're not debating battery life — you're enforcing responsibility.

Late Call-Outs
A call-out within two hours of a shift is disruptive regardless of the reason. Was it truly sudden,
or was this avoidable? If it's an honest emergency, treat it as such. If it becomes a pattern,
document it and have the direct conversation about notice expectations.

Escalating to Ownership
Handle the middle stages yourself — coaching conversations, documentation, direct talks about
patterns. Escalate when the pattern continues after a final warning, when you suspect
manipulation, or when a legal question arises. Managers own the process up until termination
territory. That's when you loop us in.$BIBLE_3$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 4, $T$Section 4 — Timekeeping & Payroll Integrity$T$, $BIBLE_4$Timekeeping is not a minor admin task. It directly affects labor cost, overtime, tip distribution,
payroll accuracy, and legal compliance. When it gets sloppy, honest employees feel cheated
and dishonest behavior quietly spreads. Treat time the same way you treat product theft —
because it is.
Five minutes of extra time might not sound like much. Five minutes times five shifts a week
times ten employees across fifty-two weeks compounds into thousands of dollars. Small time
theft builds fast.

What Counts as Time Theft
Direct time theft includes buddy punching, clocking in before work actually starts, clocking out
late intentionally, and editing time without legitimate reason. Indirect time theft includes
excessive bathroom breaks, phone scrolling while clocked in, deliberately hiding in back areas,
and extending breaks. Both matter.

Clock-In and Clock-Out Standards
Employees clock in when they are ready to work — not when they walk through the door, not
while changing, not while socializing. The same applies on the back end. Clocking out happens
when work ends.

Scenario: Employee clocks in 10 minutes early daily
 Correction:
 "You can't clock in before your shift starts unless I've approved it. Clock in at your
 scheduled time."

Scenario: Late clock-out pattern
 Correction:
 "I've noticed you consistently clocking out late. Staying past your shift requires approval. If
 it continues without approval, we'll address it formally."

Buddy Punching — Zero Tolerance
This is intentional fraud, even if it feels like "just helping." Investigate calmly, verify timestamps
against camera if needed, document the facts, and escalate to ownership. In most cases,
confirmed buddy punching is termination-level.
 When confronting:
 "I need you to explain why your punch doesn't match the camera timestamp."
Do not accuse publicly. Do not argue. Present what you have, document the facts, and escalate.

Off-the-Clock Work
This is a legal issue, not just a policy preference. Employees cannot prep before clocking in or
finish cleaning after clocking out. If you allow it, you're exposing the business to wage and hour
liability. The standard is straightforward: if you're working, you're clocked in. That protects the
employee and the company.

Overtime
Monitor hours weekly. Overtime doesn't become a surprise if you're paying attention. Employees
need to notify a manager before hitting overtime, and overtime beyond what the schedule
requires needs prior approval. If someone consistently pushes into overtime without approval,
document it and address it directly.

Editing Timecards
Time edits must be legitimate and documented. A note like "Missed punch, verified via camera,
corrected to 5:02pm" is appropriate. What's not appropriate is adjusting time to quietly fix a
pattern problem, help someone avoid consequences, or make attendance records look cleaner
than they are. Every edit should have an explanation you'd be comfortable showing ownership.

When Employees Ask About Their Pay
Never dismiss a payroll concern casually. When someone says their check looks short, sit down
and look at it with them. Walk through their punches. If something is wrong, fix it. If everything
matches, explain how it was calculated. Handling payroll questions with transparency keeps
trust intact — dismissing them creates resentment that's hard to walk back.
Payroll runs on a semi-monthly cycle (5th and 20th). Cutoffs are the 15th and end of month.
Overtime applies to hours over 40 in a week. If there's a question you can't answer confidently,
say so and follow up — don't guess.$BIBLE_4$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 5, $T$Section 5 — Discipline, Write-Ups & Documentation$T$, $BIBLE_5$Discipline isn't punishment. It's structure. When you apply it consistently and fairly, it protects the
standards, protects the culture, and protects the strong employees who are watching to see if
the rules mean anything. When you avoid it, the culture slowly rots — not dramatically, just
quietly — until your best people decide they'd rather work somewhere that respects them
enough to enforce standards.

The Discipline Ladder
We use progressive discipline unless the behavior is severe enough to skip steps. Here's how
the ladder works:
A micro-correction happens in the moment — quick, calm, no lecture. "Phone away." Full stop.
No follow-up needed unless it repeats.
A coaching conversation is private and happens when a pattern is beginning to form. You clarify
the expectation and set the next consequence clearly. "This is the third time we've talked about
this. Going forward, it stops or we're moving to documentation."
A written warning is documentation. Behavior has been repeated, the expectation has been set,
and now it's on record. A write-up includes the date, the behavior, the previous coaching that
happened, the expectation going forward, and what happens next if it repeats. Employee signs
it.
A final warning is the last opportunity before termination. Be direct. Be specific. Be clear about
what happens if it occurs again.
Termination is for repeated violation after progressive steps, refusal to follow direction, or severe
behavior. More on that below.

When the Ladder Doesn't Apply
Some behaviors warrant immediate removal without working through progressive steps:
confirmed theft, buddy punching, violence or threats, harassment, discrimination, showing up
impaired, or major insubordination. These destroy trust immediately and require escalation to
ownership rather than a coaching conversation. If you encounter one of these situations,
remove the person from the shift, document what you observed, and contact ownership the
same day.

Emotional Trap
Managers avoid discipline for understandable reasons. "They've been here a long time."
"They're a good worker." "I don't want to ruin their day." "What if they quit?" These feelings are
real, but acting on them is a mistake. If you don't correct, your best employees eventually quit —
because they're watching a lower standard go unchallenged and deciding it's not worth their
energy to keep showing up strong.
Good employees want structure. Weak employees want flexibility. Your job is to decide which
group you're building a culture around.

Writing Documentation That Holds Up

Bad documentation: "Employee was being lazy and disrespectful." That's vague, emotional, and
won't protect anyone.
Good documentation: "Employee refused to reset table 12 after being instructed at 7:10pm.
Stated 'that's not my job.' Coaching provided. Expectation clarified. Next step: written warning if
repeated."
Facts. Time-stamped. Behavior-based. No editorializing. Always include what you said, what the
expectation is, and what happens next. That documentation protects you if a situation escalates
— and it protects the employee by ensuring they were given fair notice.

Difficult Conversation Scripts
Scenario: Repeat phone violation

 "I've corrected this multiple times. This is now documented. If it happens again, we move
 to the next step."

Scenario: Emotional employee during correction

 "I'm not attacking you. I'm correcting behavior. The standard doesn't change."

Scenario: Long-term employee slipping

 "You've been here a long time, which is exactly why I need you to lead by example. This
 can't continue."

Scenario: "You're picking on me"

 "I enforce the same standard for everyone. If you feel differently, we can review past
 documentation together."

Scenario: Termination conversation

 "Your employment is ending effective today due to repeated policy violations. We've had
 prior conversations and documentation. This decision is final."
Keep termination conversations short. You're not relitigating history. You're stating a decision.
Don't debate, don't soften it with extended explanations, and don't allow it to become an
argument. Short, clear, direct.

Redemption and Reset
We don't believe in permanent stains. If an employee had issues and genuinely turns it around
— clean behavior for 60 to 90 days, no repeat of the same problem — we reset. That matters
because people deserve a real path forward, not just a record that follows them indefinitely.

But fake resets don't count. If someone cleans up just long enough to get a raise and then
immediately regresses, the next discipline step comes faster. Track the timeline and hold the
standard both ways.$BIBLE_5$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 6, $T$Section 6 — Raises, Evaluations & Promotions$T$, $BIBLE_6$Raises are not rewards for being liked or for showing up long enough. They're investments in
consistency. When you give a raise to someone who hasn't earned it — because they asked
confidently, because you felt bad, because you wanted to avoid losing them — you send a
message to every other employee: standards are negotiable. That message is expensive.

How We Evaluate
We evaluate employees across five categories before any raise conversation. Walk into every
evaluation knowing where the person stands in each one.
Reliability: Are they on time, consistently? Do they rarely call out? Do they cover shifts
responsibly without it becoming a problem? Reliability is the foundation everything else sits on.
Professionalism: How is their tone? Their attitude toward teammates and guests? Is their
uniform right? Do they represent the restaurant well in guest interactions?
Urgency and Ownership: Do they anticipate what's needed? Do they help without being told?
Do they take ownership of their section and the guest experience without waiting to be directed?
Coachability: When you correct them, do they adjust? Do they argue corrections or accept
them? Someone who can't take feedback can't grow — and they pull the team backward.
Skill Level: Accuracy, speed, POS competence, station knowledge. This one matters, but it
matters least of the five. Skill without professionalism, reliability, and coachability doesn't get a
raise.

Scheduled Evaluations
Evaluations are tied to hire date, not the calendar year. This is intentional — calendar-year
raises create scheduling chaos, budget problems, and a wave of raise expectations all hitting at
the same time. Hire-date evaluations stagger the workload and keep it fair. Don't pre-approve
raises before doing the evaluation. Walk in with your notes, go through the categories, and
make the decision based on what's actually in front of you.

Denying a Raise — Do This Confidently
This is where weak managers fall apart. They give raises to avoid discomfort, which is worse
than not giving one at all. When a raise isn't appropriate, say so directly and give the person a
clear path forward.

Scenario: Attendance blocking raise

 "I'm not approving a raise today because of your attendance pattern. Go 60 days without a
 tardy or call-out and we'll review it again. I want to get there with you."

Scenario: Skill strong, attitude weak

 "You're talented. But your tone affects the team, and a raise requires both performance
 and professionalism. Let's work on the attitude first, and then we revisit."

Scenario: "I've been here three years"

 "Tenure is respected, but raises are performance-based. Let's go through the evaluation
 categories together and I'll show you exactly where we are."
Longevity is not a raise qualification. Being here a long time and earning a raise are different
conversations.

Post-Raise Monitoring
The 90 days after a raise are critical. Watch for urgency, attendance, and attitude. A raise
removes some of the pressure that was motivating performance — and for some employees,
performance regresses once that pressure is gone. If you see it happening immediately after a
raise, that's a pattern to address early, and the next discipline step moves faster than normal.
Raises increase expectations. They don't reset standards.

Promotions
Promoting the wrong person into management damages culture faster than a weak employee
can. Someone who is excellent at their job is not automatically suited for leadership. Before you
recommend anyone for a management role, ask yourself: are they consistent when it's
stressful? Do they have influence over peers that's positive? Do they take ownership beyond
their own section? Is their documentation history clean?
Skill alone is not enough. The wrong promotion creates a manager who either can't enforce
standards or undermines the authority of other managers. Get it right before making the
recommendation.

When Employees Compare Pay
You don't disclose other employees' pay. Period. If someone asks why someone else makes
more, the answer is the same every time:

 "Raises are based on individual performance. If you want to increase yours, let's go
 through the evaluation categories together and build a path."
Keep the conversation focused forward, not on what someone else is making.$BIBLE_6$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 7, $T$Section 7 — Conflict, Gossip & Team Stability$T$, $BIBLE_7$Restaurants are high-pressure environments with fast pace, long hours, and a lot of different
personalities in close proximity. Conflict is inevitable. Drama is optional. The distinction matters
because your job isn't to eliminate disagreement — it's to prevent instability from taking root.
Unmanaged conflict becomes culture. Gossip that spreads unchallenged becomes the
operating norm. Your job is to stay ahead of it.

Types of Conflict
Miscommunication is usually minor and resolves quickly when addressed directly. Ego conflict
— "I'm right, they're lazy, they don't respect me" — needs a reset of standards, not a personality
mediation. Gossip and undermining are more dangerous and spread quietly. Harassment and
serious allegations are in a different category entirely and require immediate escalation.
Identify the type before you react. What you do with a miscommunication is completely different
from what you do with a harassment allegation.

Gossip
Gossip destroys culture faster than incompetence. It divides teams, erodes trust, and turns the
focus of the restaurant inward when it needs to be on the guest. Signs of gossip: clusters going
quiet when someone approaches, sudden tension between employees who were fine last week,
"Did you hear" conversations, management being criticized behind their backs.
Stop it early. You don't need to lecture or investigate. You need to shut it down quickly and move
on.
 Overhear gossip about another employee:
 "We don't talk about teammates behind their backs. If there's a real issue, bring it to me
 directly."
 Gossip about management:
 "If you have a concern about leadership, bring it to me or ownership directly. Talking in
 circles won't fix anything."

Employee Complaints About Each Other
Never take the first story as fact. Listen, take notes, don't make promises, then talk to the other
party and compare what you hear. You're evaluating behavior — not personalities, not who you
like more.

Scenario: "They're lazy and not pulling their weight"
Ask for specific examples. Then observe objectively. If the complaint is valid, coach the other
employee. If it's exaggerated, coach the complainant about professionalism and not using your
time for venting.
 When asked to pick a side:
 "Here's the standard for both of you. We're resetting from here."

Emotional Employees

Crying, frustration, anger — these happen. Stay calm. Calm lowers the temperature. If emotions
escalate to the point where a productive conversation isn't possible, pause it and resume when
the person is ready to engage.
 Emotional escalation:
 "I'm listening. But we need to keep this professional."

Harassment and Serious Allegations
If a complaint involves discrimination, harassment, sexual misconduct, threats, or retaliation, the
protocol is clear: document immediately, escalate to ownership that same day, avoid making
promises, avoid conducting an independent investigation beyond the initial facts, and stay
neutral. These situations are not gossip-level issues. They carry legal exposure and need to be
handled carefully.
If someone makes a report — even a minor one — you cannot reduce their hours, treat them
differently, or become noticeably colder toward them. Even if the complaint feels exaggerated.
Retaliation is its own serious liability regardless of the underlying complaint's merit.

Cliques and Division
FOH vs. BOH tension, senior staff vs. new hires, language or cultural barriers creating isolation
— these things weaken the team. When you see it forming, rotate assignments, cross-train, and
set the tone from the top. If cliques form and go unchallenged, the team stops operating as a
unit.$BIBLE_7$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 8, $T$Section 8 — Drug & Alcohol Enforcement$T$, $BIBLE_8$The restaurant industry has a long history with substance use. We're realistic about it. What
we're not realistic about is impairment during a shift. Your job is not to moralize about what
someone does with their personal time. Your job is to protect the safety of guests, the team, the
business, and the person themselves during the hours they're on the clock.
The line is clear: legal does not equal acceptable at work. Alcohol is legal. Marijuana may be
legal. Prescription medication is legal. Impairment during a shift is not, regardless of the
substance.

What Impairment Looks Like
Watch for slurred or unusual speech, eyes that are red combined with behavioral changes, the
smell of alcohol or marijuana, slowed reaction time, unusual aggression or excessive laughter,
loss of coordination, careless food handling, or erratic emotional behavior. One sign alone isn't
enough to act — smell alone, for instance, isn't automatic termination. But behavior plus
performance plus a safety risk? That requires action.

Marijuana
It's common. It's culturally normalized. That doesn't change the standard. Treat it exactly like
alcohol: no intoxication during a shift, no noticeable smell, no visible impairment, no
consumption on break or in the restroom.

Scenario: Smell of marijuana, no behavior issues

 "I'm noticing a smell. I'm not accusing you of anything, but I can't have that in the building.
 Make sure it doesn't happen again."
Document it. Monitor going forward.

Scenario: Smell plus slowed behavior plus visible impairment during rush

 "I'm sending you home for safety. We'll talk tomorrow."
Remove them from the floor. Don't argue, don't embarrass them publicly, don't debate whether
they're actually impaired. You're making a safety decision. Document what you observed.

Alcohol
Zero tolerance for drinking during a shift unless there's a management-authorized tasting
situation. If you suspect intoxication, remove the person from the floor immediately, speak to
them privately, and escalate to ownership. Confirmed intoxication is termination territory.

Prescription Medication
Handle carefully. You cannot demand medical information from an employee. But if behavior is
affecting safety — coordination problems, slowed reaction, confusion — you can address it
directly from a safety standpoint without getting into medical details.

 Safety concern with medication:
 "I'm concerned about your performance and safety right now. If something is affecting your
 ability to work safely, we need to address it."
Escalate to ownership when you're uncertain. This is a situation where legal exposure moves
quickly.

How to Document
Document observed behaviors only. Never write "employee was high" — that's a conclusion, not
a fact. Write: "Employee displayed slurred speech, slow reaction during service, and smell of
marijuana was noted. Employee was removed from shift for safety. Ownership notified." Facts.
Behavior. Actions taken. That's what holds up.$BIBLE_8$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 9, $T$Section 9 — Uniform & Appearance Standards$T$, $BIBLE_9$Guests form their first impression within seconds of walking in — before food, before service,
before any conversation. They're reading cleanliness, polish, and discipline from the visual
environment around them. A sloppy uniform communicates something about the kitchen and the
management even if it isn't true. Appearance is brand protection, not personal preference.

Pre-Shift Inspection
Before every shift, do a quick visual check of the team as they come in. Correct shirt, clean and
unstained. Proper hat or hair control for BOH. Apron clean. Non-slip shoes. No extreme
appearance issues that conflict with the professional standard. Name tag where applicable.
This takes two to three minutes. If you catch it before service starts, you avoid the awkward
correction in front of a guest. Do it consistently and your team will come in prepared.

Gray Areas
Tattoos are acceptable unless they're offensive or explicit. Visible neck and face tattoos may be
a conversation depending on the concept — use your judgment and check with ownership on
borderline cases. Piercings should be minimal and professional-looking. Hair must be
controlled. Nails must be clean and reasonably short for anyone handling food.
When something is a gray area, use this test: would you be comfortable if a guest noticed it and
commented? If not, it needs to be corrected. Apply the same standard consistently across the
team.

Enforcement Without Negotiation
Uniform standards don't flex based on whether someone has a good excuse. "I forgot my apron"
means you fix it before clocking in, or you find a solution — not that it gets overlooked because
the shift is starting. The more you hold the line consistently, the less you'll be tested on it.
 Out of uniform:
 "You can't work like that. Fix it before you clock in."
 Arguing the standard:
 "This isn't a negotiation. The standard exists for a reason. Fix it."
If it becomes a repeated issue, that's when it gets documented. One correction is coaching.
Three corrections without change is a pattern.$BIBLE_9$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 10, $T$Section 10 — Discounts, Comps, Voids & Money$T$, $BIBLE_10$Control
Restaurants don't lose money in one dramatic theft event. They lose it in small, consistent leaks
— free drinks here, an employee meal that never got rung in, a comp that wasn't justified, a void
that doesn't quite make sense. Small leaks become thousands of dollars a month when they're
tolerated over time.
Money discipline isn't about suspecting everyone of being a thief. It's about preventing the
temptation by maintaining a transparent, consistent system. When the system is tight, honest
people feel protected and dishonest behavior has nowhere to hide.

Employee Meal Policy
Every employee meal must be rung in, every time — discounted to the appropriate rate per
policy. No "I'll pay at the end of shift." No off-record food. No exceptions, including for
management. If managers bypass the system, the team sees it and will do the same.

Scenario: Employee eats without ringing it in
 First occurrence:
 "I noticed you ate but it wasn't rung in. All food gets entered. This cannot happen again."
 "It was just a small side":
 "Small or large, it gets rung in. That's non-negotiable."
If it repeats: written warning. If it appears intentional: escalate. Food theft sounds minor until you
realize how quickly "small things" add up across a team.

Comps — A Tool, Not a Habit
Comps exist for legitimate service recovery: a real mistake, a quality issue, a situation where the
guest's experience fell below standard and it needs to be acknowledged. Comps are not for
generosity, personal favorites, "they seemed nice," or to boost a tip percentage. Every comp
requires manager approval and needs to be logged against an actual reason.
Watch for servers who comp frequently. Sometimes it's a performance problem — they're
making more mistakes than average. Sometimes it's abuse — using comps to increase their tip
percentage on reduced checks. Both are worth investigating.

Voids
Voids happen. But excessive voids by the same employee, or voids that occur after a cash
payment, are red flags. Void after cash payment is a classic manipulation move — the check
disappears and the cash goes with it. If you see a suspicious void pattern, investigate quietly,
check receipts and camera if needed, and escalate if the pattern continues.
Never accuse publicly. If you suspect something serious, document what you have and bring it
to ownership.

"Helping a Friend" Is Still Theft

Extra drinks, a free dessert, a small discount that wasn't authorized — it feels generous, but it's
theft from the business regardless of the intent. The employee making the decision doesn't have
the authority to give away product at their discretion. Make that clear directly and immediately.

 "We don't give free items outside policy. That's considered theft — I understand the
 intention, but the standard is the same regardless."

What to Review Regularly
Check void reports weekly. Monitor comps by employee — if one person's comp rate is notably
higher than everyone else's, ask why. Watch meal entries daily during slower shifts. If you see
something that doesn't look right, investigate calmly and document what you find. Don't let "it's
probably nothing" be the reason you miss a real pattern.$BIBLE_10$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 11, $T$Section 11 — Safety & Sanitation$T$, $BIBLE_11$Restaurants are high-risk physical environments: knives, hot oil, steam, wet floors, chemicals,
heavy equipment, open flames. One careless moment creates injury, workers' comp claims,
health department violations, and liability exposure that affects the entire business. Safety is not
optional. It's leadership.

Slip and Fall Prevention
Wet floors are the single most common liability. Every spill gets cleaned immediately. Wet floor
signs go up before the cleanup and come down when the surface is dry. Mats need to be
positioned correctly — especially around the dish pit, bar, and kitchen line. If a server walks past
a spill without stopping to address it, that's a correction worth making immediately.
 Server walks past a spill:
 "Don't walk past that. Stop and fix it."

Knife and Equipment Safety
In the BOH, watch for careless knife storage, improper carrying technique, cutting toward the
body, loose handles, and rushing through prep. Correct immediately and without hesitation. If
you see someone handle a knife carelessly, stop it in the moment — not after it's done.
 Unsafe knife handling:
 "Stop. That's unsafe. Reset your position and control the blade before continuing."

Chemical Safety
Chemicals must be labeled, stored properly, and kept away from food prep surfaces. Mixing
certain chemicals creates dangerous fumes — if you're not sure whether something is safe to
combine, the answer is no. Make sure your team knows what they're working with and how to
handle it. MSDS sheets should be accessible.

Near-Misses
A near-miss is as important to document as an actual incident. Someone slipped but caught
themselves. A knife dropped and narrowly missed a foot. Hot liquid spilled in a way that could
have burned someone badly. These are early warning signs that something in the environment
or a behavior pattern needs to change. Document it, address the cause, and move on. Don't let
them go unacknowledged just because nobody got hurt.

Incidents
When an injury occurs, your priorities in order: make sure the person is okay and get them
appropriate care if needed. Secure the area. Document exactly what happened — time,
location, what the employee was doing, what caused the incident, who witnessed it. Notify
ownership the same day. Do not minimize or delay. Workers' comp, insurance, and OSHA all
care about how and when incidents get reported.$BIBLE_11$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 12, $T$Section 12 — Running a Shift$T$, $BIBLE_12$Shift leadership has three phases. Every manager who runs a great shift is good at all three: the
open, the service, and the close. Where most managers fall short is the middle — they prepare
well, then disappear into the chaos of service rather than leading through it.

Phase 1: Opening the Shift
Before the doors open, you should know who's scheduled, where everyone is positioned, what's
86'd, what the reservation situation looks like, and what you need to call out in the pre-shift
meeting. Reservations and large parties need to be communicated to the team. Any critical
focus area — phone enforcement, table turn speed, whatever is relevant that day — gets a
single, clear mention.
Pre-shift meetings should be short. Two to three minutes, not ten. Cover what matters, set the
tone, and move. The team's energy at the start of a shift is often a direct reflection of the
manager's energy. Come in focused.
Before service starts, do your uniform check, walk the floor, look at the side work setup, and
make sure the physical environment is right. Find the small things before guests do.

Phase 2: Active Service
Once service starts, your job is to stay visible and mobile. Every 10 to 15 minutes, you should
be walking the floor, checking kitchen pace, watching table turns, watching host flow, and
reading guest body language. If you're stationary for too long, you're blind. If you're in the office
during a rush, something is wrong.
Watch for energy drift: servers clustering, kitchen slowing, staff leaning against walls, tone
becoming casual during the busiest part of the night. Correct it fast and move on.
 Breaking a cluster:
 "Break it up. Back to zones."
Anticipate bottlenecks before they become problems. Ticket backlog building in the kitchen?
Communicate it to FOH now, not after guests start complaining. Host getting buried? Adjust
seating pace. Bar overloaded? Reassign someone to support. Strong managers see problems
forming and intervene before they explode.
You do not need to call ownership for minor comps, correction conversations, small scheduling
adjustments, or side work redistribution. Those are yours to handle. You escalate termination
decisions, legal risk, major theft suspicion, serious guest injury, and harassment allegations.
Own the rest.

Phase 3: Closing the Shift
How you close determines what the next shift walks into. Weak managers rush out the door.
Strong managers finish correctly.
Close-out means: cash handled correctly, voids and comps reviewed, closing side work
completed and inspected, kitchen cleaned properly, floors mopped, trash removed, restrooms
checked, lights and equipment secured, and the next shift prep is done. Don't assume —
inspect. The standard at close is the same as the standard at open.

End every shift with a quick mental debrief: what went well, what drifted, who stood out
positively, who needs coaching, and whether any pattern is forming that needs attention next
shift. That mental log is what separates managers who are constantly reactive from managers
who build consistent operations over time.

Weekly Self-Audit
At least once a week, ask yourself honestly: are phones creeping back? Are tardies trending
up? Is the uniform standard slipping? Is energy lower than it was last month? Are comp rates
rising? If the answer to any of these is yes, the correction starts now — not when it becomes a
bigger problem.

What Leadership Means Here
You weren't promoted because you were the best at your position. You were promoted because
ownership saw something in you beyond execution — the ability to lead people, protect
standards, and think beyond your own shift.
Working hard earns you respect. Leading consistently earns you trust. Those are different
things, and only one of them is what the manager role actually requires.
Leadership here means enforcing standards when ownership isn't in the building — not because
you're afraid of being caught doing otherwise, but because the standard exists whether anyone
is watching or not. It means correcting behavior early before it becomes a blowup. It means
protecting fairness by being consistent, even when consistency is uncomfortable.
You will have to correct people you genuinely like. You will have to deny raises to strong
performers who aren't ready. You will have to shut down gossip, remove someone from a shift,
make calls that others disagree with. That's part of the responsibility. It doesn't get easier, but it
gets cleaner — the more consistent you are, the less often you're put in difficult positions,
because the team knows exactly what to expect from you.
When standards are weak, the effects are predictable: strong employees leave, mediocrity
becomes the new normal, costs increase, ownership gets pulled back into daily operations, and
growth stops. When standards are strong, the opposite happens: teams stabilize, guests trust
the experience, raises become possible, careers get built, and expansion becomes realistic.
Leadership is not about being liked. It's about being respected. It's not about control — it's about
consistency. You are expected to model the behavior we require from the team. If you cut
corners, they cut corners. If you stay calm, they stabilize. If you enforce fairly, they trust you.
We are building restaurants that run at a high level with or without ownership standing in the
room. That only works if the people leading shifts operate with clarity, consistency,
professionalism, and accountability — every day, not just when it's easy.

Lead with structure. Lead with fairness. Lead with strength.
The standard is yours now.$BIBLE_12$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 13, $T$Voids & Comps$T$, $BIBLE_13$What they are, how to execute, how to document, and what happens when controls fail.

 WHG Manager's Reference Guide — Addendum

The Difference Between a Void and a Comp
These two words are not interchangeable. Most managers use them loosely. That looseness
costs money and destroys your audit trail. Here is the hard line:
A void is the removal of an item or an entire check from the system before payment has been
collected. The transaction never completed. Something was ordered and then cancelled,
entered incorrectly, or never made. Voids happen before the ticket closes.
A comp is a deliberate decision to reduce or eliminate a charge after the fact — as a guest
recovery tool, a goodwill gesture, or a management call. Comps happen after the ticket would
otherwise be closed and paid in full.

 Simple rule: If the guest hasn't paid yet and something needs to come off — that's a void.
 If the guest should have paid but we're choosing not to charge them — that's a comp.

Who Has Authorization
At all WHG concepts, void and comp authority is restricted as follows:
- Restaurant Manager — full void and comp authority, all amounts
- Assistant Manager — full void and comp authority, all amounts
- Shift Leader — void and comp authority during their shift, must be logged immediately in
 the R365 Managers Log with reason
- Servers, bartenders, and all other staff — zero void or comp authority
This is enforced at the POS level through PIN access. If a server needs a void or comp, they
come to a manager. The manager evaluates the situation, makes the call, and enters their PIN.
There is no exception to this structure.

How to Execute in Shift4 (Boru Ramen)
Executing a Void in Shift4
- Navigate to the open ticket in the system
- Select the item to be removed
- Select 'Void Item' — enter your manager PIN when prompted
- Select the void reason from the dropdown (Incorrect Order, Customer Change, Entered
 in Error, etc.)
- Confirm the void — the item is removed from the ticket
- If voiding an entire check: go to Ticket Management → select ticket → Void Ticket →
 enter PIN → confirm reason
Important: Shift4 logs every void with the manager PIN that authorized it, the timestamp, and
the reason code. This creates your audit trail automatically. Never use someone else's PIN to
execute a void on their behalf.

Executing a Comp in Shift4
- Navigate to the closed or open ticket
- Select 'Comp Item' or 'Comp Check' depending on scope

 WHG Manager's Reference Guide — Addendum
- Enter your manager PIN
- Select comp reason (Guest Recovery, Quality Issue, Wait Time, Management Discretion,
 etc.)
- Confirm — the comp is applied and logged
For partial comps — comping a single item rather than the full check — use 'Discount Item' with
the appropriate comp reason. This keeps the line item visible on the ticket while reducing the
total.

How to Execute in Toast (Ichiban)
Executing a Void in Toast
- Open the ticket from the order screen or ticket lookup
- Select the item → tap 'Remove' or 'Void'
- Toast will prompt for manager authorization — enter your PIN
- Select the reason code
- Confirm — item removed and logged under your manager ID
- For full ticket void: Manage Orders → select ticket → Void Order → PIN → reason

Executing a Comp in Toast
- Open the ticket → select 'Discount' or 'Comp'
- Enter manager PIN
- Select reason code
- Apply to item or full check
- Confirm — logged under your PIN with timestamp

How to Record in the R365 Managers Log
Every void and comp must be logged in Restaurant365 the same shift it occurs. This is not
optional. This is not something that gets caught up on later. It happens during or immediately
after the shift while the details are fresh and the memory is accurate.
What your log entry must include for every void or comp:
- Date and approximate time of the transaction
- Void or comp — which type
- Table number or ticket number
- Item(s) involved and dollar amount
- Reason — be specific. Not just 'guest complaint' — what was the complaint? Not just
 'wrong order' — what was wrong?
- How it was resolved — what was the outcome for the guest?
- Your name as the approving manager

 Example entry: 'Comp — Table 12, $14.50 Rouge Red Tonkotsu comped in full. Guest
 reported broth arrived lukewarm. Apologized, replaced bowl, comped original. Guest
 satisfied, did not request anything further. — Manager: [Name]'

 WHG Manager's Reference Guide — Addendum

If a shift leader executes a void or comp, the log entry is entered by the shift leader under their
own access. The opening manager or AM reviews and acknowledges it at the start of the next
shift.

The Daily Void & Comp Pull — Opening Manager Responsibility
Every opening manager starts their shift by pulling the previous day's void and comp reports
from the POS before doing anything else. This is part of the morning opening sequence and is
non-negotiable.
- Log into Shift4 or Toast → Reports → Void Report (select previous business day)
- Log into Shift4 or Toast → Reports → Comp/Discount Report (select previous business
 day)
- Cross-reference every line item against the R365 Managers Log entries from the
 previous day
- Every void and comp in the POS should have a corresponding log entry. If it doesn't —
 that is a documentation failure and must be addressed with the manager who worked
 that shift
- Any void or comp that appears unusual, unexplained, or outside normal patterns gets
 flagged and documented in that day's log entry
- Pattern review: if the same employee, same item, or same time of day keeps appearing
 in the void/comp report across multiple days — that is a red flag requiring investigation

Red Flags — What to Watch For
The void and comp system protects the business when it is used correctly. It also exposes the
business when it is abused. Managers must know the difference between a normal operational
void/comp and a suspicious pattern.

Normal
- Server entered the wrong item and caught it before the kitchen started — voided
 immediately
- Guest changed their mind before food was made — item voided
- Guest received wrong dish — item comped as part of table recovery
- Food took too long during a genuine rush — manager discretion comp on an appetizer
 or dessert

Red Flags
- High void frequency from one specific server or shift leader — especially on cash tables
- Voids happening consistently at the end of shift just before close
- Comps applied after payment was collected without a log entry explaining why
- Same item voided and re-rung multiple times on the same ticket
- Voids on items that the kitchen reported were completed and run
- Comp reasons that are vague, missing, or don't match what the floor reported that night

 If something doesn't add up in the void or comp report — pull the camera footage for that
 table, that ticket, and that time window before drawing conclusions. Document what you

 WHG Manager's Reference Guide — Addendum

 find. Then bring it to the next manager or ownership. Do not confront the employee based
 on a report alone.

​$BIBLE_13$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 14, $T$The Managers Log$T$, $BIBLE_14$What goes in it, when it goes in, and why it is the single most important communication tool we
have.

What the Managers Log Is
The Managers Log in Restaurant365 is the official daily record of everything that happens at
each location. It is not a diary. It is not optional. It is the primary communication tool between
shifts, between managers, and between management and ownership.
If it didn't get logged, it didn't happen. That is the standard we operate by.
The log exists for three reasons. First, it keeps the entire management team aligned across
shifts so nothing gets lost in transition. Second, it creates a documented pattern record that
protects the business and the manager legally if a situation escalates. Third, it gives ownership
real-time visibility into every location without having to be physically present.

Who Logs and When
- Restaurant Manager — logs their entire shift before clocking out
- Assistant Manager — logs their entire shift before clocking out
- Shift Leader — logs their shift before clocking out, under their own R365 access
- Opening manager each day — reviews and acknowledges the previous shift's entries
 before beginning their own
The log entry happens before you clock out. Not when you get home. Not tomorrow morning.
Before you leave the building. The timestamp matters.

What Goes Into Every Entry
Every log entry is organized by category. Not every category will have something every shift —
but you should consciously think through each one before closing out your entry for the day.

Attendance & Staff

 WHG Manager's Reference Guide — Addendum
- Late arrivals — employee name, how many minutes late, whether this is a pattern or
 isolated
- Call outs — employee name, reason given, how much notice was provided, whether
 coverage was found
- No call / no show — employee name, attempts made to contact, shift impact
- Any early send-homes — who, why, shift coverage impact
- Sick employees — who was sent home, any food safety implications

Voids & Comps
- Every void executed that shift — ticket number, item, amount, reason
- Every comp executed that shift — ticket number, item, amount, reason, guest outcome
- Any unusual patterns noticed in the void or comp activity

86'd Items
- What item ran out, what time, who was notified (kitchen manager, front of house team)
- How guests were informed
- Whether the item needs to be on the order for next delivery

Guest Experience
- Complaints — what happened, how it was handled, whether a comp was used
- Guest incidents — conflicts, walkouts, refusals of service, anything involving a guest that
 was out of the ordinary
- Compliments — specific team members called out by name by guests. These matter and
 deserve to be logged just as much as problems do

Safety & Incidents
- Any employee injury — no matter how minor — with time, nature of injury, and what first
 aid was provided
- Any guest injury or incident — including slips, falls, allergic reactions, or anything that
 could result in a claim
- Any spills, hazards addressed, or equipment issues that created a safety concern
- Police involvement, security incidents, or any situation requiring 911

Equipment & Maintenance
- Any equipment malfunctions — what broke, when, whether it is still down
- Any vendor or maintenance calls made — who was called, ETA on resolution
- Anything that needs to be followed up on by the next manager

Wins & Positives
- Strong individual performances worth recognizing
- Team moments — great rush execution, exceptional guest feedback, strong teamwork
- Any operational improvements noticed that worked well

 WHG Manager's Reference Guide — Addendum

This category is not a formality. Recognizing what went right is just as important as documenting
what went wrong. Managers who only log problems create a culture where the log feels like a
punishment. The log should reflect the full reality of the shift.

Open Items for Next Manager
- Anything unresolved that the next manager needs to follow up on
- Any conversations that were started but not finished
- Any patterns that need watching

 The last thing you write in every log entry: 'Anything the next manager needs to know
 before their shift starts.' If the answer is nothing — write 'No open items.' This confirms
 you thought about it, not that you forgot.

What a Good Log Entry Looks Like
A good entry is specific, factual, and complete. It does not editorialize. It does not protect
anyone. It does not assume the reader knows context they weren't there for.

 Example of a weak entry: 'Busy night. A few issues. Table 7 was unhappy. Talked to some
 staff.'
 Example of a strong entry: 'Friday 3/7 — Dinner shift. Server late 12 min (pattern — third
 time this month, verbal coaching given, documented). Table 7 comp — $22 ramen
 comped, guest reported hair in bowl, verified, replaced and comped full ticket, guest left
 satisfied. 86'd spicy miso at 7:45pm, all servers notified, noted for Tuesday order. Positive
 — [Name] handled a 3-table turn during our 7pm rush without a single complaint, guest at
 table 4 asked for her name specifically. Open items: walk-in door gasket still not sealed
 tight — maintenance called, waiting on callback.'

Shift Leader Log Entries
Shift leaders have R365 access for log entry purposes. Their authority is documentation only —
they log what happened during their shift and ensure nothing falls through the cracks before a
manager takes over.
Shift leader entries are reviewed and acknowledged by the AM or RM at the start of the next
shift. If a shift leader logs a void or comp, the reviewing manager confirms it matches the POS
report and that the reason is documented adequately.
If the shift leader's log entry reveals something that requires a management decision — a staff
conflict, a pattern, an equipment issue — the reviewing manager owns that follow-up. It does
not go back to the shift leader to resolve.

​$BIBLE_14$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 15, $T$Theft Recognition Guide$T$, $BIBLE_15$WHG Manager's Reference Guide — Addendum

Knowing what to look for is the first line of defense. Most theft succeeds because nobody was
watching for it.

Why This Section Exists
Restaurant theft doesn't usually look like someone walking out with a bag of cash. It looks like
small, repeated losses that individually seem explainable. A voided ticket here. A missing item
there. A cash table that didn't match. By the time the pattern becomes obvious, weeks or
months of loss have already occurred.
Managers must know exactly what theft looks like at every position and every part of the
operation. Awareness is the deterrent. When your team knows that managers understand how
theft happens, the temptation drops significantly.
The categories below cover every known theft method in restaurant operations. Review this
section when you onboard. Review it again every few months. Use it as your internal audit
guide.

Time Theft
- Buddy punching — one employee clocks in for another who hasn't arrived yet
- Early clock-ins — employees clocking in 10-15 minutes before their shift without
 authorization
- Working off the clock and then back-entering time that wasn't worked
- Not clocking out at shift end on a double — letting time run into the next day
- Taking breaks on the clock without clocking out for them
- Using a higher job code than your actual position to inflate pay rate
Time theft is often not perceived as real theft by the employee. It needs to be treated and
documented exactly the same as cash theft. Cross-reference timecards against the schedule
and against camera footage when a pattern is suspected.

Register & POS Theft
- Using a manager's login to execute voids or discounts — this is why managers must
 never share PINs
- Reusing coupons or applying the same discount code multiple times on different tickets
- False paid-outs — recording a paid-out expense that didn't actually occur to pocket the
 cash
- Mis-tipping — a server taking a tip that was left for a different server on a transferred or
 inherited table
- Adding or falsifying credit card tip amounts after the guest has left
- Taking a photo of a guest's credit card information
- Transferring checks to other servers or managers to obscure accountability on a ticket

 WHG Manager's Reference Guide — Addendum

Floor Theft
- Taking cash from a table before or after it has been reported — especially on tables
 paying cash
- Applying a discount to a cash table after the guest has already paid full price and
 pocketing the difference
- Walkout fraud — claiming a table walked out when they actually paid cash that was
 pocketed
- Giving guests free items or extra food without ringing it in, in hopes of a larger cash tip
- Ringing drink orders as water or non-alcoholic items when alcohol was served
- Not ringing in sauces, dressings, or add-ons that carry a charge
- Intentional refire — claiming food was wrong in order to get a second serving without
 paying

Bar Theft
- Reusing old printed checks to collect cash twice on the same ticket — not printing a new
 receipt for a new round
- Giving away alcohol to friends or preferred guests without ringing it in
- Drinking product during or after service
- Taking bottles or product home at the end of shift
- Underpouring and pocketing the difference on high-volume spirits
- Over-ringing cash transactions and pocketing the overage

Kitchen Theft
- Taking food home without authorization — product that 'didn't sell' or 'was about to be
 wasted'
- Portioning over standard on personal meals or staff meals to stockpile product
- Ordering excess inventory and reselling it — rare but worth being aware of in purchasing
 positions
- Giving food to friends who come in and sit at the bar or stand at the window

How to Investigate — The Right Way
When you suspect theft, your job is to build the case — not to confront on suspicion alone. A
wrongful accusation damages trust, morale, and potentially creates legal exposure for the
business.
- Pull the void and comp report for the period in question
- Cross-reference against the cash report and the tip report
- Pull camera footage for the relevant time window — be specific about what you are
 looking for
- Document every discrepancy in the Managers Log with dates, amounts, and ticket
 numbers
- Bring the documented pattern to ownership before any confrontation occurs

 WHG Manager's Reference Guide — Addendum
- Ownership determines next steps — whether that is a termination conversation, a formal
 investigation, or a law enforcement referral

 Never confront an employee about suspected theft based on a single incident or a gut
 feeling. Build the paper trail first. The camera footage and the POS report are your
 evidence. Your suspicion alone is not.

​$BIBLE_15$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 16, $T$Security Camera Usage$T$, $BIBLE_16$The cameras are a management tool, not just a security feature. Know when and how to use
them.

What the Cameras Are For
Every WHG location is equipped with audio and video surveillance in all common operational
areas. These cameras are not there to catch people on a bad day. They are there to protect the
business, protect employees, protect guests, and provide an objective record when something
is disputed.
Managers have access to camera footage as part of their operational role. That access comes
with responsibility — footage is confidential, it is not shared with staff, and it is only accessed for
legitimate business purposes.

When to Pull Footage — By Situation
Staff Theft Investigation
What to pull: The register area, the floor, and the bar for the shift in question. Cross-reference
ticket timestamps from your POS report with the corresponding camera window.
What to look for: Cash handling, table interactions, voids executed at the POS terminal, what
happened immediately after a table left on a cash payment.
What to document: Timestamp, camera angle, what you observed, how it corresponds to the
discrepancy in the report. Do not skip documentation — this is what builds the case.

Guest-Staff Conflict
What to pull: The section where the interaction occurred, plus the host stand or bar if the guest
started or ended there. Pull 10 minutes before the reported incident through its resolution.

 WHG Manager's Reference Guide — Addendum

What to look for: Who initiated, what the body language was, whether the escalation was driven
by the guest or the employee, and whether a manager responded appropriately and in a timely
manner.
What to document: Objective description of what the footage shows. Avoid interpretation — stick
to what is visible and audible.

Staff-Staff Conflict
What to pull: The area where the conflict reportedly occurred. If it happened in a non-camera
area like a walk-in, pull the surrounding footage for context — what happened before and after.
What to look for: Whether the conflict was verbal or physical, who was involved, whether other
staff witnessed it, what the manager on duty did.
What to document: Same as above — facts only, no interpretation. If the footage doesn't
capture the incident directly, note that clearly.

Void or Comp Investigation
What to pull: The POS terminal and the table in question for the timestamp range of the void or
comp.
What to look for: Whether the guest actually had a problem, whether food was actually returned,
whether the interaction matches the reason code entered in the system.
What to document: What the footage shows happened at the table versus what was entered in
the system.

Guest Theft
What to pull: The entrance and exit footage, the table or area where the incident occurred, and
any camera covering the path between them.
What to look for: The item being taken, the guest's route, whether there was any concealment.
What to document: Timestamp, description of what is visible. If law enforcement is involved, do
not delete or overwrite footage — notify ownership immediately so it can be preserved.

Time Theft or Timekeeping Disputes
What to pull: The entrance area and back-of-house camera for the clock-in and clock-out times
in question.
What to look for: Whether the employee was actually on premises at the time they clocked in or
out. Whether buddy punching occurred.
What to document: When the employee physically arrived versus what the timecard shows.

Accident or Injury
What to pull: The area where the injury occurred, beginning 5 minutes before the reported time.
What to look for: What caused the injury, whether safety protocols were being followed, whether
there were any contributing factors.
What to document: Factual description of what the footage shows. This footage may be needed
for insurance or legal purposes — notify ownership immediately and preserve it.

 WHG Manager's Reference Guide — Addendum

Confidentiality Rules
- Camera footage is never shown to or discussed with non-management staff
- Footage is not shared externally except through ownership authorization or law
 enforcement request
- Managers do not use footage to create a surveillance atmosphere — it is accessed
 when there is a specific, legitimate reason
- If a staff member asks whether they are on camera, the answer is yes — all common
 areas are monitored. That is all they need to know.

​$BIBLE_16$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 17, $T$Financial Awareness for Managers$T$, $BIBLE_17$You don't need to run the books. You do need to understand what your decisions cost.

existing guide

The 30 / 30 / 3 Framework
Every manager at WHG should understand three numbers. These are the targets that
determine whether the business is healthy or bleeding.
- 30% Labor — your total labor cost should not exceed 30% of revenue. Every time you
 call someone in unnecessarily, let overtime run, or keep extra staff on a slow night, you
 are pulling this number in the wrong direction.
- 30% Food Cost — the cost of what you serve relative to what you sell for it. Every time
 food is wasted, improperly portioned, stolen, or comped without justification, this number
 goes up.
- 3% Growth — the goal is not just to survive but to grow. When food, service, and
 ambiance are consistently on standard, the business grows. When they drift, it stalls.

 Your job as a manager is not to manage the 30/30/3 — that is ownership's job. Your job is
 to understand that every decision you make on the floor has a financial impact, and to
 make decisions that protect the business rather than erode it.

Prime Cost — What It Means
Prime cost is food cost plus labor cost combined. It is the single most important number in
restaurant operations. For most healthy restaurants, prime cost should stay under 60% of
revenue.

 WHG Manager's Reference Guide — Addendum

As a manager, you impact prime cost every shift through:
- Labor decisions — who you call in, who you send home, whether you let overtime run
- Waste decisions — whether food is being portioned correctly, stored properly, and not
 thrown away unnecessarily
- Comp and void discipline — every unjustified comp is a food cost hit. Every void on food
 that was already made is waste.
- Speed of service — tables that turn faster generate more revenue against the same
 fixed labor cost

The Daily Sales Summary
Every opening manager pulls the Daily Sales Summary from Restaurant365 as part of the
morning routine. You are looking at three things:
- Net sales versus the same day last week and last year — are we trending up, flat, or
 down?
- Labor percentage — did the previous shift stay within target? If not, why?
- Any unusual voids, comps, or discounts that weren't in the Managers Log
You do not need to be an accountant. You need to be aware. A manager who reviews their
numbers daily catches problems in days. A manager who ignores them discovers them in
months — after real damage has been done.

What Managers Are Never Authorized to Do
- Access or modify payroll records
- Make purchasing decisions above their designated authorization level
- Issue refunds outside of the POS comp and void system
- Handle or authorize bank deposits without following the cash handling protocol
- Discuss financial performance with staff — P&L data, sales figures, and labor cost
 percentages are management and ownership information only

​$BIBLE_17$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 18, $T$Manager-Staff Relationships & Neutrality$T$, $BIBLE_18$The line between professional and personal is where most management problems begin.

 WHG Manager's Reference Guide — Addendum

Why This Section Exists
Restaurants are social environments. People work long hours together under pressure.
Friendships develop. Deeper relationships develop. That is human nature and it is not
something anyone can prevent entirely.
What we can do is be clear about how those relationships affect the professional environment
— and what happens when the line gets crossed.
The problems are almost never intentional. A manager doesn't decide to play favorites. It
happens gradually. They schedule their friend the good shifts without realizing it. They correct
the employees they don't know well and let their friends slide. They take one side in a conflict
without recognizing their bias. By the time the team notices, the damage to culture, morale, and
trust is significant.

Treating All Staff as Equals — The Foundation
Every employee at a WHG location is entitled to the same standard of management — the
same corrections, the same opportunities, the same accountability. This is not just a fairness
principle. It is legal protection for the business and for the manager personally.
Inconsistent treatment based on personal relationships is how discrimination and hostile
workplace claims get filed. You may have had no harmful intent. But intent is not the legal
standard — impact is.

 The team always knows who the favorites are. They notice it in scheduling before you do.
 They notice it in who gets corrected and who gets a pass. They notice it before you've
 even registered that a pattern exists.

The standard is simple: ask yourself before every scheduling decision, every correction, and
every conflict conversation — would I handle this exactly the same way if it were someone I had
no personal relationship with? If the honest answer is no, stop and recalibrate.

Neutrality in Conflict — When You Must Step Back
When a conflict involves two employees, the manager's role is to be the neutral standard-holder.
Not a judge. Not an ally. The neutral party who re-centers both people on the expectation.
If you have a personal relationship with either employee involved — friendship, past romantic
history, family connection, or obvious close social ties — you cannot serve as the neutral party
in that conflict. The problem is not whether you can be fair. The problem is whether the team
and the employees involved will believe you are fair. Even a correct and entirely fair ruling gets
undermined if it comes from someone who appears compromised.
When this situation arises:
- Acknowledge to yourself that you have a conflict of interest — this takes honesty
- Remove yourself from the mediation role
- Bring in another manager, or escalate to the AM or RM to handle the conflict
- You can still document what you observed — you just cannot be the decision-maker
Script:

 WHG Manager's Reference Guide — Addendum

 "I need to bring in [Manager Name] to handle this one. I'm too close to this situation to be the
 right person to mediate it fairly. That's not about not trusting either of you — it's about making
 sure this gets handled in a way that's beyond question."

Friendships With Staff — The Practical Reality
Having a friendly, warm relationship with your team is a strength. That is different from having
close personal friendships that blur the professional line.
The areas where social friendships create operational problems:
- Scheduling — you start giving preferred shifts to people you like personally without
 realizing it
- Discipline — you hesitate to correct a friend or give them extra chances you wouldn't
 give others
- Information — you share management-level information in casual conversation that
 shouldn't leave the management layer
- Conflict mediation — as described above, you cannot be neutral when you have skin in
 the game
The rule of thumb: be warm and professional with everyone. Reserve close personal friendships
for people you don't supervise. If a friendship already exists and the person gets hired or
promoted into your team, that friendship needs to be managed very carefully — and the
manager must work harder, not less hard, to hold that person to standard.

Dating Policy — Management and Staff
A romantic relationship between a manager and any employee they supervise is a serious
operational and legal problem. It is not a moral judgment — it is a structural one.
When a manager is romantically involved with someone they supervise, the following are all
compromised:
- Scheduling fairness — the partner gets better shifts
- Disciplinary consistency — the partner gets more latitude
- Raise and promotion decisions — the partner gets preference
- Conflict mediation — the manager cannot be neutral in any situation involving their
 partner
- Team trust — the entire team assumes favoritism even when it isn't happening
Additionally, if the relationship ends — and many do — the business is now managing a
breakup between two people who have to work together, one of whom has authority over the
other. Harassment claims, hostile work environment claims, and retaliation claims all become
real possibilities.

 Policy: If a romantic relationship develops between a manager or shift leader and any
 member of their direct team, it must be disclosed to ownership immediately. A reporting
 structure change will occur — one of the two individuals will be moved to a team the other
 does not supervise. This is not a punishment. It is the only way to protect both people and
 the business.

 WHG Manager's Reference Guide — Addendum

Disclosure is always better than concealment. If management finds out through the team rather
than from the individuals involved, the trust and credibility damage is significantly worse than the
original situation.

Social Media and Off-Shift Contact
Being connected to staff on personal social media, in group chats outside of work
communication platforms, or in consistent off-shift socializing with select staff members blurs the
professional relationship in ways that are hard to walk back.
This is not a prohibition on having any life outside work. It is a reminder that what happens
outside the building affects what happens inside it. If you are closely connected with three
servers on social media and distant with the other five, those three will feel that difference at
work — and so will the other five.
The standard: be consistent. If you accept a follow request from one, be prepared to accept
them from everyone. If you don't want that, decline them all. Inconsistency is the problem, not
connection itself.

​$BIBLE_18$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 19, $T$Guest Recovery Protocol$T$, $BIBLE_19$A guest who had a problem and was handled well is more loyal than one who never had a
problem at all.

The Manager's Role in Guest Recovery
When a guest has a problem, the server's job is to identify it and notify management. The
manager's job is to own it. Not to investigate it from a distance, not to send the server back with
an apology, but to physically go to the table, acknowledge the guest, and make it right.
How quickly you get to that table is almost as important as what you say when you arrive. A
guest who waited ten minutes for a manager to acknowledge a problem has already gotten
worse. A manager who arrives at the table within two to three minutes of being notified of a
complaint arrives while the situation is still salvageable.

The Recovery Conversation — How to Do It
- Approach calmly and introduce yourself as the manager on duty
- Acknowledge the situation first before explaining or justifying anything
- Ask the guest to tell you what happened — let them talk without interrupting

 WHG Manager's Reference Guide — Addendum
- Respond with a genuine apology — not a corporate non-apology. 'I understand' is not an
 apology.
- Tell them what you are going to do to fix it — specifically, not vaguely
- Deliver on what you said
- Return to the table after the fix to confirm satisfaction
Script:
 "Hi, I'm [Name], the manager on duty tonight. I heard there was an issue with your meal and I
 wanted to come speak with you directly. Can you tell me what happened? I want to make sure
 we take care of you properly."
What you are not doing: defending the kitchen, explaining why it happened, blaming a server, or
using language that sounds like you are reading from a corporate script.

When to Comp — and How Much
Comping is a tool for guest recovery. It is not an automatic response to any complaint. The
decision of what to comp and how much should be proportional to the severity of the problem
and how long it took to resolve.
- Minor issue caught quickly — item replaced, no comp necessary unless guest is still
 unhappy
- Moderate issue — comp the affected item or round. Acknowledge the inconvenience.
- Significant issue — extended wait, quality failure, or service breakdown — comp the full
 check or a significant portion
- Serious issue involving safety, allergy, or genuine failure — full comp, manager
 follow-up, and log entry with detail. Notify ownership.
Over-comping every minor complaint trains guests to complain for free food. Under-comping
genuine failures drives one-star reviews and lost regulars. The judgment call is yours — but
document every comp and your reasoning in the Managers Log regardless of amount.

Online Reviews and Social Media
A guest unhappy enough to post a review is a guest who didn't get resolved in the building. The
first goal is always to recover in person before they leave. If they pull out their phone while still
at the table, that is a signal that they do not feel heard — get to that table immediately.
For reviews that appear online after the fact:
- Negative reviews are not ignored — ownership responds, not managers
- Managers who notice a new review should log it and flag it to ownership — do not
 respond directly
- If a guest threatens a negative review in-house, do not argue, do not minimize, and do
 not offer a comp as a transaction to prevent the review — offer a comp because you
 want to make it right
- Never argue with a guest on social media or in a review response — ever
Your job in a real-time social media situation is to get the guest to lower their phone and engage
with you directly. That starts with a genuine human response, not a defensive one.

 WHG Manager's Reference Guide — Addendum

When to Escalate to Ownership
- Any incident involving a guest injury
- Any situation where law enforcement was or may be involved
- Any situation involving an allegation of harassment, discrimination, or misconduct by
 staff
- Any guest who explicitly requests to speak with an owner
- Any situation involving a media threat or social media threat that is significant in scope
- Any comp above a threshold established by ownership for your location
When in doubt — call. Ownership would rather get a call that turns out to be unnecessary than
not get a call and find out about a serious situation the next morning.

​$BIBLE_19$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 20, $T$Onboarding & New Hire Oversight$T$, $BIBLE_20$How a new employee's first 30 days go is almost entirely determined by what management
does, not what training does.

The Manager's Role in Onboarding
Training manuals and position guides do the heavy lifting of teaching new employees what to
do. The manager's role is different. It is to ensure that the training actually happens, that the
new hire feels welcomed into the team, and that problems are caught in the first 30 days rather
than at 90.
A new employee who is undertrained and unsupported will cost you far more in the long run
than the time it takes to onboard them correctly. Recruitment is expensive. Replacing a bad hire
is expensive. Getting it right the first time is the most efficient path.

The First Week — Manager Responsibilities
- Assign a specific trainer — not 'whoever is available.' A named trainer who is
 accountable for that person's first week
- Introduce the new hire to every manager on duty during their first three shifts
- Check in at the end of each training shift — briefly, directly, and genuinely. 'How did
 today go? What questions do you have? What felt hard?'
- Confirm the trainer is actually training — not just using the new hire as extra labor while
 they do something else

 WHG Manager's Reference Guide — Addendum
- Verify handbook acknowledgment and any required documentation is completed before
 the first shift

30-Day Check-In
Every new hire receives a 30-day check-in conversation with their manager. This is not a
performance review. It is a two-way conversation — the manager's chance to give early
feedback, and the employee's chance to raise anything they haven't felt comfortable raising with
a trainer.
What to cover:
- What they are doing well — be specific
- One or two things to continue developing — keep it focused
- Whether they have any questions about the role, the team, or the expectations that
 haven't been answered
- Confirm they have read and understand the handbook
Log the 30-day check-in in the Managers Log. Note the date, what was discussed, and any
follow-up items. This becomes part of the employee's documented history from day one.

The Never Fire Anyone Principle
This concept comes from the Unsliced framework and it is worth understanding as a philosophy
before you apply it as a policy.
The idea is this: by the time termination happens, the employee should have made the decision
themselves — through their repeated choices. The manager's job throughout the corrective
process is not to build a case to fire someone. It is to give them every opportunity to choose
differently.
When you frame every write-up, every coaching conversation, and every final warning this way
— 'I am giving you the chance to make a different choice here' — two things happen. First, the
employee takes more ownership of their own outcome. Second, the manager stays objective
and avoids the emotional buildup that leads to hasty, poorly documented terminations.

 You are not firing anyone. You are documenting their choices and giving them every
 legitimate opportunity to make better ones. If they don't — they have promoted
 themselves out through their own actions.

This framing also protects the business. A termination that followed a clear, documented
progressive discipline process with multiple opportunities for correction is nearly impossible to
successfully challenge. A termination that happened because the manager finally lost patience
is vulnerable.

​$BIBLE_20$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 21, $T$Staff Retention & Cross-Training$T$, $BIBLE_21$Why Retention Is a Management Responsibility
Staff turnover is one of the most expensive problems in restaurant operations. Recruiting,
onboarding, and training a new employee takes weeks and real money. The impact on the team
during that gap — extra pressure on existing staff, inconsistency in service, morale erosion —
costs even more.
Ownership sets the culture and the compensation structure. But managers determine whether
good employees stay or leave on a day-to-day basis. The reason most restaurant employees
leave is not pay. It is a manager they do not respect or an environment that feels unfair or
chaotic.
A healthy monthly attrition target is under 10%. That means retaining at least 90% of your team
from one month to the next. When you start losing more than that, the first question to ask is not
what is wrong with the employees — it is what is happening at the management level.

What Managers Do That Keeps People
- Consistency — the team knows what to expect from you. Standards don't change based
 on your mood.
- Recognition — call out great work publicly and specifically. 'Good job tonight' is
 forgettable. 'The way you handled table 12 during the rush — that was excellent service'
 is not.
- Respect — corrections done privately, praise done publicly. No embarrassing people in
 front of the team or guests.
- Fairness — equal standards for everyone. No favorites. No double standards.
- Communication — people who know where they stand are more committed than people
 who are always guessing
- Development — showing employees a path forward. The rank and development system
 exists for this reason.

Cross-Training as a Management Responsibility
Cross-training is not something that happens automatically. It happens because managers build
it into their daily operations intentionally.
A team that is not cross-trained forces you to hire more people at fewer hours per person,
creates coverage crises every time one person is sick or calls out, and limits your flexibility in
scheduling. A cross-trained team is leaner, more versatile, and more resilient.
Manager responsibilities around cross-training:

 WHG Manager's Reference Guide — Addendum
- Identify which positions on your team have single-point-of-failure risk — only one person
 who can do that job
- Build cross-training into slow shifts deliberately — assign a server to shadow on the host
 stand, a host to observe bar setup
- Track cross-training progress and log it — who is trained on what, what they still need to
 learn
- Incentivize it — cross-trained employees should see that breadth leads to more hours,
 more desirable shifts, and advancement
When you build a team where three people can cover any given position, you have protection.
When you have a team where each position is one person deep, you are one call-out away from
a crisis every shift.

​$BIBLE_21$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 22, $T$Manager Communication Cadence$T$, $BIBLE_22$The shift-to-shift handoff is where information goes to die. This is how we prevent that.

The Daily Opening Sequence
Every opening manager follows the same sequence every morning. This is not flexible. The
sequence exists because the order matters — each step informs the next.
- Pull the Daily Sales Summary from R365 — review net sales, labor %, and any
 anomalies
- Pull the void report from the POS for the previous business day — review every line item
- Pull the comp report from the POS for the previous business day — review every line
 item
- Cross-reference both reports against the Managers Log entries from the previous shift —
 every void and comp should have a corresponding log entry. Flag any that don't.
- Review the full Managers Log entry from closing — read open items, note anything
 requiring follow-up today
- Walk the building before staff arrives — floor, kitchen, restrooms, bar. Note anything from
 close that wasn't addressed.
- Log your opening findings in the Managers Log — note what you reviewed, what you
 found, what you are following up on

Shift Handoffs — Manager to Manager

 WHG Manager's Reference Guide — Addendum

When one manager ends their shift and another begins, information cannot get lost in the
transition. The verbal handoff must happen in person when possible — not over text, not via a
note on the counter.
The closing manager covers:
- Any voids or comps that occurred and why
- Any staff situations that were addressed or are still unresolved
- Any guest situations that occurred
- Any 86'd items or product issues
- Any equipment issues or maintenance needs
- Open items from the Managers Log that the incoming manager needs to act on
If an in-person handoff is not possible because shifts don't overlap, the Managers Log entry
must be complete and detailed enough that the incoming manager has everything they need
without having to call or text.

Communication Tools at WHG
- Restaurant365 Managers Log — the official record, primary communication tool between
 shifts
- Telegram — team-wide and manager-level communication. Operational only. Not for
 personal use or off-topic conversation.
- POS Reports — daily source of truth for sales, voids, comps, and labor
- Whiteboard — in-kitchen prep and 86 communication, visible to all FOH and BOH during
 service
What does not count as official communication: verbal-only conversations, personal text
messages, social media DMs, or anything that doesn't create a written record. If it matters, it
goes in the log.

Manager Meetings
Managers meet regularly to review performance, address patterns, and align on standards. The
frequency is set by ownership but should occur at minimum twice a month. What gets covered:
- Sales and labor review — how are we trending and why
- Patterns from the Managers Log — what keeps showing up that needs a systemic
 solution
- Staff development — who is improving, who is struggling, who is ready for more
 responsibility
- Operational issues — anything that needs a consistent response across all managers
- Upcoming events, scheduling considerations, or menu changes
Managers who are absent from manager meetings without a legitimate reason are not fulfilling
the full scope of their role. The meeting is not optional — it is how we stay aligned.

​

 WHG Manager's Reference Guide — Addendum

Integration Notes for Final Document
The ten sections in this addendum (A through J) are organized in the recommended order of
integration. The insertion markers at the beginning of each section indicate where in the existing
Reference Guide the content belongs.
Two sections — the Void & Comp Deep Dive (A) and the Managers Log (B) — are designed to
work as a pair. They should be adjacent in the final document and cross-referenced where
appropriate.
The Financial Awareness section (E) contains management-level content only. The full 30/30/3
deep dive and P&L system will be covered in the Manager Training Manual. The Reference
Guide version is intentionally kept at the awareness level.
All sections follow the same writing standard as the existing guide: prose-based,
scenario-driven, written as ownership speaking directly to managers. No bullet-only content, no
lists without context, no policies without the reasoning behind them.

 When the addendum is fully integrated, the final Manager's Reference Guide will be a
 complete operational manual covering: manager mindset, professional standards,
 attendance, timekeeping, discipline, raises, conflict, drug/alcohol, uniform, financial
 awareness, theft recognition, camera usage, void/comp discipline, the managers log,
 guest recovery, manager-staff relationships, onboarding, retention, and communication
 cadence.$BIBLE_22$, 'manager', true);

INSERT INTO handbook_sections (language, handbook_version, sort_order, title, body, role_visibility, active)
VALUES ('en', 1, 23, $T$Visual Tools (Diagrams & Quick-Reference Cards)$T$, $BIBLE_23$The Manager's Reference Guide — Visual Tools is a separate PDF document containing eight visual diagrams and quick-reference cards designed to be printed and posted in the back-of-house or kept handy at the manager's desk.

The Visual Tools cover:

- The WHG Progressive Discipline Path
- Void vs. Comp Decision Guide
- Security Camera Quick Reference Card
- Conflict Neutrality Decision Tree
- Daily Manager's Log Checklist
- Theft Red Flag Indicator
- Escalation Matrix: When to Lead vs. Escalate
- The 30/30/3 Manager's Filter

These diagrams are most useful printed at full size and posted in the manager's office or on the back-of-house wall. The source PDF lives in the WHG Manager's Handbook source folder. If you need a fresh print, ask ownership.$BIBLE_23$, 'manager', true);
