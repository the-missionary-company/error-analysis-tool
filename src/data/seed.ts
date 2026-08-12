import type { Dataset } from '../types';

export const SEED_DATASETS: Dataset[] = [
  {
    id: 'central-hub-cited',
    name: 'Central Hub — cited answers',
    product: 'central-hub',
    description:
      'RAG/hybrid-search answers for construction PMs. Annotate whether the answer + citations would help a non-technical PM act.',
    traces: [
      {
        id: 'hub-001',
        product: 'central-hub',
        question: 'What is the status of the Level 3 waterproofing change order?',
        answer:
          'Change Order CO-184 for Level 3 waterproofing was approved on July 22 for $48,200. Work is scheduled to start August 4 after membrane delivery. The GC is awaiting shop drawings from Apex Waterproofing.',
        citations: [
          {
            title: 'CO-184 Approval Letter',
            excerpt:
              'Owner approves CO-184 (Level 3 membrane upgrade) in the amount of $48,200. NTP contingent on approved shop drawings.',
            source: 'Owner Correspondence / 2026-07-22',
          },
          {
            title: 'Weekly OAC — July 30',
            excerpt:
              'Apex to submit waterproofing shop drawings by Aug 1. Start on Level 3 planned for week of Aug 4.',
            source: 'Meeting Minutes',
          },
        ],
        chunks: [
          {
            id: 'c1',
            text: 'CO-184 Level 3 membrane upgrade — approved $48,200 on 7/22. NTP after shop drawings.',
            score: 0.91,
          },
          {
            id: 'c2',
            text: 'Apex Waterproofing lead time for membrane: 5 business days from PO.',
            score: 0.74,
          },
          {
            id: 'c3',
            text: 'Level 2 waterproofing punch list closed June 18.',
            score: 0.61,
          },
        ],
      },
      {
        id: 'hub-002',
        product: 'central-hub',
        question: 'Are there any open RFIs on the curtain wall system?',
        answer:
          'There are 2 open RFIs on the curtain wall: RFI-312 (mullion deflection criteria) submitted Aug 1, awaiting structural response; and RFI-298 (gasket color match) which was answered Aug 5 — use charcoal per owner finish schedule.',
        citations: [
          {
            title: 'RFI Log Export',
            excerpt: 'RFI-312 OPEN — Mullion deflection / Structural — submitted 2026-08-01',
            source: 'Procore RFI Log',
          },
          {
            title: 'RFI-298 Response',
            excerpt: 'Use charcoal gasket per Owner Finish Schedule FS-04. No cost impact.',
            source: 'Architect Response / 2026-08-05',
          },
        ],
        chunks: [
          {
            id: 'c1',
            text: 'RFI-312 OPEN mullion deflection criteria — assigned to Structural.',
            score: 0.88,
          },
          {
            id: 'c2',
            text: 'RFI-298 CLOSED — charcoal gasket confirmed.',
            score: 0.85,
          },
          {
            id: 'c3',
            text: 'RFI-277 (spandrel glass thickness) closed July 12.',
            score: 0.55,
          },
        ],
      },
      {
        id: 'hub-003',
        product: 'central-hub',
        question: 'Why did the drywall schedule slip on Floors 5–7?',
        answer:
          'Drywall on Floors 5–7 slipped 9 days because MEP rough-in inspections failed on Floor 6 (firestop deficiencies). Framing cannot close until reinspections clear. Updated drywall finish: Aug 28.',
        citations: [
          {
            title: 'Inspection Report IR-441',
            excerpt:
              'Floor 6 firestop at shaft walls FAILED. Contractor to remobilize firestop crew. Reinspection scheduled Aug 11.',
            source: 'City Inspection / 2026-08-06',
          },
        ],
        chunks: [
          {
            id: 'c1',
            text: 'IR-441 Floor 6 firestop FAILED — reinspection Aug 11.',
            score: 0.9,
          },
          {
            id: 'c2',
            text: 'Baseline drywall Floors 5–7 finish was Aug 19.',
            score: 0.72,
          },
          {
            id: 'c3',
            text: 'doc_id=sched_v18_fragnet_drywall_fl5_7 — slip attributed to weather.',
            score: 0.68,
          },
        ],
      },
      {
        id: 'hub-004',
        product: 'central-hub',
        question: 'When are the elevator submittals due back from the architect?',
        answer:
          'Elevator cab finish submittals (Sub-441) were returned approved-as-noted on August 7. No outstanding elevator submittals are currently with the architect.',
        citations: [
          {
            title: 'Submittal Log',
            excerpt: 'Sub-441 Elevator Cab Finishes — Approved as Noted — returned 2026-08-07',
            source: 'Submittal Register',
          },
          {
            title: 'Sub-389 Shop Drawings',
            excerpt:
              'Elevator machine room ventilation shop drawings — STILL UNDER REVIEW (submitted July 28).',
            source: 'Submittal Register',
          },
        ],
        chunks: [
          {
            id: 'c1',
            text: 'Sub-441 Approved as Noted 8/7.',
            score: 0.86,
          },
          {
            id: 'c2',
            text: 'Sub-389 Elevator MR ventilation — Under Review since 7/28 (11 days).',
            score: 0.84,
          },
          {
            id: 'c3',
            text: 'Architect review SLA for elevators: 10 business days.',
            score: 0.7,
          },
        ],
      },
      {
        id: 'hub-005',
        product: 'central-hub',
        question: 'What did the owner decide about the lobby stone upgrade?',
        answer:
          'Per the July 24 design meeting, the owner selected Calacatta Gold marble for the lobby feature wall at an additive cost of $62k. Selection is final; GC to issue CO request.',
        citations: [
          {
            title: 'Design Meeting Notes — July 24',
            excerpt:
              'Owner leaning toward Calacatta Gold; will confirm after seeing full-size sample next week.',
            source: 'Meeting Minutes',
          },
          {
            title: 'Pricing Memo — Stone Options',
            excerpt: 'Calacatta Gold add: ~$62,000. Carrara: ~$28,000. Porcelain lookalike: $0.',
            source: 'GC Pricing / 2026-07-20',
          },
        ],
        chunks: [
          {
            id: 'c1',
            text: 'Owner leaning toward Calacatta — confirm after sample review.',
            score: 0.89,
          },
          {
            id: 'c2',
            text: 'Sample review scheduled for week of Aug 4; no written approval yet.',
            score: 0.81,
          },
          {
            id: 'c3',
            text: 'Lobby porcelain was baseline bid alternate.',
            score: 0.5,
          },
        ],
      },
      {
        id: 'hub-006',
        product: 'central-hub',
        question: 'Who is responsible for temporary power on the west tower crane?',
        answer:
          'Per Division 01 and the Crane Coordination Plan, the Electrical Sub (VoltPro) provides temporary power to crane pads. GC coordinates outages with the crane vendor (SkyLift).',
        citations: [
          {
            title: 'Crane Coordination Plan Rev C',
            excerpt:
              'Temporary power to west tower crane: Electrical Sub. GC notifies SkyLift 48 hrs before any planned outage.',
            source: 'Site Logistics',
          },
          {
            title: 'Spec Section 01 50 00',
            excerpt: 'Temporary utilities: Contractor shall provide…',
            source: 'Project Specs',
          },
        ],
        chunks: [
          {
            id: 'c1',
            text: 'West crane temp power — Electrical Sub (VoltPro).',
            score: 0.92,
          },
          {
            id: 'c2',
            text: 'SkyLift requires 48-hr outage notice.',
            score: 0.8,
          },
        ],
      },
      {
        id: 'hub-007',
        product: 'central-hub',
        question: 'Has the fire alarm submittal been approved?',
        answer:
          'Yes. Fire alarm shop drawings (FA-SUB-012) were approved by the AHJ on August 3. Installation can proceed on Floors 1–4.',
        citations: [
          {
            title: 'AHJ Comment Letter',
            excerpt:
              'FA-SUB-012 — Revise and Resubmit. Provide battery calc worksheets for NAC panels 3 and 4. Resubmit within 10 days.',
            source: 'Fire Marshal / 2026-08-03',
          },
        ],
        chunks: [
          {
            id: 'c1',
            text: 'FA-SUB-012 Revise and Resubmit — battery calcs missing for NAC 3/4.',
            score: 0.93,
          },
          {
            id: 'c2',
            text: 'Prior revision FA-SUB-011 was rejected June 12.',
            score: 0.6,
          },
          {
            id: 'c3',
            text: 'Source: doc://procore/submittals/9823411',
            score: 0.55,
          },
        ],
      },
      {
        id: 'hub-008',
        product: 'central-hub',
        question: 'What is the current substantial completion date?',
        answer:
          'Contract substantial completion remains November 14, 2026. The latest fragnet shows a 6-day float erosion due to glazing delays, but the contractual date has not been formally extended.',
        citations: [
          {
            title: 'Prime Contract Exhibit B',
            excerpt: 'Substantial Completion Date: November 14, 2026.',
            source: 'Contract',
          },
          {
            title: 'Schedule Update SU-18',
            excerpt:
              'Projected SC: November 20, 2026 (6 calendar days late). Glazing path critical. No time extension requested.',
            source: 'Scheduler / 2026-08-05',
          },
        ],
        chunks: [
          {
            id: 'c1',
            text: 'Contract SC: Nov 14, 2026.',
            score: 0.9,
          },
          {
            id: 'c2',
            text: 'SU-18 projected SC Nov 20 — glazing critical.',
            score: 0.88,
          },
        ],
      },
      {
        id: 'hub-009',
        product: 'central-hub',
        question: 'Summarize open punch items for the parking garage.',
        answer:
          'Parking garage punch list has 14 open items: 8 paint touch-ups, 3 light fixture replacements, 2 drain grate adjustments, and 1 epoxy floor repair at Level P2 column line C. Target closeout: August 20.',
        citations: [
          {
            title: 'Punch List — Garage',
            excerpt: 'Open: 14 | Closed this week: 6 | Owner walk scheduled Aug 22.',
            source: 'Punch App Export',
          },
        ],
        chunks: [
          {
            id: 'c1',
            text: 'Garage punch: 14 open as of Aug 8.',
            score: 0.87,
          },
          {
            id: 'c2',
            text: 'Epoxy repair P2 CL-C — material on order ETA Aug 14.',
            score: 0.75,
          },
          {
            id: 'c3',
            text: 'Lobby punch (unrelated): 3 open.',
            score: 0.4,
          },
        ],
      },
      {
        id: 'hub-010',
        product: 'central-hub',
        question: 'Did we get the soils report for the east retaining wall redesign?',
        answer:
          'Yes. Geotech issued Supplemental Report SR-07 on July 31 recommending #4 ties at 16" o.c. for the redesigned east wall. Structural has incorporated this into ASI-19.',
        citations: [
          {
            title: 'Geotech SR-07',
            excerpt:
              'East wall redesign: provide #4 ties @ 16" o.c. horizontal. Design soil pressure remains 45 psf/ft.',
            source: 'Geotech / 2026-07-31',
          },
          {
            title: 'ASI-19',
            excerpt: 'Incorporates SR-07 tie spacing. Issued for construction Aug 6.',
            source: 'Structural ASI',
          },
        ],
        chunks: [
          {
            id: 'c1',
            text: 'SR-07 #4 ties @ 16" o.c. for east retaining wall.',
            score: 0.94,
          },
          {
            id: 'c2',
            text: 'ASI-19 issued 8/6 incorporating SR-07.',
            score: 0.9,
          },
        ],
      },
    ],
  },
  {
    id: 'a1-commitments',
    name: 'A1 — commitment reconciliation',
    product: 'a1',
    description:
      'Meeting-series commitment states inferred by A1. Annotate whether closed / dropped / quiet / overdue labels match what a PM would conclude.',
    traces: [
      {
        id: 'a1-001',
        product: 'a1',
        projectName: 'Harborview Tower',
        meetings: [
          {
            date: '2026-07-15',
            title: 'OAC Weekly',
            excerpt:
              'GC committed to complete Level 8 waterproofing inspection by July 22. Apex to mobilize membrane crew Monday.',
          },
          {
            date: '2026-07-22',
            title: 'OAC Weekly',
            excerpt:
              'Waterproofing inspection postponed — membrane delayed in transit. New target July 29.',
          },
          {
            date: '2026-07-29',
            title: 'OAC Weekly',
            excerpt:
              'Inspection completed July 28; minor punch only. GC to close out waterproofing checklist this week.',
          },
          {
            date: '2026-08-05',
            title: 'OAC Weekly',
            excerpt: 'No mention of Level 8 waterproofing. Agenda moved to glazing and elevators.',
          },
        ],
        commitments: [
          {
            id: 'cm-1',
            text: 'Complete Level 8 waterproofing inspection',
            inferredState: 'closed',
            evidence: 'Inspection completed July 28; minor punch only.',
          },
          {
            id: 'cm-2',
            text: 'Close out waterproofing checklist',
            inferredState: 'quiet',
            evidence: 'Promised "this week" on 7/29; no follow-up on 8/5.',
          },
        ],
      },
      {
        id: 'a1-002',
        product: 'a1',
        projectName: 'Harborview Tower',
        meetings: [
          {
            date: '2026-07-08',
            title: 'Crane Coordination',
            excerpt:
              'SkyLift to provide revised pick schedule for steel on Floors 12–14 by Friday July 11.',
          },
          {
            date: '2026-07-15',
            title: 'OAC Weekly',
            excerpt: 'Revised pick schedule still outstanding. GC to chase SkyLift.',
          },
          {
            date: '2026-07-22',
            title: 'OAC Weekly',
            excerpt: 'Topic dropped from agenda. Steel erection proceeding on prior schedule.',
          },
          {
            date: '2026-08-05',
            title: 'OAC Weekly',
            excerpt: 'Steel Floors 12–14 complete. No reference to revised pick schedule.',
          },
        ],
        commitments: [
          {
            id: 'cm-1',
            text: 'SkyLift provide revised pick schedule Floors 12–14',
            inferredState: 'closed',
            evidence: 'Steel erection complete; inferred schedule was delivered.',
          },
        ],
      },
      {
        id: 'a1-003',
        product: 'a1',
        projectName: 'Riverside Medical Annex',
        meetings: [
          {
            date: '2026-07-10',
            title: 'MEP Coordination',
            excerpt:
              'Electrical to submit revised panel schedules for OR suites by July 17 after architect comments.',
          },
          {
            date: '2026-07-17',
            title: 'MEP Coordination',
            excerpt: 'Panel schedules not submitted. Electrical cites waiting on final equipment cut sheets from owner vendor.',
          },
          {
            date: '2026-07-24',
            title: 'MEP Coordination',
            excerpt: 'Still waiting on vendor cut sheets. New promise: submit by July 31.',
          },
          {
            date: '2026-08-07',
            title: 'MEP Coordination',
            excerpt: 'Panel schedules remain unsubmitted. Cut sheets received Aug 4; Electrical needs 3 more days.',
          },
        ],
        commitments: [
          {
            id: 'cm-1',
            text: 'Submit revised OR suite panel schedules',
            inferredState: 'overdue',
            evidence: 'Original July 17 due; still open Aug 7 after multiple slips.',
          },
        ],
      },
      {
        id: 'a1-004',
        product: 'a1',
        projectName: 'Riverside Medical Annex',
        meetings: [
          {
            date: '2026-06-26',
            title: 'Owner Meeting',
            excerpt:
              'Owner asked GC to price an alternate for operable windows in admin wing. GC to return pricing in two weeks.',
          },
          {
            date: '2026-07-10',
            title: 'Owner Meeting',
            excerpt: 'Pricing not ready; waiting on window vendor. Owner okay to wait.',
          },
          {
            date: '2026-07-24',
            title: 'Owner Meeting',
            excerpt:
              'Owner decided to drop operable window alternate — budget constraints. Stick with fixed glazing.',
          },
          {
            date: '2026-08-07',
            title: 'Owner Meeting',
            excerpt: 'No further discussion of operable windows.',
          },
        ],
        commitments: [
          {
            id: 'cm-1',
            text: 'Price operable window alternate for admin wing',
            inferredState: 'quiet',
            evidence: 'No pricing delivered; topic faded after July 10.',
          },
        ],
      },
      {
        id: 'a1-005',
        product: 'a1',
        projectName: 'City Center Parking Deck',
        meetings: [
          {
            date: '2026-07-01',
            title: 'Progress Meeting',
            excerpt:
              'Concrete finisher to complete Level P3 pour and cure protection by July 8 before waterproofing.',
          },
          {
            date: '2026-07-08',
            title: 'Progress Meeting',
            excerpt: 'P3 pour complete July 7. Cure protection in place. Waterproofing can start July 15.',
          },
          {
            date: '2026-07-15',
            title: 'Progress Meeting',
            excerpt: 'Waterproofing started on P3. Concrete commitment closed out.',
          },
        ],
        commitments: [
          {
            id: 'cm-1',
            text: 'Complete Level P3 pour and cure protection',
            inferredState: 'closed',
            evidence: 'Pour complete July 7; confirmed in 7/8 and 7/15 meetings.',
          },
        ],
      },
      {
        id: 'a1-006',
        product: 'a1',
        projectName: 'Harborview Tower',
        meetings: [
          {
            date: '2026-07-01',
            title: 'Safety Stand-down Follow-up',
            excerpt:
              'GC safety lead to issue updated swing-stage rescue plan by July 5 and train crews July 7.',
          },
          {
            date: '2026-07-08',
            title: 'OAC Weekly',
            excerpt: 'Rescue plan issued July 5. Training completed for day shift; night shift pending.',
          },
          {
            date: '2026-07-15',
            title: 'OAC Weekly',
            excerpt: 'Night shift training completed July 12. All crews signed off.',
          },
          {
            date: '2026-07-29',
            title: 'OAC Weekly',
            excerpt: 'Auditor notes rescue plan revision still missing appendix for high-wind protocol.',
          },
        ],
        commitments: [
          {
            id: 'cm-1',
            text: 'Issue updated swing-stage rescue plan and train crews',
            inferredState: 'closed',
            evidence: 'Plan issued and both shifts trained by July 15.',
          },
          {
            id: 'cm-2',
            text: 'Add high-wind protocol appendix to rescue plan',
            inferredState: 'overdue',
            evidence: 'Raised July 29 as still missing; no due date assigned.',
          },
        ],
      },
      {
        id: 'a1-007',
        product: 'a1',
        projectName: 'Lakeside School Expansion',
        meetings: [
          {
            date: '2026-06-18',
            title: 'Design Coordination',
            excerpt:
              'Architect to clarify gymnasium floor tolerance spec by June 25 so sports flooring vendor can proceed.',
          },
          {
            date: '2026-06-25',
            title: 'Design Coordination',
            excerpt: 'Clarification not issued. Architect traveling; delegate to junior PM.',
          },
          {
            date: '2026-07-02',
            title: 'Design Coordination',
            excerpt: 'Still open. Flooring vendor on hold. GC flagged schedule risk.',
          },
          {
            date: '2026-07-16',
            title: 'Design Coordination',
            excerpt:
              'Item not on agenda. Conversation moved to bleacher submittals. Flooring vendor still waiting.',
          },
          {
            date: '2026-08-06',
            title: 'Design Coordination',
            excerpt: 'No mention of gym floor tolerance. Bleachers approved.',
          },
        ],
        commitments: [
          {
            id: 'cm-1',
            text: 'Clarify gymnasium floor tolerance spec',
            inferredState: 'dropped',
            evidence: 'Repeated slips then disappeared from agendas after July 2 while vendor still waiting.',
          },
        ],
      },
      {
        id: 'a1-008',
        product: 'a1',
        projectName: 'Lakeside School Expansion',
        meetings: [
          {
            date: '2026-07-09',
            title: 'Site Logistics',
            excerpt:
              'GC to relocate construction entrance to south gate by July 16 to accommodate school summer camp drop-off.',
          },
          {
            date: '2026-07-16',
            title: 'Site Logistics',
            excerpt: 'South gate entrance active as of July 15. Signage and flaggers in place.',
          },
          {
            date: '2026-07-30',
            title: 'Site Logistics',
            excerpt: 'Camp staff reported no issues with new entrance. Keep through August.',
          },
        ],
        commitments: [
          {
            id: 'cm-1',
            text: 'Relocate construction entrance to south gate',
            inferredState: 'closed',
            evidence: 'Active July 15; confirmed working July 30.',
          },
        ],
      },
      {
        id: 'a1-009',
        product: 'a1',
        projectName: 'City Center Parking Deck',
        meetings: [
          {
            date: '2026-07-15',
            title: 'Progress Meeting',
            excerpt:
              'Waterproofing sub to provide adhesion test results for P2 membrane by July 18 before covering.',
          },
          {
            date: '2026-07-22',
            title: 'Progress Meeting',
            excerpt:
              'Adhesion tests completed July 17 — all passed. Photos uploaded to Procore. Covering approved.',
          },
        ],
        commitments: [
          {
            id: 'cm-1',
            text: 'Provide P2 membrane adhesion test results',
            inferredState: 'closed',
            evidence: 'Tests passed July 17; covering approved.',
          },
        ],
      },
      {
        id: 'a1-010',
        product: 'a1',
        projectName: 'Riverside Medical Annex',
        meetings: [
          {
            date: '2026-07-03',
            title: 'Infection Control',
            excerpt:
              'GC to install temporary ICRA barriers at Corridor B by July 8 before demolition of old nurse station.',
          },
          {
            date: '2026-07-10',
            title: 'Infection Control',
            excerpt: 'Barriers installed July 7. Hospital ICRA walk approved July 8. Demo started.',
          },
          {
            date: '2026-07-24',
            title: 'Infection Control',
            excerpt:
              'Hospital flagged gap at Corridor B barrier after cart traffic. GC to repair same day — done.',
          },
          {
            date: '2026-08-07',
            title: 'Infection Control',
            excerpt:
              'New ask: extend ICRA to Corridor C before next demo phase (target Aug 14). Not yet confirmed owned.',
          },
        ],
        commitments: [
          {
            id: 'cm-1',
            text: 'Install temporary ICRA barriers at Corridor B',
            inferredState: 'closed',
            evidence: 'Installed July 7; hospital approved July 8.',
          },
          {
            id: 'cm-2',
            text: 'Extend ICRA barriers to Corridor C by Aug 14',
            inferredState: 'overdue',
            evidence: 'Raised Aug 7 with Aug 14 target; treated as open commitment.',
          },
        ],
      },
    ],
  },
];
