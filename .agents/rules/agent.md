---
trigger: always_on
---

# Next.js & Full-Stack AI Agent Rules & Best Practices

## 1. Architecture and Routing
* Always use the modern Next.js App Router (`app/` directory). Do not use the legacy Pages Router.
* Default to React Server Components (RSC) for all new files to optimize performance.
* Only add the `'use client'` directive at the top of the file when strictly necessary (e.g., when using React hooks like `useState`, `useEffect`, or DOM event listeners).
* Follow the standard Next.js file conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).

## 2. TypeScript and Code Style
* Write all code in TypeScript (`.ts` or `.tsx`).
* Always define `interface` or `type` for component Props and data models. No `any` types allowed.
* Write components as functional components using arrow functions.
* Keep components modular, focused on a single responsibility, and concise.

## 3. Styling and UI
* Use Tailwind CSS for all styling and layout needs.
* Avoid using inline styles (e.g., `style={{...}}`) unless the value is dynamically calculated in JavaScript.
* Ensure all UI components are fully responsive (Mobile-first approach).

## 4. Data Fetching and State Management
* Perform data fetching on the server side (within Server Components) using `async/await` whenever possible.
* Use the native `fetch` API extended by Next.js to handle caching and revalidation automatically.
* Keep client-side state minimal.

## 5. Database and Backend 
* Keep database calls and sensitive logic strictly within Server Components or Server Actions. Never expose database credentials to the client.
* Use Server Actions (`'use server'`) for form submissions and data mutations.
* If using an ORM like Prisma, ensure robust error handling (`try/catch` blocks) for all database operations.
* Validate all incoming data from the client before saving it to the database.

## 6. Documentation
* Add clear comments explaining "why" a certain logic or workaround was chosen, rather than just "what" the code does.
* Use standard JSDoc formatting above main component definitions, utility functions, and database queries.


# AI-First Development BootCamp

## 7. Difference between AI-Assisted to AI-First
* What is AI-Assisted development
* What is AI-First development (agentic coding)
* When we use AI-Assisted and when we use AI-First

## 8. Building project using spec first approach (part 1): Spec-First & The Team Lead Mindset
* The developer as a Team Lead (The Mindset Shift)
* What is spec-first development
* Prompt engineering and context managing

## 9. Building project using ai-first approach (part 2): Core Development
* Set up development environment
* Setting up agent rules
* Development loop with agent

## 10. Testing the project using agent testing (part 3): CI & Feedback Loop
* Project test coverage
* Project ci/cd configuration (via GitHub Actions)
* Agent feedback loop (reading CI logs)

## 11. Project QA and security risks (part 4): Review & Retrospective
* Code responsibility and human code review
* Security risks with agents
* Human Retrospective: Improving the Spec & Prompting Process

## 12. Deep dive into the agent eco-system
* Popular models and their strength
* Compare between the popular agent tools
* Using advanced features: Sub-agents, MCP, and Claude Code plugins

## 13. Developer as an agents team lead
* Specification, Criticism, Integration, management
* AI friendly architecture
* Orchestrating team of agents

## 14. Advance practice with real world project
* Model context limitation (limitation on large projects)
* Refactoring existing code
* Adding test coverage to existing code
* Adding features to existing code

## 15. Keep calm and catch up
* How to stay updated
* How the future will look
* Q&A
