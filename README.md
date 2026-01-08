# Matters

Matters is a multi-tenant task and project management platform with separate applications for clients and contractors, backed by a shared API and server.

This repo contains all applications and supporting services.

---

## Repo Layout

* **Root**
  Project-level configuration and docs (deployment, email, testing)

* **client/**
  Main client-facing web app
  Tech: TypeScript, Vite, Tailwind

* **contractor/**
  Contractor-focused web app
  Shares API and auth model with the client app

* **server/**
  Backend API and services
  Includes business logic and automated tests

* **api/**
  Serverless API routes (used where applicable)

---

## Development Setup

### Requirements

* Node.js (LTS)
* npm (or pnpm / yarn)

### Install dependencies

Each app manages its own dependencies.

```powershell
npm install
cd client
npm install
cd ..\contractor
npm install
cd ..\server
npm install
```

---

## Running Locally

Run each app in a separate terminal.

### Client app

```powershell
cd client
npm run dev
```

### Contractor app (optional)

```powershell
cd contractor
npm run dev
```

### Server

```powershell
cd server
npm run dev
```

Serverless routes live in `api/`.
Core backend logic lives in `server/src/`.

---

## Environment Configuration

* Deployment and environment setup is documented in:

  * `DEPLOY.md`
  * `EMAIL_SETUP.md`

* Most apps require a local `.env` file.

  * Check `server/config` and `client/` for `.env.example` files.

---

## Testing

* Backend tests are located in `server/tests/`
* Run from the server directory:

```powershell
npm test
```

---

## Deployment

* Deployment configs are included for:

  * **Vercel** (`vercel.json`)
  * **Railway** (`server/railway.json`)

Full deployment steps are documented in `DEPLOY.md`.

---

## Docs

* **DEPLOY.md** — deployment instructions
* **EMAIL_SETUP.md** — email provider configuration
* **TESTING_GUIDE.md** — testing setup and workflows

---

## License

MIT