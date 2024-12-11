# cp-code-runner

`cp-code-runner` is a Node.js module that enables the execution of code in different programming languages, such as Python and C++. It supports the execution of source code with custom inputs and a timeout mechanism for enhanced control.

## Installation

To install the package, use:

```bash
npm install cp-code-runner
```

## Features

- Execute Python and C++ code dynamically.
- Pass custom standard input (stdin) to the program.
- Handle execution timeouts to prevent infinite loops.
- Provides detailed results, including stdout, stderr, and execution status.

## Usage

### Importing the Module

```javascript
const { execCode } = require('cp-code-runner');
```

### Function Signature

```typescript
execCode(
  languageID: number,          // 1 for Python, 2 for C++
  sourceCode: string,          // Source code to execute
  stdin: string,               // Standard input for the program
  timeout: number              // Timeout in milliseconds
): Promise<{
  stdout: string,              // Standard output of the program
  stderr: string,              // Standard error output
  status: 'completed' | 'queued' | 'failed' | 'timeout' // Execution status
}>
```

### Example: Running Python Code

```javascript
const { execCode } = require('cp-code-runner');

(async () => {
  const pythonCode = 'print("Hello, World!")';
  const result = await execCode(1, pythonCode, '', 5000);
  console.log(result);
})();
```

### Example: Running C++ Code

```javascript
const { execCode } = require('cp-code-runner');

(async () => {
  const cppCode = `
  #include <iostream>
  using namespace std;

  int main() {
      string message;
      getline(cin, message);
      cout << "Hello, " << message << "!" << endl;
      return 0;
  }
  `;
  const stdin = 'World';
  const result = await execCode(2, cppCode, stdin, 5000);
  console.log(result);
})();
```

## Result Object

The `execCode` function returns a Promise that resolves with an object containing the following fields:

- **`stdout`**: The standard output from the executed code.
- **`stderr`**: The standard error output from the executed code.
- **`status`**:
  - `completed`: The code executed successfully without errors.
  - `queued`: The execution is queued (not applicable in this implementation).
  - `failed`: The execution failed due to an error.
  - `timeout`: The execution was terminated because it exceeded the specified timeout.

### Example Result

```json
{
  "stdout": "Hello, World!",
  "stderr": "",
  "status": "completed"
}
```

## Error Handling

If an error occurs during execution (e.g., compilation error for C++ or syntax error for Python), the `stderr` field will contain the error details, and the `status` will be set to `failed`.

### Example Error Result

```json
{
  "stdout": "",
  "stderr": "Program.cpp: In function 'int main()':\nProgram.cpp:3:12: error: expected ';' before '}' token\n}",
  "status": "failed"
}
```

## Cleanup

The module automatically cleans up temporary files created during execution, ensuring no residual files are left behind.

## License

WILL BE UPDATED SOON

---

Feel free to raise issues or contribute to this repository to add more language support or enhance functionality!

