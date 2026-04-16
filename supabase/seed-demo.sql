-- Demo account seed data
-- Run this in the Supabase Dashboard SQL Editor
-- ======================
-- Re-seeding: run these deletes first, then re-run this file:
--   DELETE FROM applications WHERE user_id = 'd6b2c257-4664-422c-993f-6e9a2a5eb64e';
--   DELETE FROM raw_emails WHERE user_id = 'd6b2c257-4664-422c-993f-6e9a2a5eb64e';
--   DELETE FROM candidate_profiles WHERE user_id = 'd6b2c257-4664-422c-993f-6e9a2a5eb64e';

-- Candidate profile
INSERT INTO candidate_profiles (user_id, cv_markdown, profile_data, cv_filename, cv_mime_type, cv_uploaded_at, created_at, updated_at) VALUES (
  'd6b2c257-4664-422c-993f-6e9a2a5eb64e',
  '# Alex Chen
## Backend Engineer | Singapore

### Experience
**Backend Engineer** — StartupCo (2023–Present)
- Led migration of monolith to microservices, improving throughput 3x
- Designed event-driven architecture handling 50k events/min
- Mentored 3 junior engineers on Go best practices

**Software Engineer** — TechCorp (2021–2023)
- Built real-time data pipeline processing 2M events/day
- Reduced API latency by 40% through caching and query optimization
- Implemented CI/CD pipeline reducing deployment time by 60%

### Education
**B.Sc. Computer Science** — National University of Singapore (2021)

### Skills
Go, Python, PostgreSQL, Redis, Kafka, AWS, Docker, Kubernetes',
  jsonb_build_object(
    'candidate', jsonb_build_object(
      'full_name', 'Alex Chen',
      'email', 'alex.chen.demo@gmail.com',
      'phone', '+65 9123 4567',
      'location', 'Singapore',
      'linkedin', 'https://linkedin.com/in/alexchen',
      'portfolio_url', '',
      'github', 'https://github.com/alexchen',
      'twitter', ''
    ),
    'target_roles', jsonb_build_object(
      'primary', jsonb_build_array('Backend Engineer', 'Software Engineer', 'Platform Engineer'),
      'archetypes', jsonb_build_array(
        jsonb_build_object('name', 'Senior Backend Engineer', 'level', 'Senior', 'fit', 'primary'),
        jsonb_build_object('name', 'Platform Engineer', 'level', 'Mid-Senior', 'fit', 'secondary'),
        jsonb_build_object('name', 'Site Reliability Engineer', 'level', 'Mid', 'fit', 'adjacent')
      )
    ),
    'narrative', jsonb_build_object(
      'headline', 'Backend engineer who builds systems that scale',
      'exit_story', 'Looking for a role with more architectural ownership and impact on product-facing systems.',
      'superpowers', jsonb_build_array('Distributed systems design', 'Performance optimization', 'Go and Python expertise', 'Event-driven architectures'),
      'proof_points', jsonb_build_array(
        jsonb_build_object('name', 'Led platform migration', 'url', '', 'hero_metric', '3x throughput improvement'),
        jsonb_build_object('name', 'Real-time data pipeline', 'url', '', 'hero_metric', '2M events/day processed'),
        jsonb_build_object('name', 'API latency reduction', 'url', '', 'hero_metric', '40% latency decrease')
      )
    ),
    'compensation', jsonb_build_object(
      'target_range', '8,000–10,000 SGD/month',
      'currency', 'SGD',
      'minimum', '7,500',
      'location_flexibility', 'Open to hybrid or on-site in Singapore'
    ),
    'location', jsonb_build_object(
      'country', 'Singapore',
      'city', 'Singapore',
      'timezone', 'Asia/Singapore (UTC+8)',
      'visa_status', 'Singapore Citizen'
    )
  ),
  'alex_chen_cv.pdf',
  'application/pdf',
  now(),
  now(),
  now()
);

