import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query, where, updateDoc, doc } from 'firebase/firestore';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Firebase Config
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const resend = new Resend('re_ap1QB3AB_3MA9XyyK5yknjJLt99yJJ9fW');

async function startServer() {
  const expressApp = express();
  const PORT = 3000;

  expressApp.use(express.json());

  // Listen to the 'mail' collection for new emails to send (Trigger Email pattern)
  console.log('[SERVER] Starting Email Trigger listener...');
  const mailQuery = query(collection(db, 'mail'), where('status.state', '==', 'PENDING'));
  
  onSnapshot(mailQuery, (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const mailDoc = change.doc;
        const mailData = mailDoc.data();
        
        console.log(`[SERVER] Processing email to: ${mailData.to}`);
        
        try {
          // Update status to PROCESSING
          await updateDoc(doc(db, 'mail', mailDoc.id), {
            'status.state': 'PROCESSING',
            'status.startTime': new Date().toISOString()
          });

          const { data, error } = await resend.emails.send({
            from: 'VPW Stadium <onboarding@resend.dev>',
            to: [mailData.to],
            subject: mailData.message.subject,
            html: mailData.message.html,
          });

          if (error) {
            throw error;
          }

          // Update status to SUCCESS
          await updateDoc(doc(db, 'mail', mailDoc.id), {
            'status.state': 'SUCCESS',
            'status.completeTime': new Date().toISOString(),
            'status.messageId': data?.id
          });
          
          console.log(`[SERVER] Email sent successfully to: ${mailData.to}`);
        } catch (err: any) {
          console.error(`[SERVER] Failed to send email to ${mailData.to}:`, err);
          await updateDoc(doc(db, 'mail', mailDoc.id), {
            'status.state': 'ERROR',
            'status.error': err.message || String(err)
          });
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    expressApp.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    expressApp.use(express.static(distPath));
    expressApp.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  expressApp.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
