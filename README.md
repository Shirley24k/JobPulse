# JobPulse Pro - Smart Job Application Tracking Platform

A comprehensive, production-ready platform designed to track job applications, automatically sync & parse email updates, enforce 5-working-day follow-up alert notifications, auto-transition stale applications to "No response" after 2 weeks, and manage complex multi-round interviews and assessments.

---

## ✨ Features Implemented

### 1. Manual Job Application Recording
- Add applications with Company Name, Role Title, Status, Location, Salary Range, Job Posting URL, Resume Version, Recruiter Contacts, and Rich Notes.
- Editable anytime with instant live updates.

### 2. Email Progress Tracking & Smart Parser
- **Smart Email Parser Engine**: Automatically extracts Company Name, Role, Stage/Status (`applied`, `phone screening`, `interview`, `assessment`, `offered`, `rejected`), Interview Dates & Meeting Links (Google Meet, Zoom, Teams), and Assessment deadlines & test links.
- **Interactive Recruiter Email Simulator**: Test real-world recruiter emails (Google, Stripe, Amazon, Netflix, OpenAI, or custom input) and track them with 1 click.
- **Auto-Linker**: Automatically updates existing applications or creates new ones from incoming emails.

### 3. 5 Working Days Follow-Up Alert System
- **Business Day Calculator**: Skips Saturdays and Sundays to calculate true working days elapsed.
- **Automated Nodemailer Alerts**: Dispatches email alerts when an application has not received a response in 5 working days.
- **1-Click Tailored Follow-Up Composer**: Generates customized follow-up email drafts (*Polite Nudge*, *Post-Interview Check-in*, *Competing Offer / Urgent Timeline*, *Formal Inquiry*) with 1-click clipboard copy or "Mark as Sent" which resets the 5-day timer.

### 4. 2-Week Auto "No Response" Transition
- Automatically evaluates applications in the `applied` stage. If 14 calendar days (2 weeks) pass without recruiter contact, the platform automatically transitions the status to **"No response"** and logs the event timestamp.

### 5. Multi-Round Interview & Assessment Manager
- **Multiple Interview Sessions Tracker**: Track unlimited interview rounds per company (e.g. Round 1 Recruiter Screen, Round 2 Live Coding, Round 3 System Design, Round 4 Hiring Manager, Round 5 Executive). Includes Date/Time, Duration, Interviewers, Video Links with 1-click Join, Notes, and Feedback.
- **Multiple Assessment Tracker**: Track take-home projects, HackerRank, CodeSignal, and LeetCode assessments with due date countdowns, test URLs, and submission statuses (*Pending*, *In Progress*, *Submitted*, *Passed*, *Failed*).

---

## 🚀 Additional Value-Add Features Included

- **Interactive Kanban Board View**: Drag/progress stages visually with custom status indicators and pulse alert badges.
- **Detailed Filterable & Sortable Table View**: Search across companies, roles, and notes; filter by stage; sort by date or silence duration.
- **Schedule & Deadlines Calendar View**: Unified chronological timeline for all upcoming interviews and assessment deadlines.
- **Pipeline & Conversion Analytics**: Funnel conversion rates, response rate %, average days to response, and stage distribution.
- **Custom Settings & Thresholds**: Configure custom alert thresholds, custom SMTP credentials (Gmail App Password, Outlook), and IMAP configuration.
- **Offer Celebration**: Confetti animation when marking a job as `Offered` 🎉.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend**: Node.js, Express, Node-Cron background rules engine, Nodemailer, Smart Email Parser with regex & entity extraction.
- **Storage**: Persistent JSON database with atomic writes (`server/data.json`).

---

## 💻 How to Run Locally

1. **Start both Backend and Frontend together:**
   ```bash
   npm run dev
   ```
2. **Access the application:**
   - **Frontend UI:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)

3. **Individual Commands:**
   - Backend only: `node server/server.js`
   - Frontend only: `npm --prefix client run dev`