-- Raw emails (source data)
INSERT INTO raw_emails (id, user_id, gmail_message_id, gmail_thread_id, subject, from_email, from_name, received_at, snippet, body_text) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'msg001', 'thread001', 'Application Received - Backend Engineer at Stripe', 'no-reply@stripe.com', 'Stripe Recruiting', (CURRENT_DATE - INTERVAL '19 days')::timestamptz, 'Thank you for your application...', 'Dear Candidate, Thank you for applying to the Backend Engineer position at Stripe. We have received your application and our team will review it shortly.'),
  ('a0000001-0000-0000-0000-000000000002', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'msg002', 'thread001', 'Interview Invitation - Stripe Backend Engineer', 'recruiting@stripe.com', 'Sarah Chen, Stripe', (CURRENT_DATE - INTERVAL '14 days')::timestamptz, 'We would like to invite you...', 'Hi, We would like to invite you for a technical interview for the Backend Engineer role. The interview will be a 45-minute coding session.'),
  ('a0000001-0000-0000-0000-000000000003', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'msg003', 'thread002', 'Your application to Google - Software Engineer', 'no-reply@google.com', 'Google Careers', (CURRENT_DATE - INTERVAL '32 days')::timestamptz, 'Thank you for applying to Google...', 'Thank you for your interest in the Software Engineer position at Google. We are currently reviewing applications.'),
  ('a0000001-0000-0000-0000-000000000004', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'msg004', 'thread003', 'Application Update - Frontend Developer at Shopify', 'notifications@shopify.com', 'Shopify Talent', (CURRENT_DATE - INTERVAL '15 days')::timestamptz, 'We are moving forward with other candidates...', 'Thank you for your interest in the Frontend Developer role at Shopify. After careful review, we have decided to move forward with other candidates whose experience better aligns with our current needs.'),
  ('a0000001-0000-0000-0000-000000000005', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'msg005', 'thread004', 'Grab - Online Assessment Link', 'assessment@grab.com', 'Grab University Recruiting', (CURRENT_DATE - INTERVAL '11 days')::timestamptz, 'Please complete the online assessment...', 'Congratulations on progressing to the next stage! Please complete the online coding assessment within 48 hours. The assessment covers data structures and algorithms.'),
  ('a0000001-0000-0000-0000-000000000006', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'msg006', 'thread005', 'Offer Letter - Shopee Backend Intern', 'hr@shopee.com', 'Shopee HR Team', (CURRENT_DATE - INTERVAL '6 days')::timestamptz, 'We are pleased to offer you...', 'We are pleased to extend an offer for the Backend Intern position at Shopee. Please review the attached offer letter and respond by April 18, 2026.'),
  ('a0000001-0000-0000-0000-000000000007', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'msg007', 'thread006', 'Application Received - Data Engineer at ByteDance', 'auto-reply@bytedance.com', 'ByteDance Recruitment', (CURRENT_DATE - INTERVAL '27 days')::timestamptz, 'Your application has been received...', 'Thank you for applying to the Data Engineer position at ByteDance. We will review your application and get back to you within 2 weeks.'),
  ('a0000001-0000-0000-0000-000000000008', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'msg008', 'thread007', 'Thank you for applying - TikTok Frontend Intern', 'careers@tiktok.com', 'TikTok Careers', (CURRENT_DATE - INTERVAL '13 days')::timestamptz, 'We regret to inform you...', 'We regret to inform you that we will not be moving forward with your application for the Frontend Intern position at TikTok at this time.'),
  ('a0000001-0000-0000-0000-000000000009', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'msg009', 'thread008', 'Interview Scheduled - Databricks Software Engineer', 'recruiting@databricks.com', 'Databricks Recruiting', (CURRENT_DATE - INTERVAL '8 days')::timestamptz, 'Your interview is scheduled...', 'Your technical interview for the Software Engineer position at Databricks is scheduled for April 15, 2026 at 2:00 PM SGT. The interview will be conducted via Zoom.'),
  ('a0000001-0000-0000-0000-000000000010', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'msg010', 'thread009', 'Application for Full Stack Engineer at Figma', 'jobs@figma.com', 'Figma Hiring', (CURRENT_DATE - INTERVAL '22 days')::timestamptz, 'We received your application...', 'Thank you for your interest in the Full Stack Engineer role at Figma. We have received your application and will be in touch soon.'),
  ('a0000001-0000-0000-0000-000000000011', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'msg011', 'thread010', 'Assessment Invitation - Infineon Software Engineer', 'campus@infineon.com', 'Infineon Campus Recruiting', (CURRENT_DATE - INTERVAL '10 days')::timestamptz, 'You have been shortlisted for an assessment...', 'You have been shortlisted for the Software Engineer position at Infineon. Please complete the technical assessment by April 13, 2026.'),
  ('a0000001-0000-0000-0000-000000000012', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'msg012', 'thread011', 'Your application to Amazon - SDE Intern', 'no-reply@amazon.jobs', 'Amazon University Programs', (CURRENT_DATE - INTERVAL '29 days')::timestamptz, 'Application submitted successfully...', 'Your application for the Software Development Engineer Intern position at Amazon has been submitted successfully. Our team will review your application.'),
  ('a0000001-0000-0000-0000-000000000013', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'msg013', 'thread012', 'Rejected - Microsoft Software Engineer', 'careers@microsoft.com', 'Microsoft Careers', (CURRENT_DATE - INTERVAL '9 days')::timestamptz, 'We have decided to proceed with other candidates...', 'Thank you for interviewing with us for the Software Engineer position at Microsoft. After careful consideration, we have decided to proceed with other candidates.'),
  ('a0000001-0000-0000-0000-000000000014', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'msg014', 'thread013', 'Application Update - NVIDIA Systems Engineer', 'recruiting@nvidia.com', 'NVIDIA Recruiting', (CURRENT_DATE - INTERVAL '7 days')::timestamptz, 'Your application is under review...', 'Your application for the Systems Engineer position at NVIDIA is currently under review. We will update you on the next steps within 1-2 weeks.'),
  ('a0000001-0000-0000-0000-000000000015', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'msg015', 'thread014', 'Next Steps - Meta Frontend Engineer', 'recruiting@meta.com', 'Meta Recruiting', (CURRENT_DATE - INTERVAL '5 days')::timestamptz, 'We would like to schedule a call...', 'We have reviewed your application for the Frontend Engineer position at Meta and would like to schedule an initial phone screen. Please let us know your availability.');

