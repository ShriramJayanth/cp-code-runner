const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const execCode = async (languageID, sourceCode, stdin, timeout) => {
    const forbiddenPatterns = [
        /require\(.+\)/g,         
        /process\./g,             
        /child_process/g,         
        /exec\(.+\)/g,            
        /while\s*\(true\)/g,      
        /for\s*\(\s*;\s*;\s*\)/g, 
        /__import__\(['"].+['"]\)/g, 
        /\bimport\s+(os|sys|subprocess|shlex|pickle|socket|threading|multiprocessing|pty|resource|pwd|grp)\b/g,
        /\bfrom\s+(os|sys|subprocess|shlex|pickle|socket|threading|multiprocessing|pty|resource|pwd|grp)\s+import\b/g
    ];
    

    for (const pattern of forbiddenPatterns) {
        if (pattern.test(sourceCode)) {
            return { stdout: '', stderr: 'Error: The submitted code contains forbidden constructs and cannot be executed.', status: 'failed' };
        }
    }

    const restrictedModules = ["fs", "os", "net", "child_process"];
    for (const module of restrictedModules) {
        const importPattern = new RegExp(`(import|require)\\s*\\(['"]${module}['"]\\)`, 'g');
        if (importPattern.test(sourceCode)) {
            return { stdout: '', stderr: `Error: Usage of restricted module '${module}' is not allowed.`, status: 'failed' };
        }
    }

    const maxCodeLength = 10000;
    if (sourceCode.length > maxCodeLength) {
        return { stdout: '', stderr: 'Error: The submitted code exceeds the maximum allowed length.', status: 'failed' };
    }

    let tempFilePathCode = "";
    let objectCodePath = "";

    if (languageID === 1) {
        tempFilePathCode = path.join(__dirname, 'Program.py');
    } else if (languageID === 2) {
        tempFilePathCode = path.join(__dirname, 'Program.cpp');
        objectCodePath = path.join(__dirname, 'Program');
    } else if (languageID === 3) {
        tempFilePathCode = path.join(__dirname, 'Program.java');
        objectCodePath = path.join(__dirname, 'Program.class');
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
        } else if (languageID === 3) {
            execSync(`javac ${tempFilePathCode}`);
            process = spawn("java", ["Program"], { stdio: ["pipe", "pipe", "pipe"] });
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
