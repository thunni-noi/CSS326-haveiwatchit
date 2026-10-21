# CSS326-haveiwatchit

## Setup
```
// Set up backend
cd backend
npm install

// Set up frontend
cd frontend
npm install
```

Set up database by running file in `db/db_setup.sql`


## How to run
Place an ".env" file into /backend/ with following format (Replace [] with your config)
```
PORT=[port for backend : Default is 5000]
DB_HOST=[sql host location : Default is localhost]
DB_PORT=[sql port: Default is 3306]
DB_NAME=[database name : haveiwatchit]
DB_USER=[sql username: Default is root]
DB_PASSWORD=[sql password]
JWT_SECRET=[will be given]
CLIENT_URL=http://localhost:5173
```

Backend is run via code below, Should be hosted on http://localhost:[your port : 5000]/

```
cd backend
node servert.js
```

Front end is run via code below, Should be hosted on http://localhost:5173/
```
cd frontend
npm run dev
```
Both need to run simutanously!

## Explanation

### Backend
Authentication API controlled by auth.js (both in controller and routes)
Middleware are used to check for authentication
When successfulling pass authentication API, `auth_token` will be passed back to user and saved into user's cookie for later use
`middleware/auth.js` will check for cookie and validate user, if passed then it'll allow user to go through the website

### Frontend
Frontend is built using **React** with **Tailwind CSS**
Relevant files includes
- `frontend/src/pages`
- `frontend/src/components`
- `frontend/src/App.jsx`

Authentication is done via `App.jsx` which requests `api/auth/me` on every page and save React state accordingly.