-- Applications (structured data)
INSERT INTO applications (id, user_id, company, role, status, status_confidence, source_email_id, gmail_thread_id, interview_date, interview_time, location, notes, created_at, updated_at) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'Stripe', 'Backend Engineer', 'interview', 0.95, 'a0000001-0000-0000-0000-000000000002', 'thread001', (CURRENT_DATE + INTERVAL '2 days')::date, '14:00', 'Remote (Zoom)', 'Technical interview - 45 min coding session', (CURRENT_DATE - INTERVAL '19 days')::timestamptz, (CURRENT_DATE - INTERVAL '14 days')::timestamptz),
  ('b0000001-0000-0000-0000-000000000002', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'Google', 'Software Engineer', 'applied', 0.90, 'a0000001-0000-0000-0000-000000000003', 'thread002', NULL, NULL, NULL, 'Application under review', (CURRENT_DATE - INTERVAL '32 days')::timestamptz, (CURRENT_DATE - INTERVAL '32 days')::timestamptz),
  ('b0000001-0000-0000-0000-000000000003', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'Shopify', 'Frontend Developer', 'rejected', 0.92, 'a0000001-0000-0000-0000-000000000004', 'thread003', NULL, NULL, NULL, 'Moved forward with other candidates', (CURRENT_DATE - INTERVAL '15 days')::timestamptz, (CURRENT_DATE - INTERVAL '15 days')::timestamptz),
  ('b0000001-0000-0000-0000-000000000004', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'Grab', 'Software Engineer', 'assessment', 0.88, 'a0000001-0000-0000-0000-000000000005', 'thread004', NULL, NULL, 'Online', 'Coding assessment - DSA, 48h deadline', (CURRENT_DATE - INTERVAL '11 days')::timestamptz, (CURRENT_DATE - INTERVAL '11 days')::timestamptz),
  ('b0000001-0000-0000-0000-000000000005', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'Shopee', 'Backend Intern', 'offer', 0.97, 'a0000001-0000-0000-0000-000000000006', 'thread005', NULL, NULL, 'Singapore', 'Offer received - respond by April 18', (CURRENT_DATE - INTERVAL '6 days')::timestamptz, (CURRENT_DATE - INTERVAL '6 days')::timestamptz),
  ('b0000001-0000-0000-0000-000000000006', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'ByteDance', 'Data Engineer', 'applied', 0.85, 'a0000001-0000-0000-0000-000000000007', 'thread006', NULL, NULL, NULL, 'Application submitted, waiting for review', (CURRENT_DATE - INTERVAL '27 days')::timestamptz, (CURRENT_DATE - INTERVAL '27 days')::timestamptz),
  ('b0000001-0000-0000-0000-000000000007', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'TikTok', 'Frontend Intern', 'rejected', 0.91, 'a0000001-0000-0000-0000-000000000008', 'thread007', NULL, NULL, NULL, 'Rejected after initial review', (CURRENT_DATE - INTERVAL '13 days')::timestamptz, (CURRENT_DATE - INTERVAL '13 days')::timestamptz),
  ('b0000001-0000-0000-0000-000000000008', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'Databricks', 'Software Engineer', 'interview', 0.93, 'a0000001-0000-0000-0000-000000000009', 'thread008', (CURRENT_DATE + INTERVAL '2 days')::date, '14:00', 'Remote (Zoom)', 'Technical interview scheduled', (CURRENT_DATE - INTERVAL '8 days')::timestamptz, (CURRENT_DATE - INTERVAL '8 days')::timestamptz),
  ('b0000001-0000-0000-0000-000000000009', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'Figma', 'Full Stack Engineer', 'applied', 0.87, 'a0000001-0000-0000-0000-000000000010', 'thread009', NULL, NULL, NULL, 'Application received, awaiting response', (CURRENT_DATE - INTERVAL '22 days')::timestamptz, (CURRENT_DATE - INTERVAL '22 days')::timestamptz),
  ('b0000001-0000-0000-0000-000000000010', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'Infineon', 'Software Engineer', 'assessment', 0.86, 'a0000001-0000-0000-0000-000000000011', 'thread010', NULL, NULL, 'Online', 'Shortlisted - technical assessment due April 13', (CURRENT_DATE - INTERVAL '10 days')::timestamptz, (CURRENT_DATE - INTERVAL '10 days')::timestamptz),
  ('b0000001-0000-0000-0000-000000000011', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'Amazon', 'SDE Intern', 'applied', 0.82, 'a0000001-0000-0000-0000-000000000012', 'thread011', NULL, NULL, NULL, 'Application submitted', (CURRENT_DATE - INTERVAL '29 days')::timestamptz, (CURRENT_DATE - INTERVAL '29 days')::timestamptz),
  ('b0000001-0000-0000-0000-000000000012', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'Microsoft', 'Software Engineer', 'rejected', 0.94, 'a0000001-0000-0000-0000-000000000013', 'thread012', NULL, NULL, NULL, 'Rejected after interview', (CURRENT_DATE - INTERVAL '9 days')::timestamptz, (CURRENT_DATE - INTERVAL '9 days')::timestamptz),
  ('b0000001-0000-0000-0000-000000000013', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'NVIDIA', 'Systems Engineer', 'applied', 0.83, 'a0000001-0000-0000-0000-000000000014', 'thread013', NULL, NULL, NULL, 'Under review - expecting update in 1-2 weeks', (CURRENT_DATE - INTERVAL '7 days')::timestamptz, (CURRENT_DATE - INTERVAL '7 days')::timestamptz),
  ('b0000001-0000-0000-0000-000000000014', 'd6b2c257-4664-422c-993f-6e9a2a5eb64e', 'Meta', 'Frontend Engineer', 'interview', 0.89, 'a0000001-0000-0000-0000-000000000015', 'thread014', NULL, NULL, NULL, 'Phone screen scheduling in progress', (CURRENT_DATE - INTERVAL '5 days')::timestamptz, (CURRENT_DATE - INTERVAL '5 days')::timestamptz);

