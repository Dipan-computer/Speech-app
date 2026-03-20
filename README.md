###  AI Speech-to-Text Web App (MERN Stack)

A full-stack AI-powered speech-to-text application that converts audio files and live microphone input into text using Deepgram API. Built with MERN stack and deployed on Netlify & Render.


### Live Demo

*   Frontend: https://willowy-clafoutis-be20ef.netlify.app
*   Backend: https://speech-app-8134.onrender.com



### Features

*  Real-time voice recording
*  Audio file upload (mp3, wav, m4a, webm)
*  AI transcription using Deepgram
*  Transcription history storage
*  Delete history feature
*   Copy transcription to clipboard
*   Modern responsive UI
*   Fully deployed (Netlify + Render)


 Tech Stack

###  Frontend

* React (Vite)
* Axios
* CSS (Custom UI)

### Backend

* Node.js
* Express.js
* MongoDB Atlas
* Multer (file upload)
* Deepgram API



Project Structure

Speech-Project/
├── backend/
│   ├── server.js
│   ├── package.json

├── speech-app/
│   ├── src/
│   ├── index.html
│   ├── package.json

└── README.md



##  Installation (Local Setup)

### 1. Clone repository

git clone https://github.com/YOUR_USERNAME/Speech-app.git
cd Speech-app



### 2. Backend setup

cd backend
npm install

Create `.env` file:

PORT=5000
DEEPGRAM_API_KEY=your_api_key
MONGO_URI=your_mongodb_uri

### Run backend:

node server.js



### 3. Frontend setup

cd speech-app
npm install
npm run dev



## Deployment

* Frontend deployed on Netlify
* Backend deployed on Render

---

## Environment Variables

| Variable         | Description               |
| ---------------- | ------------------------- |
| DEEPGRAM_API_KEY | Deepgram API key          |
| MONGO_URI        | MongoDB connection string |
| PORT             | Server port               |



## 📸 Screenshots

(Add screenshots here later)



## Author

**Dipan Acharjee**
Computer Science Engineer


##  Future Improvements

*  User authentication (login/signup)
*  Personal transcription history
*  Multi-language transcription
*  Download transcription as file
