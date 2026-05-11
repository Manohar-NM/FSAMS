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

For Puppeteer on Linux hosts, keep `--no-sandbox` enabled as configured in `server/utils/pdf.js`.
