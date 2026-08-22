"""
PLACEHOLDER transcripts standing in for Person A's Step 6 mock-interview
engine, which does not exist yet (repo has no interview-conducting code as
of 2026-08-22 -- Steps 6-10 hadn't started). The spec calls for testing the
feedback-scoring prompt on "2-3 transcripts from Person A's engine"; until
that engine exists there is nothing real to test against.

The first three are hand-written to be deliberately different in quality
(one strong, one weak/vague, one technical rather than behavioral) so a
working feedback-scoring prompt should differentiate them, not score
everything the same.

AMBIGUOUS_DELIVERY is a deliberate adversarial case, not another clean
tier: it carries the SAME concrete situation/action/result content as
STRONG_BEHAVIORAL, but delivered in a rambling, backtracking, disorganized
way. The point is to check whether the scorer actually decouples clarity
from STAR/depth, or lets bad delivery drag every score down together (a
real halo-effect failure mode for LLM judges) -- three cleanly-separated
quality tiers alone don't test that, since nothing forces the dimensions
to disagree.

SWAP THESE OUT for real output from Person A's engine once it exists --
this file's only job is to unblock testing the prompt logic itself.
"""

STRONG_BEHAVIORAL = """
Interviewer: Tell me about a time you disagreed with a technical decision made by a senior teammate.

Candidate: On my last team, we were migrating a service from REST to gRPC, and a senior
engineer wanted to do the full migration in one large PR over a weekend to "get it over
with." I was concerned this would make rollback nearly impossible if something broke in
production, since we'd have no way to isolate which part of the change caused an issue.

I proposed splitting it into three incremental PRs instead: first the gRPC server running
alongside the existing REST endpoints behind a feature flag, then migrating internal
callers one at a time, then removing the old REST code once traffic was fully cut over.
I wrote up the plan with rollback steps for each stage and walked him through it in a
15-minute call rather than pushing back in the group Slack channel.

He agreed to the staged approach. During the second stage we actually did catch a
serialization bug in one caller that would have been much harder to isolate in a single
big-bang deploy. The migration finished two days behind the original weekend estimate,
but we shipped with zero rollback incidents, and the staged-PR approach became the team's
default for future service migrations.
"""

WEAK_BEHAVIORAL = """
Interviewer: Tell me about a time you disagreed with a technical decision made by a senior teammate.

Candidate: Yeah, that's happened a few times honestly. There was this one situation where
someone wanted to do something a certain way and I thought there was maybe a better way to
do it. I mean, I've always been someone who speaks up when I think something could be
improved. I think communication is really important on a team, so I just made sure to
communicate my thoughts. It worked out fine in the end, things got resolved and we moved
forward with the project. I think that's just kind of how I approach disagreements in
general -- staying professional and collaborative.
"""

TECHNICAL_ANSWER = """
Interviewer: Walk me through how you'd design a rate limiter for a public API.

Candidate: I'd start by clarifying the requirements -- are we rate-limiting per API key,
per IP, or both, and is a hard cutoff acceptable or do we need graceful degradation.
Assuming per-API-key limiting with a hard cutoff, I'd use a token bucket algorithm rather
than fixed windows, because fixed windows allow burst traffic right at window boundaries
to double the effective limit.

For storage, I'd keep bucket state in Redis rather than in-memory on each API server, since
we're likely behind a load balancer with multiple instances and need a shared view of each
key's remaining tokens. I'd implement the check-and-decrement as a single Lua script in
Redis to avoid a race condition between checking the count and decrementing it under
concurrent requests.

For the refill, I'd use a lazy refill computed from elapsed time on each request rather
than a background job ticking every bucket, since that scales better -- we're not paying
for buckets nobody is currently using. One trade-off worth flagging: this adds a Redis
round-trip to every request's latency, so I'd want it colocated in the same region as the
API servers, and I'd cache a short-lived local approximation if p99 latency became an
issue, accepting slightly looser enforcement in exchange for speed.
"""


AMBIGUOUS_DELIVERY = """
Interviewer: Tell me about a time you disagreed with a technical decision made by a senior teammate.

Candidate: Oh man, okay, so -- yeah this actually reminds me, we had this whole thing with,
um, so we were doing this migration, REST to gRPC, and -- wait, I should back up. So there's
this senior engineer on the team, really smart guy, and he wanted to just, like, do the
whole migration in one go, over a weekend, just rip the band-aid off basically.

And I was kind of like, hmm, I don't know about that. Because, well, if something breaks
you kind of can't tell what part broke, right, since it's all one big change. So anyway I
was thinking about it and I came up with this other way of doing it where instead you sort
of do it in pieces -- like first you get the new thing running next to the old thing, and
there's a flag for it, and then, um, you move things over one at a time, and then at the
end you clean up the old stuff. I think I called it three PRs or something like that.

I didn't want to just argue in Slack in front of everyone so I grabbed him for a quick call,
maybe fifteen minutes, I had written some stuff down about how to undo each part if it went
wrong. He was fine with it actually, agreed pretty quick.

Oh -- and actually, funny enough, we did find a bug partway through, in one of the callers,
something with serialization, and honestly if we'd done the whole big weekend thing we
probably wouldn't have caught it as easily, so that was good. Took a couple days longer than
the weekend plan would've but nothing broke in prod, and I think people kept doing it that
way after, in pieces, for other migrations too.
"""


ALL_SAMPLES = {
    "strong_behavioral": STRONG_BEHAVIORAL,
    "weak_behavioral": WEAK_BEHAVIORAL,
    "technical_answer": TECHNICAL_ANSWER,
    "ambiguous_delivery": AMBIGUOUS_DELIVERY,
}
