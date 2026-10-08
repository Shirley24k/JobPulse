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

| Layer        | Technology                                                                  |
| ------------ | --------------------------------------------------------------------------- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons, Canvas Confetti              |
| **Backend**  | Node.js, Express, Node-Cron (background rules engine), Nodemailer           |
| **Database** | **SQLite** (via `sqlite3` npm package) — file: `server/database.sqlite`     |
| **Email**    | Nodemailer (SMTP outbound), Smart Email Parser (regex + entity extraction)  |

### Database Schema (SQLite)

The SQLite database (`server/database.sqlite`) consists of **8 relational tables**:

| Table              | Purpose                                                         |
| ------------------ | --------------------------------------------------------------- |
| `applications`     | Core job application records (company, role, status, dates)     |
| `interviews`       | Multi-round interview sessions linked to each application       |
| `assessments`      | Take-home tests & online assessments linked to each application |
| `email_threads`    | Parsed recruiter email records                                  |
| `followup_history` | Follow-up email history per application                         |
| `settings`         | Key-value app settings (alert email, thresholds, SMTP config)   |
| `alerts`           | Log of all auto-dispatched follow-up alert emails               |
| `activity_logs`    | Chronological audit log for all application events              |

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

---

## 🗄️ Viewing the Database in DBeaver

DBeaver is a free, universal database tool that can open and browse the SQLite file visually.

### Step 1 — Download & Install DBeaver
1. Go to [https://dbeaver.io/download/](https://dbeaver.io/download/) and download the **Community Edition** (free).
2. Run the installer and follow the on-screen steps.

### Step 2 — Create a New SQLite Connection
1. Open DBeaver.
2. Click **"New Database Connection"** (the plug icon in the top-left toolbar, or press `Ctrl+Shift+N`).
3. In the **"Select your database"** dialog, search for **SQLite** and select it, then click **Next**.

### Step 3 — Point to the Database File
1. In the **Connection Settings** panel, click the **"Open..."** button next to the *Path* field.
2. Navigate to your project folder and select:
   ```
   C:\JobApplication\server\database.sqlite
   ```
3. Click **Finish**. DBeaver may prompt you to download the SQLite JDBC driver — click **Download** to install it automatically.

### Step 4 — Browse the Data
1. In the **Database Navigator** panel (left sidebar), expand your new connection.
2. Expand: `database.sqlite` → `Tables`.
3. You will see all 8 tables listed:
   - `applications`, `interviews`, `assessments`, `email_threads`, `followup_history`, `settings`, `alerts`, `activity_logs`
4. **Double-click any table** to open the Data viewer and see all records in a spreadsheet-style grid.
5. You can also run SQL queries by right-clicking the connection → **SQL Editor → Open SQL Script**, and typing:
   ```sql
   SELECT * FROM applications;
   SELECT * FROM interviews WHERE application_id = 'your-id-here';
   SELECT * FROM alerts ORDER BY sent_at DESC;
   ```

### Step 5 — Refresh After App Updates
- After the Node.js server writes new records, press **F5** (or right-click the table → **Refresh**) in DBeaver to see the latest data.

> **Note:** The SQLite file is at `server/database.sqlite` in the project root. SQLite handles concurrent reads gracefully, so you can browse while the server is running.

---

## ⚙️ Email Alert Setup (Optional)

To enable real email alerts:

1. Go to the **Settings** tab in the app.
2. Enter your **Recipient Email** (where you want to receive follow-up reminders).
3. Enable **SMTP** and fill in:
   - **SMTP Host**: e.g. `smtp.gmail.com`
   - **SMTP Port**: `587`
   - **Sender Email**: Your Gmail address
   - **App Password**: Generate one at [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) *(requires 2FA enabled)*

> You can use the **same email** for both Sender and Recipient (send alerts to yourself).
> Without SMTP credentials, alerts are still logged in the database but no actual email is dispatched.
