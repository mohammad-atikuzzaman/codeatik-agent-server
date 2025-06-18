# CodeAtik Agent

**CodeAtik Agent** is an AI-powered web app that allows users to generate fully functional websites using **HTML**, **CSS**, **JavaScript**, and **Tailwind CSS**. It features role-based authentication, site preview, and downloadable ZIP packages for generated code. Admins can manage users and generated content efficiently.

🔗 **Live Site**: [https://codeatikagent.netlify.app](https://codeatikagent.netlify.app)

---

## 🚀 Features

- 🧠 AI-powered website generation
- 🔐 Role-based authentication system
- 👤 User Dashboard to preview and download generated sites
- ⬇️ ZIP download functionality for generated sites
- 🛠️ Admin Dashboard:
  - Promote/demote users to/from admin
  - View all users and generated sites
- 📈 Site generation statistics using Recharts

---

## 🛠️ Tech Stack

### Frontend:
- React JS
- Redux
- React Router DOM
- Tailwind CSS
- Recharts
- Other essential npm packages

### Backend:
- Node.js
- Express.js
- Passport.js
- JWT
- Nodemailer
- adm-zip
- MongoDB
- Deepseek AI Model
- Other useful packages

---

# For run the project
You need to clone the projects
## Backend repository
https://github.com/mohammad-atikuzzaman/codeatik-agent-server

## Frontend repository
https://github.com/mohammad-atikuzzaman/code-atik-frontend
### using
```
git clone github-repository-link
```
then run the command 
```
npm install
```

## 🔧 Environment Variables need to run the project

### Frontend `.env.local`
```env
VITE_API_URL=your-backend-url

```

### Backend `.env`
```
PORT=your-port

OPENROUTER_API_KEY=your-api-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-jwt-secret

MONGO_URI=your-mongodb-uri

API_URL=your-api-url
GOOGLE_CALLBACK_URL=your-google-callback-url
CLIENT_URL=your-frontend-url

EMAIL_USER=your-email-address
EMAIL_PASS=your-email-password
```