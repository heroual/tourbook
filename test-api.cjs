const fs = require('fs');
const https = require('https');

// Read API Key
let apiKey = '';
try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const match = envFile.match(/GEMINI_API_KEY=(.+)/);
    if (match) apiKey = match[1].trim();
} catch (e) {
    console.error("Could not read .env.local");
    process.exit(1);
}

if (!apiKey) {
    console.error("No API Key found");
    process.exit(1);
}

console.log("Using API Key: " + apiKey.substring(0, 5) + "...");

const data = JSON.stringify({
    contents: [{
        parts: [{
            text: "Extract reservation: Reference GYG123, Client John Doe, Price 100 EUR."
        }]
    }],
    generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
    }
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('BODY:', body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
