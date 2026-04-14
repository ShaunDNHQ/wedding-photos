import { google } from "googleapis";
import readline from "node:readline";
import "dotenv/config";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3000/oauth2callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local");
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = ["https://www.googleapis.com/auth/drive.file"];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: scopes,
});

console.log("\nOpen this URL in your browser:\n");
console.log(authUrl);
console.log("\nAfter approving, paste the full redirected URL below.\n");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Redirected URL: ", async (redirectedUrl) => {
  try {
    const url = new URL(redirectedUrl);
    const code = url.searchParams.get("code");

    if (!code) {
      throw new Error("No code found in redirected URL.");
    }

    const { tokens } = await oauth2Client.getToken(code);
    console.log("\nYour refresh token:\n");
    console.log(tokens.refresh_token || "No refresh token returned.");
  } catch (error) {
    console.error("\nFailed to get token:\n", error);
  } finally {
    rl.close();
  }
});
