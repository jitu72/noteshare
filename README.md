# Collaborative Note App (Next.js + MongoDB)

A full-featured, multi-user collaborative note-taking app. Originally built in PHP/MySQL,
now rewritten with **Next.js (App Router)**, **MongoDB**, **Cloudinary** for file storage,
and deployable to **Netlify**.

## ✨ Features

- **Auth** — register / login / logout with bcrypt password hashing and JWT session cookies
- **Notes** — create, edit, delete, view, with autosaved drafts
- **File attachments** — uploaded to Cloudinary (images, PDFs, docs, spreadsheets)
- **Public sharing** — public links with optional memorable custom URLs (`/s/your-slug`)
- **User-to-user sharing** — share notes read-only or read & edit, with live user search
- **Categories** — organize notes into colored categories
- **Profile** — update name/email and change password

## 🛠️ Tech Stack

| Layer        | Technology                                |
| ------------ | ----------------------------------------- |
| Framework    | Next.js 15 (App Router, Server Actions)   |
| Language     | TypeScript, React 19                      |
| Database     | MongoDB (Atlas or self-hosted)            |
| File storage | Cloudinary                                |
| Styling      | Tailwind CSS                              |
| Auth         | Custom JWT (`jose`) + bcrypt              |
| Hosting      | Netlify (`@netlify/plugin-nextjs`)        |

## 🚀 Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable                 | Description                                              |
| ------------------------ | -------------------------------------------------------- |
| `MONGODB_URI`            | MongoDB connection string (Atlas `mongodb+srv://…`)      |
| `MONGODB_DB`             | Database name (e.g. `note_app`)                          |
| `AUTH_SECRET`            | Long random string for signing session JWTs              |
| `CLOUDINARY_CLOUD_NAME`  | From your Cloudinary dashboard                           |
| `CLOUDINARY_API_KEY`     | From your Cloudinary dashboard                           |
| `CLOUDINARY_API_SECRET`  | From your Cloudinary dashboard (keep secret!)            |

Generate an `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> File attachments require the three `CLOUDINARY_*` values. Everything else works without them.

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000. Database indexes are created automatically on first
registration — no manual schema/migration step needed.

## ☁️ Deploying to Netlify

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Netlify: **Add new site → Import an existing project**, and select the repo.
3. Netlify auto-detects Next.js. The included `netlify.toml` already sets the build
   command (`npm run build`) and enables `@netlify/plugin-nextjs`.
4. Under **Site settings → Environment variables**, add all the variables from your
   `.env.local` (`MONGODB_URI`, `MONGODB_DB`, `AUTH_SECRET`, and the `CLOUDINARY_*` keys).
5. Deploy. Server components, server actions, and API routes run as Netlify Functions.

> **MongoDB Atlas note:** add `0.0.0.0/0` to the Atlas network access allow-list (or
> Netlify's egress IPs) so serverless functions can connect.

## 📁 Project Structure

```
src/
├── app/
│   ├── login/ register/            Auth pages
│   ├── dashboard/                  Note list + stats
│   ├── notes/new, notes/[id]/...   Create / view / edit / share
│   ├── s/[token]/                  Public shared-note view
│   ├── shared-with-me/             Notes shared to you
│   ├── categories/  profile/
│   └── api/                         Cloudinary signing + user search endpoints
├── actions/                        Server actions (auth, notes, sharing, …)
├── components/                     Reusable UI (forms, header, …)
└── lib/                            mongodb, auth, models, cloudinary, utils, access
```

## 🔐 Data Model (MongoDB collections)

- `users` — accounts (`username`, `email`, `password` hash, `name`)
- `notes` — note content (`userId`, `categoryId`, `title`, `content`, `isPublic`, `shareToken`)
- `attachments` — Cloudinary file references linked to a note
- `shared_notes` — user-to-user shares (`read` / `write`)
- `collaborators` — collaborator access (`read` / `write` / `admin`)
- `categories` — per-user colored categories
