1. How to Access and Use the GUI
Inside AI Studio (Live Preview):
The application GUI is already running live in the preview pane on the right side of your screen.
To open it in a full browser tab, click the "Open in new tab" / pop-out icon at the top right of the preview pane.
On Your Local Machine (After Downloading):
Open your terminal in the project root folder.
Install dependencies:
code
```Bash
npm install
```
Start the development server:
code
```Bash
npm run dev
```
Open your browser and navigate to 
```
http://localhost:3000.
```

The short answer is: The code itself is safe to publish, but the actions the tool performs are considered "suspicious" (sus) by target websites, and it is explicitly designed to expose sensitive security information.
Here is a breakdown of what you need to know before using or sharing this tool:
1. Does the network activity look "sus" to the target?
Yes. Your application performs automated reconnaissance and port scanning.
When you scan a domain, you are checking for open database ports (3306, 5432), remote management ports (3389, 22), and analyzing their server responses.
To a target company's Firewall, Cloudflare, or Security Operations Center (SOC), this looks exactly like the reconnaissance phase of a cyberattack.
If you scan websites you don't own, their security systems will likely flag your server's IP address as malicious, and you could be blocked or reported for abuse.
2. Does it "leak" important things about a domain?
Yes, by design. The entire purpose of this tool is to "leak" or uncover a target domain's security posture to whoever is running the scan.
It exposes which technologies the website is running (Tech Stack fingerprinting).
It reveals misconfigurations (missing security headers).
It flags exposed infrastructure (open database or FTP ports) that hackers typically look for.
It finds "dangling subdomains" which can be highly sensitive and vulnerable to takeover.
3. Is it safe to publish on GitHub?
Yes. Publishing the source code on GitHub is completely safe and normal. It is essentially a custom, educational version of popular cybersecurity tools like Nmap or SSL Labs. Since we verified you have no hardcoded passwords or API keys in the files, your personal data is safe.
⚠️ Important Ethical & Deployment Warnings
Rules of Engagement: You should only scan domains that you own, or domains where you have explicit written permission to perform security testing (like a Bug Bounty program).
Public Deployment Risks: If you deploy this app publicly (e.g., sharing the hosted URL on Reddit or Twitter) and leave it open for anyone to use without a login, malicious users could use your hosted app to scan and attack other people's websites. If that happens, the hosting provider (Google Cloud) will see the malicious traffic coming from your app, and they may suspend your account for violating their Terms of Service regarding network abuse.
Recommendation: If you deploy this to a live URL, put a password/login screen in front of it so only you can trigger the scans, and only point it at your own infrastructure!
