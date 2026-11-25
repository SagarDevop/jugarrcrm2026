# Jugarr CRM — Full Production Hosting & Deployment Guide

Follow these exact steps to host your **Backend on Render** and **Frontend on Vercel**.

---

## Part 1: Push Code to GitHub

Open PowerShell in the project directory (`c:\Users\Admin\OneDrive\Desktop\jugarrcrm`):

```powershell
# 1. Initialize Git repository
git init

# 2. Set default branch to main
git branch -M main

# 3. Add all files (.env and node_modules are safely ignored)
git add .

# 4. Commit changes
git commit -m "feat: complete fresh Jugarr CRM ready for production"

# 5. Create a new repository on GitHub (e.g., named 'jugarrcrm') and link it:
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/jugarrcrm.git

# 6. Push to GitHub
git push -u origin main
```

---

## Part 2: MongoDB Atlas IP Whitelist (Important)

Render servers run on dynamic cloud IPs. Make sure your MongoDB Atlas cluster accepts connections from anywhere:
1. Open [cloud.mongodb.com](https://cloud.mongodb.com).
2. Go to **Security** -> **Network Access**.
3. Check if `0.0.0.0/0` (Allow Access from Anywhere) is listed.
4. If not, click **Add IP Address** -> click **"Allow Access from Anywhere"** -> Save.

---

## Part 3: Deploy Backend on Render

1. Go to [render.com](https://render.com) and log in.
2. Click **New +** -> select **Web Service**.
3. Connect your GitHub repository (`jugarrcrm`).
4. Configure the Web Service:

| Field | Value to Enter |
| :--- | :--- |
| **Name** | `jugarrcrm-api` (or any name you prefer) |
| **Region** | `Singapore` (Fastest for India) |
| **Branch** | `main` |
| **Root Directory** | *(Leave completely empty/blank)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install --include=dev && npm run build:backend` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

5. Scroll down to **Environment Variables** and add the following keys:

| Key | Value |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGODB_URI` | `mongodb+srv://dbmangoo71:ybGQKq4YDhuQDuCA@cluster0.z3vvxhb.mongodb.net/Jugarrcrm1?retryWrites=true&w=majority&tls=true` |
| `CLIENT_URL` | `*` *(Temporary until frontend is deployed, then put Vercel URL)* |
| `JWT_ACCESS_SECRET` | `jugarr_super_secure_access_secret_2026_prod_token` |
| `JWT_REFRESH_SECRET` | `jugarr_super_secure_refresh_secret_2026_prod_token` |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `COOKIE_SECURE` | `true` |

6. Click **Deploy Web Service**.
7. Render will build and deploy. Once finished, copy your Render URL:
   - Example: **`https://jugarrcrm-api.onrender.com`**

---

## Part 4: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New...** -> **Project**.
3. Import your `jugarrcrm` repository.
4. On the **Configure Project** page:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** -> Select **`apps/web`**
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Expand **Environment Variables** and add these two:

| Key | Value |
| :--- | :--- |
| `VITE_API_URL` | `https://jugarrcrm-api.onrender.com/api` *(Your Render URL with `/api`)* |
| `VITE_SOCKET_URL` | `https://jugarrcrm-api.onrender.com` *(Your Render URL without `/api`)* |

6. Click **Deploy**.
7. In ~1 minute, Vercel will give you your live URL (e.g. `https://jugarrcrm.vercel.app`).

---

## Part 5: Link Frontend to Backend (Final CORS Step)

1. Copy your Vercel URL (e.g. `https://jugarrcrm.vercel.app`).
2. Go back to your **Render Dashboard** -> click on **jugarrcrm-api** -> **Environment**.
3. Update `CLIENT_URL` from `*` to your actual Vercel URL:
   - `CLIENT_URL` = `https://jugarrcrm.vercel.app`
4. Click **Save Changes**. Render will automatically restart.

---

## Part 6: Log In as Super Admin

Open your Vercel URL (`https://jugarrcrm.vercel.app/login`):

- **Email:** `sagar@jugarr.in`
- **Password:** `sagarjugarr2026`
- **Role:** Super Admin

Everything is completely clean, fresh, and ready for live agency clients!