-- Re-seeding: DELETE FROM job_fit_analyses WHERE user_id = 'd6b2c257-4664-422c-993f-6e9a2a5eb64e';

-- Job fit analyses
INSERT INTO job_fit_analyses (user_id, job_description, company_name, job_title, score, band, strengths_md, gaps_md, recommendations_md, overall_feedback_md, created_at) VALUES
  (
    'd6b2c257-4664-422c-993f-6e9a2a5eb64e',
    'Stripe is hiring a Backend Engineer to join our Payments Processing team. You will design and build systems that handle millions of transactions reliably. Requirements: 2+ years experience in Go, Python, or Java; understanding of distributed systems; experience with PostgreSQL and Redis; strong debugging skills. Nice to have: payment processing experience, event-driven architecture, Kubernetes.',
    'Stripe',
    'Backend Engineer',
    82,
    'strong_fit',
    E'- **Go expertise** is a direct match — your primary language aligns perfectly with Stripe''s stack\n- **Distributed systems experience** — you''ve designed event-driven architectures handling 50k events/min, directly relevant to payment processing at scale\n- **Performance optimization** — your track record of reducing API latency by 40% demonstrates the debugging and profiling skills Stripe values\n- **PostgreSQL and Redis** — core technologies you use daily',
    E'- **No payment domain experience** — haven''t worked with transaction processing, idempotency patterns, or financial compliance requirements\n- **Kubernetes exposure is limited** — Stripe runs heavy Kubernetes infrastructure; you may need to ramp up on advanced K8s concepts\n- **Scale gap** — 50k events/min is impressive but Stripe operates at 10-100x that volume',
    E'1. **Study idempotency patterns** — Read Stripe''s engineering blog posts on exactly-once processing. This is the #1 concept they test for.\n2. **Practice distributed systems design** — Focus on consensus, partition tolerance, and data consistency. Be ready to design a payment system end-to-end.\n3. **Brush up on Kubernetes** — Understand pods, services, and deployment strategies (canary, blue-green). You don''t need expert level but should speak confidently.\n4. **Prepare system design examples** — Have 2-3 stories ready about handling failure modes, retries, and monitoring in production.',
    E'**Strong fit — 82/100**\n\nYour backend and distributed systems experience maps well to Stripe''s core challenges. The main gap is domain-specific knowledge (payments, financial compliance), but Stripe is known for hiring strong engineers and teaching the domain. Your Go expertise and event-driven architecture experience give you a solid foundation. Focus your interview prep on idempotency and system design.',
    (CURRENT_DATE - INTERVAL '13 days')::timestamptz
  ),
  (
    'd6b2c257-4664-422c-993f-6e9a2a5eb64e',
    'Google is looking for a Software Engineer to work on large-scale infrastructure. You will design, develop, and maintain systems that serve billions of users. Requirements: strong coding skills in C++, Java, or Go; algorithms and data structures proficiency; system design experience; BS/MS in Computer Science. Team placements vary based on business needs.',
    'Google',
    'Software Engineer',
    65,
    'moderate_fit',
    E'- **CS fundamentals** — Your NUS degree and TA experience for Data Structures & Algorithms is a solid foundation for Google''s interview format\n- **Go proficiency** — Aligns with many Google infrastructure teams\n- **Production experience** — 3+ years building real systems with measurable impact',
    E'- **Generic role** — Google''s new grad / generalist SWE role doesn''t specify a team, so you can''t tailor your preparation toward a specific domain\n- **C++ not in your stack** — Google uses C++ heavily in infrastructure; you''d need to ramp up if placed on a C++ team\n- **Scale mismatch** — Your experience at 50k events/min is meaningful but Google operates at billions-of-users scale, a different engineering paradigm\n- **No open-source contributions** — Google values visible engineering impact beyond work',
    E'1. **LeetCode grind** — Google still tests classic algorithm problems. Focus on dynamic programming, graphs, and trees. Aim for 50-100 problems before the interview.\n2. **Study C++ basics** — Even if placed on a Go team, showing willingness to work in C++ broadens your options. Brush up on memory management and pointers.\n3. **Prepare behavioral stories** — Google''s structured interview process includes leadership and "Googleyness" questions. Have STAR stories ready.\n4. **Research specific teams** — Express preference for teams matching your backend/distributed systems background.',
    E'**Moderate fit — 65/100**\n\nYour backend fundamentals are solid, but Google''s generalist SWE role is a broad target. The interview will test algorithms heavily, which favors fresh grads over experienced engineers. Your production experience is valuable but may not directly help with the LeetCode-style questions. Consider this a stretch opportunity — the lack of C++ experience and the generic team assignment make it harder to stand out.',
    (CURRENT_DATE - INTERVAL '25 days')::timestamptz
  ),
  (
    'd6b2c257-4664-422c-993f-6e9a2a5eb64e',
    'Databricks is hiring a Software Engineer to build the next generation of our data platform. You will work on Apache Spark, Delta Lake, and MLflow. Requirements: experience building distributed data systems; proficiency in Scala or Python; understanding of data processing frameworks; strong communication skills.',
    'Databricks',
    'Software Engineer',
    71,
    'strong_fit',
    E'- **Data pipeline experience** — Your real-time data pipeline processing 2M events/day demonstrates direct relevant experience\n- **Distributed systems foundation** — Event-driven architecture and microservices migration show you understand the challenges of distributed computing\n- **Python proficiency** — Aligns with Databricks'' Python API and MLflow ecosystem',
    E'- **No Scala experience** — Databricks'' core platform (Spark) is built in Scala; you''d need to learn it for deep platform work\n- **No Spark/Delta Lake exposure** — Haven''t worked with these specific frameworks, though the underlying concepts (distributed computation, data partitioning) transfer\n- **Data engineering depth** — Your experience is more backend/infrastructure than data engineering specifically',
    E'1. **Learn Scala basics** — You don''t need mastery, but understanding pattern matching, implicits, and functional programming concepts will help in the interview and on the job.\n2. **Build a Spark project** — Complete a small data processing project using PySpark. Understanding lazy evaluation, partitions, and shuffle operations will set you apart.\n3. **Read the Delta Lake paper** — Understanding ACID transactions on data lakes is core to Databricks'' value proposition.\n4. **Prepare to discuss trade-offs** — Batch vs streaming, lambda architecture, exactly-once semantics — these are the conversations Databricks engineers have daily.',
    E'**Strong fit — 71/100**\n\nYour distributed systems and data pipeline experience is a good foundation for Databricks. The main gap is framework-specific (Spark, Scala, Delta Lake), but these are learnable. The interview will likely focus on system design and data processing concepts more than specific framework knowledge. Your real-world pipeline experience gives you concrete examples to discuss.',
    (CURRENT_DATE - INTERVAL '7 days')::timestamptz
  ),
  (
    'd6b2c257-4664-422c-993f-6e9a2a5eb64e',
    'Shopee is offering a Backend Intern position on our Platform Engineering team. You will work on microservices, API development, and internal tooling. Requirements: proficiency in Go or Java; understanding of RESTful APIs; basic knowledge of databases; currently enrolled in or recently graduated from a CS program.',
    'Shopee',
    'Backend Intern',
    78,
    'strong_fit',
    E'- **Go is your primary language** — Perfect match for Shopee''s backend stack\n- **Microservices experience** — You''ve already led a monolith-to-microservices migration, which exceeds what most interns have done\n- **API design** — RESTful API development is part of your daily work\n- **Singapore-based** — Matches the role location, no relocation needed',
    E'- **Overqualified for intern level** — Your 3+ years of experience significantly exceeds what''s expected for an intern role\n- **Limited Java exposure** — Shopee uses both Go and Java; some teams are Java-heavy\n- **Role scope** — Intern positions typically involve less ownership and architectural impact than you''re used to',
    E'1. **Clarify career level** — With your experience, you may be better positioned for a full-time Backend Engineer role rather than intern. Consider asking about this.\n2. **Understand Shopee''s engineering culture** — Read their tech blog and understand their e-commerce platform challenges (high concurrency, flash sales, order management).\n3. **Negotiate scope** — If accepting the intern role, negotiate for projects that match your experience level to avoid being underutilized.',
    E'**Strong fit — 78/100**\n\nYour technical skills are an excellent match — Go, microservices, and API design are exactly what Shopee needs. The concern is role fit: you''re significantly overqualified for an intern position. If this is your best current offer, take it, but also consider whether you can negotiate for a full-time role or use this as leverage to expedite other applications.',
    (CURRENT_DATE - INTERVAL '5 days')::timestamptz
  );
