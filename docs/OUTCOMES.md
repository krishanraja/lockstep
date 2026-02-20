# Outcomes

## Overview

This document defines success criteria, key metrics, and measurement approaches for Lockstep. It serves as a north star for product decisions and a scorecard for evaluating progress.

---

## Success Definition

### Mission Accomplished When

1. **Organizers save time**: Average 5+ hours saved per complex event
2. **Response rates increase**: 90%+ guest response rate (vs. 60-70% baseline)
3. **Stress reduction**: Organizers report feeling "in control"
4. **Viral growth**: Events generate new organizers (viral coefficient > 0.3)

---

## Key Performance Indicators (KPIs)

### Primary Metrics

| Metric | Current | Target (6mo) | Target (12mo) |
|--------|---------|--------------|---------------|
| Monthly Active Events | 0 | 100 | 1,000 |
| Guest Response Rate | - | 85% | 92% |
| Event Completion Rate | - | 70% | 80% |
| Organizer NPS | - | 40 | 60 |

### Secondary Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Time to First Response | Median time from invite to first RSVP | < 24 hours |
| Blocks per Event | Average number of time blocks | 3-5 |
| Guests per Event | Average guest list size | 30-50 |
| Nudge Effectiveness | % of nudged guests who respond | > 40% |
| Organizer Retention | Return for second event | > 50% |

### Technical Metrics

| Metric | Target |
|--------|--------|
| Page Load Time (LCP) | < 2.5s |
| API Response Time (p95) | < 500ms |
| Uptime | 99.9% |
| Error Rate | < 0.1% |

---

## User Outcomes

### For Organizers

| Outcome | Metric | Measurement |
|---------|--------|-------------|
| **Know who's coming** | Response rate per block | Database query |
| **Stop chasing people** | Manual nudges sent | Nudge logs |
| **Feel organized** | Self-reported stress (1-5) | Survey |
| **Look professional** | Guest compliments | Feedback |

### For Guests

| Outcome | Metric | Measurement |
|---------|--------|-------------|
| **Easy to respond** | Time to complete RSVP | Analytics |
| **No friction** | Drop-off rate | Funnel analysis |
| **Stay informed** | Opens update notifications | Email/SMS stats |
| **Feels personal** | Magic link auth success | Auth logs |

---

## Business Outcomes

### Revenue Model

| Tier | Price | Target Adoption |
|------|-------|-----------------|
| Free | $0 | 60% of events |
| Pro | $29/event | 35% of events |
| Enterprise | Custom | 5% of events |

### Revenue Targets

| Period | ARR Target |
|--------|------------|
| Month 6 | $5,000 |
| Month 12 | $50,000 |
| Month 24 | $500,000 |

### Unit Economics

| Metric | Target |
|--------|--------|
| Customer Acquisition Cost (CAC) | < $20 |
| Lifetime Value (LTV) | > $60 |
| LTV:CAC Ratio | > 3:1 |
| Payback Period | < 3 months |

---

## Feature Success Criteria

### Event Creation Wizard

| Criteria | Metric | Target |
|----------|--------|--------|
| Completion rate | % who finish all 5 steps | > 70% |
| Time to complete | Minutes from start to publish | < 10 min |
| Blocks created | Average per event | 3-5 |
| Guests added | Average per event | 20+ |

### Guest RSVP Flow

| Criteria | Metric | Target |
|----------|--------|--------|
| Magic link success | % links that work | > 99% |
| Response completion | % who submit response | > 90% |
| Time to respond | Median seconds | < 60 |
| Update rate | % who change response | < 20% |

### Nudge System

| Criteria | Metric | Target |
|----------|--------|--------|
| Delivery rate | % messages delivered | > 95% |
| Response conversion | % nudged who respond | > 40% |
| Opt-out rate | % who unsubscribe | < 5% |
| Complaint rate | % who report spam | < 0.1% |

### AI Summaries

| Criteria | Metric | Target |
|----------|--------|--------|
| Generation time | Seconds to produce | < 5 |
| Usefulness rating | Organizer feedback (1-5) | > 4 |
| Accuracy | % factually correct | > 95% |
| Action items | Avg items surfaced | 2-3 |

---

## Measurement Plan

### Analytics Stack (Recommended)

1. **Product Analytics**: Amplitude, Mixpanel, or PostHog
2. **Error Tracking**: Sentry
3. **Performance**: Web Vitals, Supabase monitoring
4. **Surveys**: Typeform or in-app NPS

### Key Events to Track

| Event | When | Properties |
|-------|------|------------|
| `event_created` | Wizard completed | blocks_count, guests_count |
| `rsvp_started` | Guest opens link | event_id, guest_id |
| `rsvp_completed` | Guest submits | response_count, duration |
| `nudge_sent` | Reminder dispatched | channel, guest_id |
| `nudge_converted` | Guest responds after nudge | time_to_response |
| `summary_generated` | AI summary created | event_id, duration |

### Cohort Definitions

| Cohort | Definition |
|--------|------------|
| New Organizers | Created first event in period |
| Active Organizers | Published event in last 30 days |
| Returning Organizers | Created 2+ events |
| Engaged Guests | Responded to 2+ blocks |

---

## Experiments Roadmap

### Planned A/B Tests

| Test | Hypothesis | Metric |
|------|------------|--------|
| Nudge timing | Earlier = better response | Response rate |
| Email vs SMS first | SMS has higher open | Response rate |
| Block presentation | Cards vs timeline | Completion rate |
| AI summary prominence | Above fold = more reads | Engagement |

### Qualitative Research

| Method | Frequency | Goal |
|--------|-----------|------|
| User interviews | Monthly | Deep understanding |
| Usability testing | Per major feature | Friction identification |
| NPS survey | Quarterly | Satisfaction tracking |
| Support ticket review | Weekly | Issue identification |

---

## Reporting Cadence

| Report | Frequency | Audience |
|--------|-----------|----------|
| Daily metrics | Daily | Engineering |
| Weekly summary | Weekly | Full team |
| Monthly review | Monthly | Stakeholders |
| Quarterly OKRs | Quarterly | Leadership |

---

## Goal-Setting Framework

### Current Quarter Objectives

**Objective 1**: Launch functional MVP
- KR1: 10 real events created by external users
- KR2: 85% average response rate across events
- KR3: < 5 critical bugs in production

**Objective 2**: Validate product-market fit
- KR1: NPS > 30 from first 20 organizers
- KR2: 3+ unsolicited referrals
- KR3: 50% return rate for second event

**Objective 3**: Establish technical foundation
- KR1: LCP < 2.5s on mobile
- KR2: 99.9% uptime
- KR3: Full documentation complete

---

## Risk Metrics

### Red Flags to Monitor

| Metric | Threshold | Response |
|--------|-----------|----------|
| Response rate | < 60% | Review UX, check deliverability |
| Wizard drop-off | > 50% | Simplify flow |
| Error rate | > 1% | Incident response |
| Nudge complaints | > 0.5% | Review messaging |
| Guest drop-off | > 30% | Magic link debug |
