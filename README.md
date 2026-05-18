# Faculty Self Appraisal Management System (FSAMS / FAA)

Production-oriented full-stack web application for an institutional Faculty Self Appraisal workflow.

## Stack

- Frontend: React, Tailwind CSS, React Router, Axios
- Backend: Node.js, Express.js, MongoDB Atlas, Mongoose
- Auth: JWT, bcrypt, role middleware
- Libraries: multer, puppeteer, nodemailer, dotenv, express-validator, helmet, express-rate-limit

## Workflow

Faculty creates a draft, submits it, and the appraisal becomes locked. HOD reviews only appraisals from their own department and can return, approve, or reject. Principal can view only HOD-approved appraisals and add final remarks. Admin creates all accounts manually or by CSV bulk upload.

Allowed statuses:

- `draft`
- `submitted`
- `returned_for_edit`
- `hod_approved`
- `rejected`
- `final_reviewed`

## Account Email Notifications

When an admin creates a Faculty, HOD, Principal, or Admin account, the backend validates the email address before account creation. It checks format, existing users, disposable domains, and MX records through `deep-email-validator`. SMTP mailbox probing is optional because many providers block live mailbox checks.

After a valid account is created, the system sends a Gmail SMTP email with the user's name, role, department, login email, password, and login URL. If sending fails, the account remains created and the admin sees a warning.

Required backend environment variables:

```env
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM="FSAMS Portal <your-gmail-address@gmail.com>"
LOGIN_URL=https://your-frontend-url.vercel.app
EMAIL_VALIDATION_TIMEOUT_MS=10000
EMAIL_SEND_TIMEOUT_MS=10000
EMAIL_VALIDATE_SMTP=false
ORG_EMAIL_DOMAIN=
```

Gmail setup:

- Enable 2-Step Verification on the Gmail account.
- Open Google Account > Security > App passwords.
- Create an app password for Mail.
- Put that generated 16-character app password in `EMAIL_PASS`.
- Never use or commit your normal Gmail password.

Email validation limitation: some providers block SMTP mailbox checks. Keep `EMAIL_VALIDATE_SMTP=false` unless your institution specifically requires live mailbox probing.

## Local Setup

Backend:

```bash
cd server
copy .env.example .env
npm install
npm run seed:admin
npm run dev
```

Frontend:

```bash
cd client
copy .env.example .env
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## MongoDB Atlas

Set `MONGO_URI` in `server/.env`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/fsams
```

Create a database user in Atlas, allow your deployment IP, and keep credentials out of source control.

## CSV Upload

Admin bulk upload accepts a `.csv` file with:

```csv
name,email,role,department
Jane Faculty,jane@aiet.org.in,faculty,CSE
```

Temporary passwords are returned in the API response and emailed when SMTP variables are configured.

## Deployment

Before deploying:

- Run `npm run build` from the repository root and confirm it passes.
- Review and commit local changes.
- Configure production environment variables in the hosting dashboards. Do not commit real secrets.
- Use persistent storage for uploaded proofs by setting `UPLOAD_DIR` to a persistent disk path, or replace local disk uploads with cloud storage such as S3, Cloudinary, or GridFS.

Frontend on Vercel:

- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`

Backend on Render or Railway:

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables: copy values from `server/.env.example`
- For local disk proof uploads, set `UPLOAD_DIR` to the mounted persistent disk path.
- Configure `EMAIL_USER`, `EMAIL_PASS`, and `EMAIL_FROM` for account creation emails.

For Puppeteer on Linux hosts, keep `--no-sandbox` enabled as configured in `server/utils/pdf.js`.
