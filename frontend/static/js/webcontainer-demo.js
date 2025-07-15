// WebContainer Demo Implementation
// This file demonstrates WebContainer API usage for PDF2MD integration

// Using the latest known stable version of WebContainer API.
// The previously suggested 1.6.2 was not found, reverting to 1.6.1.
// Check https://webcontainers.io/ for potential newer versions if issues persist.
import { WebContainer } from 'https://cdn.jsdelivr.net/npm/@webcontainer/api@1.6.1/+esm';


class WebContainerDemo {
    constructor() {
        this.webContainer = null;
        this.containerReady = false;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Initialize container
        document.getElementById('initBtn').addEventListener('click', () => this.initializeWebContainer());
        document.getElementById('teardownBtn').addEventListener('click', () => this.teardownContainer());

        // Basic commands
        document.getElementById('echoBtn').addEventListener('click', () => this.runCommand('echo', ['Hello World']));
        document.getElementById('lsBtn').addEventListener('click', () => this.runCommand('ls', ['-la']));
        document.getElementById('nodeVersionBtn').addEventListener('click', () => this.runCommand('node', ['--version']));
        document.getElementById('npmVersionBtn').addEventListener('click', () => this.runCommand('npm', ['--version']));

        // Custom commands
        document.getElementById('customCommand').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.runCustomCommand();
            }
        });
        document.getElementById('runCustomBtn').addEventListener('click', () => this.runCustomCommand());

        // File operations
        document.getElementById('createFileBtn').addEventListener('click', () => this.createTestFile());
        document.getElementById('readFileBtn').addEventListener('click', () => this.readTestFile());
        document.getElementById('createPackageBtn').addEventListener('click', () => this.createPackageJson());
        document.getElementById('installDepsBtn').addEventListener('click', () => this.installDependencies());

        // PDF2MD integration
        document.getElementById('setupPdf2MdBtn').addEventListener('click', () => this.setupPdf2MdEnvironment());
        document.getElementById('convertPdfBtn').addEventListener('click', () => this.convertPdf());

        // System info
        document.getElementById('sysInfoBtn').addEventListener('click', () => this.getSystemInfo());
    }

    async initializeWebContainer() {
        const btn = document.getElementById('initBtn');
        const status = document.getElementById('initStatus');
        
        try {
            btn.disabled = true;
            this.showStatus('initStatus', 'Initializing WebContainer...', 'loading');
            
            // Boot the WebContainer
            this.webContainer = await WebContainer.boot();
            this.containerReady = true;
            
            // Enable all buttons
            this.enableAllButtons();
            
            this.showStatus('initStatus', 'WebContainer initialized successfully!', 'success');
            this.appendOutput('commandOutput', 'WebContainer ready for commands...\n');
            
            // Show basic container info
            await this.showContainerInfo();
            
        } catch (error) {
            this.showStatus('initStatus', `Failed to initialize: ${error.message}`, 'error');
            console.error('WebContainer initialization failed:', error); 
        }
    }

    async teardownContainer() {
        if (this.webContainer) {
            await this.webContainer.teardown();
            this.webContainer = null;
            this.containerReady = false;
            
            this.disableAllButtons();
            this.showStatus('initStatus', 'Container torn down', 'error');
            this.appendOutput('commandOutput', 'Container has been torn down.\n');
        }
    }

    async showContainerInfo() {
        const info = `
=== WebContainer Information ===
Status: Running
Runtime: Node.js in Browser
File System: In-memory
Current Directory: ${await this.getCurrentDirectory()}
================================
`;
        this.appendOutput('commandOutput', info);
    }

    async getCurrentDirectory() {
        try {
            const process = await this.webContainer.spawn('pwd');
            const output = await this.readProcessOutput(process);
            return output.trim();
        } catch {
            return '/';
        }
    }

    async runCommand(command, args = []) {
        if (!this.containerReady) {
            this.appendOutput('commandOutput', 'Container not ready!\n');
            return;
        }

        try {
            const fullCommand = `${command} ${args.join(' ')}`;
            this.appendOutput('commandOutput', `$ ${fullCommand}\n`);
            
            const process = await this.webContainer.spawn(command, args);
            const output = await this.readProcessOutput(process); 
            
            this.appendOutput('commandOutput', output + '\n');
            
        } catch (error) {
            this.appendOutput('commandOutput', `Error: ${error.message}\n`);
            console.error(`Error running command '${command}':`, error);
        }
    }

    async runCustomCommand() {
        const input = document.getElementById('customCommand');
        const command = input.value.trim();
        
        if (!command) return;
        
        const parts = command.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);
        
        await this.runCommand(cmd, args);
        input.value = '';
    }

    async readProcessOutput(process) {
        const reader = process.output.getReader();
        let output = '';
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                if (typeof value === 'string') {
                    output += value;
                } else if (value instanceof Uint8Array) {
                    try {
                        output += new TextDecoder().decode(value);
                    } catch (decodeError) {
                        const debugInfo = `\n[DEBUG: TextDecoder error on Uint8Array. Error: ${decodeError.message}. Length: ${value.byteLength}]\n`;
                        console.error("DEBUG: TextDecoder error on Uint8Array:", decodeError, value);
                        this.appendOutput('commandOutput', debugInfo);
                    }
                } else {
                    const debugInfo = `\n[DEBUG: readProcessOutput detected unexpected 'value'. Type: ${typeof value}. Value: ${String(value)}]\n`;
                    console.error("DEBUG: readProcessOutput unexpected value:", value);
                    this.appendOutput('commandOutput', debugInfo);
                }
            }
        } finally {
            reader.releaseLock();
        }
        
        await process.exit;
        return output;
    }

    async createTestFile() {
        if (!this.containerReady) {
            this.appendOutput('fileOutput', 'Container not ready!\n');
            return;
        }

        try {
            const content = `Hello from WebContainer!
This is a test file created at: ${new Date().toISOString()}
Container can read and write files in memory.`;

            await this.webContainer.fs.writeFile('/test.txt', content);
            this.appendOutput('fileOutput', 'Created test.txt successfully!\n');
            
        } catch (error) {
            this.appendOutput('fileOutput', `Error creating file: ${error.message}\n`);
        }
    }

    async readTestFile() {
        if (!this.containerReady) {
            this.appendOutput('fileOutput', 'Container not ready!\n');
            return;
        }

        try {
            const content = await this.webContainer.fs.readFile('/test.txt', 'utf-8');
            this.appendOutput('fileOutput', `Content of test.txt:\n${content}\n\n`);
            
        } catch (error) {
            this.appendOutput('fileOutput', `Error reading file: ${error.message}\n`);
        }
    }

    async createPackageJson() {
        if (!this.containerReady) {
            this.appendOutput('fileOutput', 'Container not ready!\n');
            return;
        }

        const packageJson = {
            "name": "pdf2md-container",
            "version": "1.0.0",
            //"type": "module",
            "dependencies": {
                "@opendocsg/pdf2md": "latest"
            }
        };

        try {
            await this.webContainer.fs.writeFile('/package.json', JSON.stringify(packageJson, null, 2));
            this.appendOutput('fileOutput', 'Created package.json for PDF2MD!\n');
            
            // Also show the content
            const content = await this.webContainer.fs.readFile('/package.json', 'utf-8');
            this.appendOutput('fileOutput', `Package.json content:\n${content}\n\n`);
            
        } catch (error) {
            this.appendOutput('fileOutput', `Error creating package.json: ${error.message}\n`);
        }
    }

    async installDependencies() {
        if (!this.containerReady) {
            this.appendOutput('fileOutput', 'Container not ready!\n');
            return;
        }

        try {
            this.appendOutput('fileOutput', 'Installing dependencies...\n');
            
            const process = await this.webContainer.spawn('npm', ['install']);
            
            const reader = process.output.getReader();
            
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    if (typeof value === 'string') {
                        this.appendOutput('fileOutput', value);
                    } else if (value instanceof Uint8Array) {
                        try {
                            const output = new TextDecoder().decode(value);
                            this.appendOutput('fileOutput', output);
                        } catch (decodeError) {
                            const debugInfo = `\n[DEBUG: TextDecoder error on npm output (Uint8Array). Error: ${decodeError.message}. Length: ${value.byteLength}]\n`;
                            console.error("DEBUG: TextDecoder error on npm output (Uint8Array):", decodeError, value);
                            this.appendOutput('fileOutput', debugInfo);
                        }
                    } else {
                        const debugInfo = `\n[DEBUG: npm install detected unexpected 'value'. Type: ${typeof value}. Value: ${String(value)}]\n`;
                        console.error("DEBUG: npm install unexpected value:", value);
                        this.appendOutput('fileOutput', debugInfo);
                    }
                }
            } finally {
                reader.releaseLock();
            }
            
            await process.exit;
            this.appendOutput('fileOutput', '\nDependencies installed!\n');
            
        } catch (error) {
            this.appendOutput('fileOutput', `Error installing dependencies: ${error.message}\n`);
            console.error("Error in installDependencies outer catch:", error); 
        }
    }

    async setupPdf2MdEnvironment() {
        if (!this.containerReady) {
            this.appendOutput('pdfOutput', 'Container not ready!\n');
            return;
        }

        try {
            this.appendOutput('pdfOutput', 'Setting up PDF2MD environment...\n');
            
            // Create package.json if it doesn't exist
            await this.createPackageJson();
            
            // Install dependencies
            this.appendOutput('pdfOutput', 'Installing @opendocsg/pdf2md...\n');
            const process = await this.webContainer.spawn('npm', ['install']);
            await process.exit; // Wait for npm install to finish
            
            // Create a conversion script that uses the actual PDF2MD library
            const conversionScript = `
const fs = require('fs');
const path = require('path');

async function convertPdf() {
    try {
        // Import the PDF2MD library
        const { pdf2md } = await import('@opendocsg/pdf2md');
        
        console.log('PDF2MD library loaded successfully');
        console.log('Input file: /input.pdf');
        console.log('Output file: /output.md');
        
        // Read the PDF file as buffer
        const pdfBuffer = fs.readFileSync('/input.pdf');
        console.log(\`Read PDF buffer: \${pdfBuffer.length} bytes\`);
        
        // Convert PDF to markdown using the actual library
        console.log('Starting PDF to markdown conversion...');
        const markdown = await pdf2md(pdfBuffer);
        
        // Write the converted markdown to output file
        fs.writeFileSync('/output.md', markdown);
        console.log('Conversion completed successfully');
        console.log('CONVERSION_COMPLETE');
        
    } catch (error) {
        console.error('Conversion error:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Write error info to output file for debugging
        const errorOutput = \`# PDF Conversion Error

An error occurred during PDF to Markdown conversion:

**Error:** \${error.message}

**Stack Trace:**
\\\`\\\`\\\`
\${error.stack}
\\\`\\\`\\\`

Please check the console for more details.
\`;
        fs.writeFileSync('/output.md', errorOutput);
    }
}

// Run the conversion
convertPdf();
`;

            await this.webContainer.fs.writeFile('/convert.js', conversionScript);
            this.appendOutput('pdfOutput', 'Created /convert.js\n'); 
            
            // Verify file exists and its content after writing
            try {
                const lsCheck = await this.webContainer.spawn('ls', ['-la', '/']);
                const lsOutput = await this.readProcessOutput(lsCheck);
                this.appendOutput('pdfOutput', `\nls -la / output:\n${lsOutput}\n`); 
                if (!lsOutput.includes('convert.js')) {
                    this.appendOutput('pdfOutput', 'ERROR: convert.js not found in root after creation attempt!\n');
                } else {
                    this.appendOutput('pdfOutput', 'SUCCESS: convert.js verified in root.\n'); 
                }

                const catCheck = await this.webContainer.spawn('cat', ['/convert.js']);
                const catOutput = await this.readProcessOutput(catCheck);
                this.appendOutput('pdfOutput', `\nContent of /convert.js:\n${catOutput.substring(0, 200)}...\n`); 
            } catch (checkError) {
                this.appendOutput('pdfOutput', `Error verifying /convert.js: ${checkError.message}\n`); 
            }


            this.appendOutput('pdfOutput', 'PDF2MD environment setup complete!\n');
            document.getElementById('convertPdfBtn').disabled = false;
            
        } catch (error) {
            this.appendOutput('pdfOutput', `Error setting up PDF2MD: ${error.message}\n`);
            console.error("Error setting up PDF2MD outer catch:", error); 
        }
    }

    // Helper method to verify file existence
    async verifyFileExists(filePath) {
        try {
            const content = await this.webContainer.fs.readFile(filePath, 'utf-8');
            this.appendOutput('pdfOutput', `✓ Verified: ${filePath} exists (${content.length} characters)\n`);
            return true;
        } catch (error) {
            this.appendOutput('pdfOutput', `✗ Error: ${filePath} not found - ${error.message}\n`);
            return false;
        }
    }

    async convertPdf() {
        const fileInput = document.getElementById('pdfFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.appendOutput('pdfOutput', 'Please select a PDF file first!\n');
            return;
        }

        if (!this.containerReady) {
            this.appendOutput('pdfOutput', 'Container not ready!\n');
            return;
        }

        let outputAccumulated = ''; // To collect all output for the CONVERSION_COMPLETE check

        try {
            this.appendOutput('pdfOutput', `Converting: ${file.name}\n`);
            this.showProgress(0);
            
            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);
            
            // Write PDF to container
            await this.webContainer.fs.writeFile('/input.pdf', buffer);
            this.appendOutput('pdfOutput', 'Created /input.pdf\n'); 
            this.showProgress(30);
            
            // Verify /convert.js exists before running - FIXED: Using helper method
            const convertJsExists = await this.verifyFileExists('/convert.js');
            if (!convertJsExists) {
                throw new Error('Conversion failed: /convert.js not found.');
            }

            // Run conversion script, explicitly setting the current working directory to root
            this.appendOutput('pdfOutput', 'Running conversion script...\n');
            const process = await this.webContainer.spawn('node', ['/convert.js'], { cwd: '/' });
            
            const reader = process.output.getReader();
            
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    if (typeof value === 'string') {
                        this.appendOutput('pdfOutput', value);
                        outputAccumulated += value; // Accumulate string output
                    } else if (value instanceof Uint8Array) {
                        try {
                            const outputChunk = new TextDecoder().decode(value);
                            this.appendOutput('pdfOutput', outputChunk);
                            outputAccumulated += outputChunk; // Accumulate decoded output
                        } catch (decodeError) {
                            const debugInfo = `\n[DEBUG: TextDecoder error on PDF conversion script output (Uint8Array). Error: ${decodeError.message}]\n`;
                            console.error("DEBUG: PDF conversion script output decode error:", decodeError, value);
                            this.appendOutput('pdfOutput', debugInfo);
                        }
                    } else {
                        const debugInfo = `\n[DEBUG: PDF conversion script output detected unexpected 'value'. Type: ${typeof value}. Value: ${String(value)}]\n`;
                        console.error("DEBUG: PDF conversion script output unexpected value:", value);
                        this.appendOutput('pdfOutput', debugInfo);
                    }
                }
            } finally {
                reader.releaseLock();
            }
            
            await process.exit;
            this.showProgress(100);
            
            // Check for CONVERSION_COMPLETE against accumulated output
            if (outputAccumulated.includes('CONVERSION_COMPLETE')) {
                this.appendOutput('pdfOutput', '\nConversion script reported completion.\n');
            } else {
                this.appendOutput('pdfOutput', '\nWarning: Conversion script did NOT report completion string. Output:\n' + outputAccumulated + '\n');
            }

            // Read converted markdown
            const markdown = await this.webContainer.fs.readFile('/output.md', 'utf-8');
            this.appendOutput('pdfOutput', '\n=== CONVERTED MARKDOWN ===\n');
            this.appendOutput('pdfOutput', markdown);
            this.appendOutput('pdfOutput', '\n=== END CONVERSION ===\n');
            
        } catch (error) {
            this.appendOutput('pdfOutput', `Conversion error: ${error.message}\n`);
            console.error("Error in convertPdf outer catch:", error); 
        }
    }

    async getSystemInfo() {
        if (!this.containerReady) {
            this.appendOutput('sysOutput', 'Container not ready!\n');
            return;
        }

        try {
            const commands = [
                ['uname', ['-a']], // This command is not found in WebContainer's default jsh
                ['node', ['--version']],
                ['npm', ['--version']],
                ['ls', ['-la', '/']]
            ];

            this.appendOutput('sysOutput', '=== SYSTEM INFORMATION ===\n');
            
            for (const [cmd, args] of commands) {
                try {
                    const process = await this.webContainer.spawn(cmd, args);
                    const output = await this.readProcessOutput(process); 
                    this.appendOutput('sysOutput', `${cmd} ${args.join(' ')}:\n${output}\n`); // Added newline for better formatting
                } catch (error) {
                    this.appendOutput('sysOutput', `${cmd}: ${error.message}\n`);
                    console.error(`Error getting system info for command '${cmd}':`, error);
                }
            }
            
            this.appendOutput('sysOutput', '=== END SYSTEM INFO ===\n');
            
        } catch (error) {
            this.appendOutput('sysOutput', `Error getting system info: ${error.message}\n`);
            console.error("Error in getSystemInfo outer catch:", error); 
        }
    }

    showProgress(percent) {
        const progressBar = document.querySelector('.progress-bar');
        const progressFill = document.getElementById('progressFill');
        
        progressBar.style.display = 'block';
        progressFill.style.width = `${percent}%`;
        
        if (percent >= 100) {
            setTimeout(() => {
                progressBar.style.display = 'none';
            }, 2000);
        }
    }

    appendOutput(elementId, text) {
        const output = document.getElementById(elementId);
        output.textContent += text;
        output.scrollTop = output.scrollHeight;
    }

    showStatus(elementId, message, type) {
        const status = document.getElementById(elementId);
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
    }

    enableAllButtons() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.id !== 'initBtn') {
                btn.disabled = false;
            }
        });
        
        // Enable inputs
        document.getElementById('customCommand').disabled = false;
        document.getElementById('pdfFile').disabled = false;
        
        // Disable init button and enable teardown
        document.getElementById('initBtn').disabled = true;
        document.getElementById('teardownBtn').disabled = false;
    }

    disableAllButtons() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.id !== 'initBtn') {
                btn.disabled = true;
            }
        });
        
        // Disable inputs
        document.getElementById('customCommand').disabled = true;
        document.getElementById('pdfFile').disabled = true;
        
        // Enable init button and disable teardown
        document.getElementById('initBtn').disabled = false;
        document.getElementById('teardownBtn').disabled = true;
    }
}

// Initialize the demo when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new WebContainerDemo();
});

// Add some helpful console messages
console.log('WebContainer Demo loaded');
console.log('Click "Initialize WebContainer" to start the demo');
console.log('This demo showcases PDF2MD integration capabilities');
