/**
 * Blog posts, newest first. To add a post, copy one entry and edit it; the Blog page needs no change.
 * Write for buyers (clinic, school and shop owners), and have each post approved before it goes live.
 */
export const blogArticles = [
  {
    id: 1,
    title: "Orchestrating AI Agent Workflows in Enterprise ERPs",
    category: "AI",
    readTime: "5 Min Read",
    author: "Abhisek, Chief Architect",
    date: "July 04, 2026",
    summary: "How cognitive AI agents automate multi-step operational entries, invoice extractions, and data mappings inside customized business software platforms.",
    coverGradient: "linear-gradient(135deg, #1e1b4b, #4f46e5)",
    content: `
# Orchestrating AI Agent Workflows in Enterprise ERPs

Autonomous digital workers are transforming corporate systems. Bolting AI onto software as an afterthought is no longer sufficient; intelligent workflows must be integrated directly into the core architecture.

## The Bottleneck of Traditional ERPs
Most enterprise software relies on manual inputs. Operations staff spend hours copying data from invoices, parsing emails, and validating transaction fields before clicking save. These human loops introduce data errors and slow down business reaction times.

## Deploying Autonomous AI Agents
By integrating language models (like GPT-4 and Claude 3.5) with local vector store indexes, we establish secure cognitive workers. When a vendor email enters the network:
1. **Intake**: A background worker grabs attachments (PDFs, scans).
2. **Cognitive OCR**: Document layout parsers pull keys (Vendor, Subtotal, GST, Items), with low-confidence fields flagged for human review.
3. **Validation**: The AI agent cross-checks fields with active purchase agreements.
4. **Automation**: If verified, a secure REST API updates the database automatically.

> [!TIP]
> Use domain isolation patterns and structured JSON outputs in LLM prompts to guarantee database consistency.

We are standardizing these cognitive worker flows in our **AlphaGrew Smart Campus ERP** and HRMS frameworks, paving the way for hands-off operational efficiency.
    `,
  },
  {
    id: 2,
    title: "Laravel 12 vs. Node Express: Selecting the Right API Layer",
    category: "Development",
    readTime: "8 Min Read",
    author: "Neethu, Team Lead",
    date: "June 28, 2026",
    summary: "A deep-dive technical comparison of developer performance, DB pooling speeds, and permissions modules inside custom API structures.",
    coverGradient: "linear-gradient(135deg, #180828, #7c3aed)",
    content: `
# Laravel 12 vs. Node Express: Selecting the Right API Layer

Choosing a backend framework determines the velocity of your scaling. We examine speed, queue management, database interactions, and authentication layers.

## The Strengths of Laravel 12
For complex enterprise databases (such as our HumaNode HRMS), Laravel remains our primary choice:
- **RBAC Permissions**: Spatie permission integrations make role assignments secure.
- **Queued Operations**: Laravel Horizon Redis queues handle intensive payroll calculations smoothly.
- **Database Eloquent**: Clean MVC repository patterns ease database query scaling.

## The Node.js Express Alternative
For high-frequency, real-time message streams (like QR queue display panels or WebSocket dashboards):
- **Concurrency**: Node's event-loop processes millions of lightweight requests with minimum latency.
- **Microservices**: Node easily packages into lightweight Docker containers.

## Summary Matrix
| Feature | Laravel 12 | Node.js Express |
| :--- | :--- | :--- |
| **Boot time** | Moderate | Fast |
| **Permissions** | Spatie (Built-in) | Custom middleware |
| **Concurrency** | Queue workers | High thread speed |

We combine both architectures, utilizing Laravel as our core business monolith and Node microservices for real-time WebSockets.
    `,
  },
  {
    id: 3,
    title: "Multi-Tenant PostgreSQL Architecture in HRMS Environments",
    category: "Cloud",
    readTime: "6 Min Read",
    author: "Krishnan, DB Architect",
    date: "June 15, 2026",
    summary: "Comparing schema isolation versus single-shared databases for enterprise SaaS products requiring strict compliance boundaries.",
    coverGradient: "linear-gradient(135deg, #052e16, #10b981)",
    content: `
# Multi-Tenant PostgreSQL Architecture in HRMS Environments

When serving multiple corporate accounts on a single SaaS product, data security and isolation are critical.

## Tenant Isolation Strategies
There are three main ways to isolate tenant data:
1. **Database-Per-Tenant**: Highest security, but hard to update at scale.
2. **Schema-Per-Tenant**: Separate tables inside a single database.
3. **Shared-Database (Row-Level)**: Simple to build, but carries a high risk of leakage.

## Why We Choose Schema-Per-Tenant
In **HumaNode HRMS**, we isolate each tenant into a dedicated schema. Connection strings route automatically based on subdomains or JWT headers. This guarantees that customer payroll logs remain isolated while letting us run central database migrations.

> [!IMPORTANT]
> Always enforce strict Row-Level Security (RLS) on shared data tables to prevent data leakage.
    `,
  },
  {
    id: 4,
    title: "Why Offline-First Flutter Apps Succeed in Clinical Spaces",
    category: "Healthcare",
    readTime: "7 Min Read",
    author: "Abraham, Mobile Lead",
    date: "May 22, 2026",
    summary: "How background SQLite caching and queue listeners prevent clinic interruptions during network drops.",
    coverGradient: "linear-gradient(135deg, #0f172a, #00e5ff)",
    content: `
# Why Offline-First Flutter Apps Succeed in Clinical Spaces

Hospitals and clinics require constant uptime. Network drops should never delay patient treatments or check-ins.

## Caching at the Edge
By utilizing Dart Hive and local SQLite caching inside Flutter apps:
- Patient logs save instantly.
- The UI transitions smoothly even without a connection.
- Background sync queues process and upload data when the network is restored.

The **GMC Chest Hospital, Thrissur** patient app we built uses this kind of on-device storage (Drift / SQLite) in Flutter.
    `,
  },
  {
    id: 5,
    title: "AWS Lightsail vs. ECS: Choosing the Right Deployment Target",
    category: "Cloud",
    readTime: "6 Min Read",
    author: "Krishnan, DB Architect",
    date: "July 01, 2026",
    summary: "A practical cost and scale comparison between AWS Lightsail and Elastic Container Service for startup-stage and enterprise-grade Chromolog deployments.",
    coverGradient: "linear-gradient(135deg, #1a1a2e, #FF9900)",
    content: `
# AWS Lightsail vs. ECS: Choosing the Right Deployment Target

The cloud decision at project kickoff directly determines your monthly operational cost, your scaling ceiling, and the complexity of your DevOps pipeline.

## Lightsail — The Predictable Option
For most startup clients and early-stage SaaS products at Chromolog, AWS Lightsail offers a clean starting point:
- **Fixed pricing**: Plans starting from $3.50/mo remove billing surprises.
- **Bundled resources**: SSD storage, public IP, and transfer quotas included.
- **Managed firewall**: Simplified security rules without full VPC configuration.

We use Lightsail for:
- Single-server Laravel backends (HRMS Beta)
- WordPress-managed marketing stacks
- Low-traffic staging environments

## ECS (Elastic Container Service) — The Scale Option
When a product transitions from 100 to 10,000 daily users, we graduate to ECS Fargate:
- **Container autoscaling**: Tasks spin up automatically under traffic spikes.
- **Task definitions**: Deployment manifests control memory, CPU, and environment variables.
- **ECR pipelines**: Docker images push and deploy through GitHub Actions CI/CD.

> [!TIP]
> Start on Lightsail, plan your containerization early, and set a traffic threshold trigger (e.g., 1,000 requests/hour) to migrate to ECS without downtime.

## Summary
| Factor | Lightsail | ECS Fargate |
| :--- | :--- | :--- |
| **Monthly Cost** | Fixed $3–80/mo | Variable, usage-based |
| **Autoscaling** | Manual only | Automatic |
| **Complexity** | Low | Medium–High |
| **Best For** | Early-stage | High-traffic SaaS |

All Chromolog production deployments are containerized from day one, ensuring a friction-free migration path when the product demands ECS-level infrastructure.
    `,
  },
  {
    id: 6,
    title: "Chromolog V3: A New Era for Our Digital Presence",
    category: "Company Updates",
    readTime: "3 Min Read",
    author: "Abhisek, Founder",
    date: "July 08, 2026",
    summary: "Announcing the complete redesign of Chromolog Technologies' website — powered by React, GSAP, and our new Premium AI-first design system.",
    coverGradient: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    content: `
# Chromolog V3: A New Era for Our Digital Presence

Today, we officially launch the Chromolog Technologies V3 website — a complete reimagination of how a software company should present itself in the AI-first era.

## What Changed
The V3 redesign is not a cosmetic update. It is a full architectural rebuild:

- **New Design System**: A premium token-based system using Space Grotesk, Sora, and DM Sans with carefully curated color palettes.
- **Interactive Technology Orbit**: A real-time SVG orbital animation showcasing our full tech stack.
- **Industry Solution Explorer**: An immersive tabbed explorer mapping our work across 6 business sectors.
- **Project Case Studies**: Full-screen deep dives into our portfolio of delivered products.
- **Knowledge Hub**: Technical blog with search, category filters, and article reader.

## Built With Care

This website was built using the same stack we recommend to our clients:

- **React 19** for component architecture
- **Framer Motion** and **GSAP** for cinematic animations
- **Tailwind CSS** for the design token system
- **Vite** for blazing-fast builds

> [!NOTE]
> The entire codebase is maintained internally by the Chromolog team, ensuring we practice the same engineering standards we preach to clients.

## What's Next
Phase 4 brings AI-powered features to the website — an embedded AI assistant, personalized content recommendations, and enterprise analytics. Stay tuned.

Thank you to everyone who has trusted Chromolog Technologies over the years. This is only the beginning.
    `,
  },
];
