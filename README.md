# Family Tree

An interactive, password-protected family tree web app built for large extended families. Zoom and pan through hundreds of people across multiple family branches, with a click-to-edit UI for non-technical family members.

**Live demo:** *(add your Netlify URL here after setup)*

---

## Features

- **Password-protected viewing** — family members need a shared password just to see the tree
- **Two-tier access** — a separate edit password for those who can make changes
- **Click-to-edit** — non-technical family members can edit directly in the browser; no GitHub knowledge required
- **Multi-branch support** — toggle between Mom's side, Dad's side, or view all at once with color-coded branches
- **All relationship types** — spouse, parent-child, step-parent, adoptive, half-sibling
- **Private fields** — mark individual fields (birthdays, notes) as hidden from viewers
- **Search** — fuzzy search by name, scoped to the active branch filter
- **PDF export** — export any subtree as a PDF with configurable generation depth
- **Zoom and pan** — handles 500+ people with smooth D3-powered navigation
- **Code/data separation** — this repo contains zero family data; your data lives in a private repo you control

---

## How It Works (Two Repos)

This app is intentionally split across two repositories:

| Repo | Visibility | Contents |
|---|---|---|
| `family_tree` (this repo) | Public | App code, sample data template, schema |
| `family_tree_data` | **Private** | Your actual `family.json` — only you can see this |

All family data is fetched at runtime through a Netlify serverless function that requires a valid JWT. The data is never bundled as a static asset. Your private repo's contents are never exposed.

Anyone can fork this repo to build their own family tree — they just point it at their own private data repo.

---

## Tech Stack

