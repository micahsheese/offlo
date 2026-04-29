# Offlo — Ethical AI Email

**AI drafting done right.** Transparent, human-approved, carbon-conscious email assistant for responsible teams.

## Stack

- **Frontend:** React + Vite + Shadcn + Tailwind (Vercel)
- **Backend:** Node.js + Express + PostgreSQL + Prisma (DigitalOcean)
- **AI:** Claude (Sonnet/Haiku via Anthropic API)
- **Cache:** Redis
- **Payments:** Stripe
- **Email:** Gmail OAuth

## Project Structure

```
offlo-repo/
├── frontend/          # React app (Vercel)
├── backend/           # Node/Express API (DigitalOcean)
├── docs/              # Documentation
└── README.md
```

## Getting Started

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Core Features

- **Transparency Badges:** Every draft shows AI model + timestamp
- **Mandatory Approval:** No email sends without human approval
- **Bias Detection:** Flag offensive/discriminatory language
- **Carbon Tracking:** Real-time CO2e per email
- **Impact Dashboard:** See your transparency metrics + charity donations
- **10% Profit → Nonprofits:** Climate action + tech equity

## Brand Values

- **Transparent AI:** Users know what's AI-assisted
- **Human-in-the-loop:** You control every send
- **Environmentally responsible:** 2x carbon offset on all emissions
- **Ethical by design:** No data harvesting, no hidden automation

## Roadmap

- **Week 1-2:** GitHub setup, architecture, security
- **Week 2-3:** Email agent, dashboard UI, bias detection, carbon tracking
- **Week 3-4:** Templates, impact dashboard, soft launch
- **Week 4-5:** Stripe billing, onboarding, marketing
- **Week 5-8:** Scaling to $10k MRR

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md)

## License

TBD

## Contact

founders@offlo.com
