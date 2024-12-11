const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Executes source code in a specific language with provided stdin and timeout.
 * @param {number} languageID - The language ID (1 for Python, 2 for C++)
 * @param {string} sourceCode - The source code to execute
 * @param {string} stdin - The standard input for the program
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<{ stdout: string, stderr: string, status: 'completed' | 'queued' | 'failed' | 'timeout' }>}
 */
const execCode = async (languageID, sourceCode, stdin, timeout) => {
    let tempFilePathCode = "";
    let objectCodePath = "";

    if (languageID === 1) {
        tempFilePathCode = path.join(__dirname, 'Program.py');
    } else if (languageID === 2) {
        tempFilePathCode = path.join(__dirname, 'Program.cpp');
        objectCodePath = path.join(__dirname, 'Program');
    }

    let result = {
        stdout: '',
        stderr: '',
        status: 'queued'
    };

    let process;

    try {
        fs.writeFileSync(tempFilePathCode, sourceCode);

        if (languageID === 1) {
            process = spawn("python3", [tempFilePathCode], { stdio: ["pipe", "pipe", "pipe"] });
        } else if (languageID === 2) {
            execSync(`g++ -o ${objectCodePath} ${tempFilePathCode}`);
            process = spawn(objectCodePath, [], { stdio: ['pipe', 'pipe', 'pipe'] });
        }

        if (process) {
            process.stdin.write(stdin);
            process.stdin.end();

            const timer = setTimeout(() => {
                if (process) {
                    process.kill('SIGTERM');
                    result.stderr = 'Time limit exceeded';
                    result.stdout = "";
                    result.status = 'timeout';

                    process.stdout.destroy();
                    process.stderr.destroy();
                }
            }, timeout);

            process.stdout.on("data", (data) => {
                result.stdout += data.toString();
            });

            process.stderr.on("data", (data) => {
                result.stderr += data.toString();
            });

            await new Promise((resolve, reject) => {
                process.on("close", (code) => {
                    clearTimeout(timer);
                    result.status = code === 0 ? "completed" : "failed";
                    resolve();
                });

                process.on('error', (err) => {
                    clearTimeout(timer);
                    result.stderr += err.message;
                    result.status = 'failed';
                    reject(err);
                });
            });
        } else {
            result.status = 'failed';
            result.stderr = 'Failed to initialize child process.';
        }
    } catch (err) {
        result.stderr = `Error: ${err.message}`;
        result.status = "failed";
    } finally {
        try {
            fs.unlinkSync(tempFilePathCode);
            if (objectCodePath && fs.existsSync(objectCodePath)) {
                fs.unlinkSync(objectCodePath);
            }
        } catch (cleanupErr) {
            console.error('Failed to delete temporary files:', cleanupErr);
        }
    }

    return result;
};

module.exports = { execCode };


// const pythonCode = `
// for i in range(1000000):
//     for j in range(100000000):
//         print(i)
// `;

// const cppCode = `
// #include <bits/stdc++.h>
// using namespace std;

// int main() {
//     string message;
//     getline(cin,message);
//     cout<<message<<endl;
//     return 0;
// }
// `;

// const stdin = 'Kaizoku ou ni naru no otoka da"';

// execCode(1, pythonCode, stdin,5000).then((result) => {
//     console.log('Python result:', result);
// });

// execCode(2, cppCode, stdin,5000).then((result) => {
//     console.log('C++ result:', result);
// });