- **Frontend:** React 18 + Vite 5
- **Visualization:** [family-chart (f3)](https://github.com/nicktimko/family-chart) — purpose-built for genealogy (couples side-by-side, children grouped, multiple marriages)
- **Auth:** bcrypt + JWT via Netlify Functions (server-side only — passwords never touch client code)
- **Search:** Fuse.js (fuzzy)
- **Export:** jsPDF + html2canvas (lazy-loaded)
- **Hosting:** Netlify (free tier)
- **Data:** JSON in a private GitHub repo

---

## Setup Guide

### Step 1 — Create your private data repo

1. Create a new **private** GitHub repo named `family_tree_data`
2. In that repo, create `data/family.json` — use [data/sample.json](data/sample.json) in this repo as your starting template
3. See the [family_tree_data README](https://github.com/bzmull/family_tree_data) for the full data schema

### Step 2 — Fork or clone this repo

```bash
git clone https://github.com/bzmull/family_tree.git
cd family_tree
```

### Step 3 — Create a GitHub Personal Access Token

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. Click **Generate new token**
3. Set expiration (max 1 year — note the date, you'll need to renew it)
4. Under **Repository access**, select **Only select repositories** → choose your `family_tree_data` repo
5. Under **Repository permissions**, grant **Contents: Read and write**
6. Generate and copy the token

### Step 4 — Generate password hashes

You need bcrypt hashes for your view password and edit password. Run this in any Node.js environment:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password-here', 10));"
```

Or use an online bcrypt generator (make sure to use cost factor 10).

Generate two hashes — one for the family viewing password, one for the editing password.

### Step 5 — Set up Netlify

1. Go to [netlify.com](https://netlify.com) and create a free account
2. Click **Add new site → Import an existing project → GitHub**
3. Select your `family_tree` repo
4. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
5. Go to **Site configuration → Environment variables** and add:

| Variable | Value |
|---|---|
| `VIEW_PASSWORD_HASH` | bcrypt hash of your family viewing password |
| `EDIT_PASSWORD_HASH` | bcrypt hash of your editing password |
| `JWT_SECRET` | Any long random string (e.g., generate with `openssl rand -hex 32`) |
| `GITHUB_TOKEN` | The fine-grained PAT from Step 3 |
| `DATA_REPO_OWNER` | Your GitHub username (e.g., `bzmull`) |
| `DATA_REPO_NAME` | `family_tree_data` |

6. Deploy. Netlify will build and publish the site automatically.

### Step 6 — Share with family

Share your Netlify URL and the viewing password with family members. Give the editing password only to those who should be able to make changes.

---

## Using the App

### Viewing the tree

1. Go to your Netlify URL
2. Enter the family password at the prompt
3. The tree loads — zoom with scroll wheel, pan by dragging
4. Use the branch filter pills at the top to focus on one side of the family
5. Use the search bar to find a specific person — clicking a result centers the tree on them

### Editing the tree

1. Click **Edit Mode** in the toolbar
2. Enter the edit password
3. Click any person node to open their edit panel
4. Edit fields, toggle privacy locks on individual fields
5. Use the **Relationships** tab to add or remove connections
6. Click **Add Person** to add someone new
7. Click **Save** — changes commit to your private `family_tree_data` repo automatically; the tree refreshes in about 60 seconds

### Privacy controls

In edit mode, each field in the edit panel has a lock icon. When locked:
- That field is hidden from anyone logged in with the view password
- Fields on living people default to having `birthDate` private
- The `privateNotes` field is always hidden from viewers

---

## Data Model Reference

The full schema lives in [`src/data/schema.js`](src/data/schema.js). Quick reference:

### Person object

```json
{
  "id": "p001",
  "firstName": "Margaret",
  "lastName": "Sullivan",
  "maidenName": "O'Brien",
  "gender": "female",
  "birthDate": "1942-03-15",
  "birthPlace": "Cork, Ireland",
  "deathDate": null,
  "isLiving": true,
  "bio": "Free-text biography",
  "occupation": "Retired teacher",
  "branches": ["maternal"],
  "private": {
    "birthDate": false,
    "bio": false,
    "notes": true
  },
  "privateNotes": "Visible to editors only",
  "customFields": {
    "hometown": "Cork, Ireland"
  }
}
```

### Relationship object

```json
{
  "id": "r001",
  "type": "parent-child",
  "fromId": "p001",
  "toId": "p002"
}
```

```json
{
  "id": "r002",
  "type": "spouse",
  "fromId": "p001",
  "toId": "p003",
  "marriageDate": "1965-06-20",
  "divorceDate": null,
  "isCurrentSpouse": true
}
```

**Relationship types:** `parent-child` · `adoptive-parent-child` · `step-parent` · `spouse` · `half-sibling` · `sibling`

### Branch object

```json
{ "id": "maternal", "label": "Mom's Side", "color": "#7C3AED" }
```

---

## Branch / Multi-Family Concept

A "branch" represents one side of the family. Each person has a `branches` array — most people belong to one branch, but "bridge" people (like you, who connect both sides) can belong to multiple.

The branch filter lets you focus on one side at a time. Bridge people remain visible even when a single branch is selected, so the tree doesn't break.

Marriage links between branches are shown as connectors. Clicking a bridge person shows a "View full family" option that switches to the All view and centers on them.

---

## Password Management

### Resetting the view or edit password

1. Generate a new bcrypt hash for the new password (see Step 4 above)
2. Go to your Netlify site → **Site configuration → Environment variables**
3. Update `VIEW_PASSWORD_HASH` or `EDIT_PASSWORD_HASH`
4. Netlify redeploys automatically — the new password is active within ~60 seconds
5. Existing JWTs remain valid for up to 8 hours; they expire naturally

### Renewing the GitHub PAT

Fine-grained tokens expire after at most 1 year. When yours is about to expire:

1. Follow Step 3 above to generate a new token
2. Update `GITHUB_TOKEN` in your Netlify environment variables
3. Delete the old token from GitHub for security

**Your PAT expiry date:** *(fill this in when you create the token)*

---

## Forking for Your Own Family Tree

1. Fork this repo
2. Create your own private `family_tree_data` repo
3. Follow the setup guide above with your own credentials
4. Your fork is independent — you own everything

---

## Contributing / Schema Validation

Pull requests that modify `data/sample.json` are automatically validated by the `validate-data` GitHub Actions workflow. The schema check verifies:

- All required fields present
- All relationship `fromId`/`toId` values reference existing person IDs
- No circular parent-child chains
- Date formats are valid ISO 8601

---

## Local Development

```bash
npm install
npm run dev       # Start Vite dev server
npm run test      # Run Vitest unit tests
npm run validate  # Validate data/sample.json against schema
```

For functions, install the [Netlify CLI](https://docs.netlify.com/cli/get-started/):

```bash
npm install -g netlify-cli
netlify dev       # Runs Vite + Functions together locally
```

Copy `.env.example` to `.env` and fill in values for local testing.
