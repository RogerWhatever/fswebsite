const { exec } = require('child_process');
const os = require('os');

function killProcessOnPort(port) {
    const platform = os.platform();
    let command;

    if (platform === 'win32') {
        // Windows
        command = `netstat -ano | findstr :${port}`;
    } else {
        // Unix/Linux/Mac
        command = `lsof -ti:${port}`;
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log('No process found on port', port);
            return;
        }

        if (platform === 'win32') {
            // Extract PID from Windows netstat output
            const lines = stdout.split('\n');
            const pids = [];
            lines.forEach(line => {
                const match = line.match(/\s+(\d+)\s*$/);
                if (match) {
                    pids.push(match[1]);
                }
            });

            pids.forEach(pid => {
                exec(`taskkill /PID ${pid} /F`, (killError) => {
                    if (!killError) {
                        console.log(`Killed process ${pid} on port ${port}`);
                    }
                });
            });
        } else {
            // Unix/Linux/Mac
            const pids = stdout.split('\n').filter(pid => pid.trim());
            pids.forEach(pid => {
                exec(`kill -9 ${pid}`, (killError) => {
                    if (!killError) {
                        console.log(`Killed process ${pid} on port ${port}`);
                    }
                });
            });
        }
    });
}

// Kill any process on port 3000
killProcessOnPort(3000);

console.log('Attempting to stop any server running on port 3000...');
setTimeout(() => {
    console.log('Done. You can now start the server with "npm start"');
}, 2000);
