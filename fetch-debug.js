const fs = require('fs');

async function fetchDebug() {
    try {
        const res = await fetch('http://localhost:3000/api/setup-admin');
        const data = await res.json();
        fs.writeFileSync('debug_output.json', JSON.stringify(data, null, 2));
        console.log('Saved debug_output.json');
    } catch (err) {
        console.error('Error fetching debug info:', err);
    }
}

fetchDebug();
