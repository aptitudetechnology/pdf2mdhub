// WebContainer Demo Implementation
// Enhanced version with better process indicators and error reporting

import { WebContainer } from 'https://cdn.jsdelivr.net/npm/@webcontainer/api@1.6.1/+esm';

class WebContainerDemo {
    constructor() {
        this.webContainer = null;
        this.containerReady = false;
        this.activeProcesses = new Set(); // Track active processes
        this.processTimeouts = new Map(); // Track process timeouts
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

    // Enhanced process management with timeout and progress tracking
    async runProcessWithTimeout(processName, processFunction, timeoutMs = 120000) {
        const processId = Date.now();
        this.activeProcesses.add(processId);
        
        try {
            // Set up timeout
            const timeoutPromise = new Promise((_, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Process '${processName}' timed out after ${timeoutMs/1000} seconds`));
                }, timeoutMs);
                this.processTimeouts.set(processId, timeout);
            });

            // Set up progress indicators
            const progressInterval = setInterval(() => {
                if (this.activeProcesses.has(processId)) {
                    this.appendOutput('pdfOutput', `⏳ ${processName} still running... (${Math.floor((Date.now() - processId) / 1000)}s)\n`);
                }
            }, 10000); // Every 10 seconds

            // Race between process and timeout
            const result = await Promise.race([
                processFunction(),
                timeoutPromise
            ]);

            clearInterval(progressInterval);
            return result;

        } finally {
            // Cleanup
            this.activeProcesses.delete(processId);
            const timeout = this.processTimeouts.get(processId);
            if (timeout) {
                clearTimeout(timeout);
                this.processTimeouts.delete(processId);
            }
        }
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
            this.appendOutput('commandOutput', '✅ WebContainer ready for commands...\n');
            
            // Show basic container info
            await this.showContainerInfo();
            
        } catch (error) {
            this.showStatus('initStatus', `Failed to initialize: ${error.message}`, 'error');
            console.error('WebContainer initialization failed:', error); 
            this.appendOutput('commandOutput', `❌ Initialization failed: ${error.message}\n`);
        }
    }

    async teardownContainer() {
        if (this.webContainer) {
            // Cancel all active processes
            this.activeProcesses.forEach(processId => {
                const timeout = this.processTimeouts.get(processId);
                if (timeout) {
                    clearTimeout(timeout);
                    this.processTimeouts.delete(processId);
                }
            });
            this.activeProcesses.clear();

            await this.webContainer.teardown();
            this.webContainer = null;
            this.containerReady = false;
            
            this.disableAllButtons();
            this.showStatus('initStatus', 'Container torn down', 'error');
            this.appendOutput('commandOutput', '🔴 Container has been torn down.\n');
        }
    }

    async showContainerInfo() {
        const info = `
=== WebContainer Information ===
Status: ✅ Running
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
            this.appendOutput('commandOutput', '❌ Container not ready!\n');
            return;
        }

        try {
            const fullCommand = `${command} ${args.join(' ')}`;
            this.appendOutput('commandOutput', `$ ${fullCommand}\n`);
            
            const process = await this.webContainer.spawn(command, args);
            const output = await this.readProcessOutput(process); 
            
            this.appendOutput('commandOutput', output + '\n');
            
        } catch (error) {
            this.appendOutput('commandOutput', `❌ Error: ${error.message}\n`);
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
            this.appendOutput('fileOutput', '❌ Container not ready!\n');
            return;
        }

        try {
            const content = `Hello from WebContainer!
This is a test file created at: ${new Date().toISOString()}
Container can read and write files in memory.`;

            await this.webContainer.fs.writeFile('/test.txt', content);
            this.appendOutput('fileOutput', '✅ Created test.txt successfully!\n');
            
        } catch (error) {
            this.appendOutput('fileOutput', `❌ Error creating file: ${error.message}\n`);
        }
    }

    async readTestFile() {
        if (!this.containerReady) {
            this.appendOutput('fileOutput', '❌ Container not ready!\n');
            return;
        }

        try {
            const content = await this.webContainer.fs.readFile('/test.txt', 'utf-8');
            this.appendOutput('fileOutput', `📄 Content of test.txt:\n${content}\n\n`);
            
        } catch (error) {
            this.appendOutput('fileOutput', `❌ Error reading file: ${error.message}\n`);
        }
    }

    async createPackageJson() {
        if (!this.containerReady) {
            this.appendOutput('fileOutput', '❌ Container not ready!\n');
            return;
        }

        const packageJson = {
            "name": "pdf2md-container",
            "version": "1.0.0",
            "type": "module",
            "dependencies": {
                "@opendocsg/pdf2md": "latest"
            }
        };

        try {
            await this.webContainer.fs.writeFile('/package.json', JSON.stringify(packageJson, null, 2));
            this.appendOutput('fileOutput', '✅ Created package.json for PDF2MD!\n');
            
            // Also show the content
            const content = await this.webContainer.fs.readFile('/package.json', 'utf-8');
            this.appendOutput('fileOutput', `📄 Package.json content:\n${content}\n\n`);
            
        } catch (error) {
            this.appendOutput('fileOutput', `❌ Error creating package.json: ${error.message}\n`);
        }
    }

    async installDependencies() {
        if (!this.containerReady) {
            this.appendOutput('fileOutput', '❌ Container not ready!\n');
            return;
        }

        try {
            this.appendOutput('fileOutput', '📦 Installing dependencies...\n');
            
            const result = await this.runProcessWithTimeout('npm install', async () => {
                const process = await this.webContainer.spawn('npm', ['install']);
                
                const reader = process.output.getReader();
                let installOutput = '';
                
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        if (typeof value === 'string') {
                            this.appendOutput('fileOutput', value);
                            installOutput += value;
                        } else if (value instanceof Uint8Array) {
                            try {
                                const output = new TextDecoder().decode(value);
                                this.appendOutput('fileOutput', output);
                                installOutput += output;
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
                return installOutput;
            }, 180000); // 3 minute timeout for npm install
            
            this.appendOutput('fileOutput', '\n✅ Dependencies installed successfully!\n');
            
        } catch (error) {
            this.appendOutput('fileOutput', `❌ Error installing dependencies: ${error.message}\n`);
            console.error("Error in installDependencies outer catch:", error); 
        }
    }

    async setupPdf2MdEnvironment() {
        if (!this.containerReady) {
            this.appendOutput('pdfOutput', '❌ Container not ready!\n');
            return;
        }

        try {
            this.appendOutput('pdfOutput', '🔧 Setting up PDF2MD environment...\n');
            this.showProgress(10);
            
            // Create package.json if it doesn't exist
            await this.createPackageJson();
            this.showProgress(20);
            
            // Install dependencies with timeout
            this.appendOutput('pdfOutput', '📦 Installing @opendocsg/pdf2md...\n');
            await this.runProcessWithTimeout('PDF2MD Setup', async () => {
                const process = await this.webContainer.spawn('npm', ['install']);
                await process.exit;
            }, 180000); // 3 minute timeout
            
            this.showProgress(60);
            
            // Create a conversion script template
            const conversionScript = `
const fs = require('fs');
const path = require('path');

// Enhanced conversion script with better error handling
try {
    console.log('🔄 PDF2MD conversion script starting...');
    console.log('📁 Input file: /input.pdf');
    console.log('📁 Output file: /output.md');

    // Check if input file exists
    if (!fs.existsSync('/input.pdf')) {
        throw new Error('Input PDF file not found');
    }

    console.log('📊 Processing PDF...');
    
    // Simulate conversion progress
    setTimeout(() => console.log('📊 25% complete...'), 1000);
    setTimeout(() => console.log('📊 50% complete...'), 2000);
    setTimeout(() => console.log('📊 75% complete...'), 3000);

    // Note: This is a demo script template
    // In a real implementation, you would:
    // 1. Import @opendocsg/pdf2md
    // 2. Read the PDF buffer
    // 3. Convert to markdown
    // 4. Write output

    const mockMarkdown = \`# Converted PDF Document

This is a demonstration of PDF to Markdown conversion using WebContainer.

## Features
- Real-time processing in browser
- No server required
- Secure sandboxed environment
- Enhanced error handling and progress tracking

## Status
✅ PDF2MD environment is set up and ready for real conversion.

## File Information
- Original file: \${process.env.PDF_FILENAME || 'unknown'}
- Conversion time: \${new Date().toISOString()}
- Status: Demo conversion successful
\`;

    setTimeout(() => {
        fs.writeFileSync('/output.md', mockMarkdown);
        console.log('✅ Conversion completed successfully!');
        console.log('CONVERSION_COMPLETE');
    }, 4000);

} catch (error) {
    console.error('❌ Conversion failed:', error.message);
    console.log('CONVERSION_FAILED');
    process.exit(1);
}
`;

            await this.webContainer.fs.writeFile('/convert.js', conversionScript);
            this.appendOutput('pdfOutput', '✅ Created /convert.js\n'); 
            this.showProgress(80);
            
            // Verify file exists and its content after writing
            const convertJsExists = await this.verifyFileExists('/convert.js');
            if (!convertJsExists) {
                throw new Error('Failed to create conversion script');
            }
            
            this.showProgress(100);
            this.appendOutput('pdfOutput', '✅ PDF2MD environment setup complete!\n');
            document.getElementById('convertPdfBtn').disabled = false;
            
        } catch (error) {
            this.appendOutput('pdfOutput', `❌ Error setting up PDF2MD: ${error.message}\n`);
            console.error("Error setting up PDF2MD outer catch:", error); 
        }
    }

    // Enhanced file verification helper
    async verifyFileExists(filePath) {
        try {
            const content = await this.webContainer.fs.readFile(filePath, 'utf-8');
            this.appendOutput('pdfOutput', `✅ Verified: ${filePath} exists (${content.length} characters)\n`);
            return true;
        } catch (error) {
            this.appendOutput('pdfOutput', `❌ Error: ${filePath} not found - ${error.message}\n`);
            return false;
        }
    }

    async convertPdf() {
        const fileInput = document.getElementById('pdfFile');
        const file = fileInput.files[0];
        
        if (!file) {
            this.appendOutput('pdfOutput', '❌ Please select a PDF file first!\n');
            return;
        }

        if (!this.containerReady) {
            this.appendOutput('pdfOutput', '❌ Container not ready!\n');
            return;
        }

        // Disable the convert button to prevent multiple conversions
        const convertBtn = document.getElementById('convertPdfBtn');
        const originalText = convertBtn.textContent;
        convertBtn.disabled = true;
        convertBtn.textContent = 'Converting...';

        try {
            this.appendOutput('pdfOutput', `🔄 Converting: ${file.name}\n`);
            this.showProgress(0);
            
            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);
            
            // Write PDF to container
            await this.webContainer.fs.writeFile('/input.pdf', buffer);
            this.appendOutput('pdfOutput', '✅ Created /input.pdf\n'); 
            this.showProgress(30);
            
            // Verify /convert.js exists before running
            const convertJsExists = await this.verifyFileExists('/convert.js');
            if (!convertJsExists) {
                throw new Error('Conversion failed: /convert.js not found. Please setup PDF2MD environment first.');
            }

            // Run conversion script with timeout and progress tracking
            this.appendOutput('pdfOutput', '🔄 Running conversion script...\n');
            
            const conversionResult = await this.runProcessWithTimeout('PDF Conversion', async () => {
                const process = await this.webContainer.spawn('node', ['/convert.js']);
                
                const reader = process.output.getReader();
                let outputAccumulated = '';
                
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        
                        if (typeof value === 'string') {
                            this.appendOutput('pdfOutput', value);
                            outputAccumulated += value;
                        } else if (value instanceof Uint8Array) {
                            try {
                                const outputChunk = new TextDecoder().decode(value);
                                this.appendOutput('pdfOutput', outputChunk);
                                outputAccumulated += outputChunk;
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
                return outputAccumulated;
            }, 300000); // 5 minute timeout for conversion
            
            this.showProgress(90);
            
            // Check for conversion completion
            if (conversionResult.includes('CONVERSION_COMPLETE')) {
                this.appendOutput('pdfOutput', '✅ Conversion script completed successfully!\n');
                
                // Read converted markdown
                const markdown = await this.webContainer.fs.readFile('/output.md', 'utf-8');
                this.appendOutput('pdfOutput', '\n📄 === CONVERTED MARKDOWN ===\n');
                this.appendOutput('pdfOutput', markdown);
                this.appendOutput('pdfOutput', '\n=== END CONVERSION ===\n');
                
            } else if (conversionResult.includes('CONVERSION_FAILED')) {
                throw new Error('Conversion script reported failure');
            } else {
                this.appendOutput('pdfOutput', '⚠️ Warning: Conversion script completed but status unclear. Output:\n' + conversionResult + '\n');
            }
            
            this.showProgress(100);
            
        } catch (error) {
            this.appendOutput('pdfOutput', `❌ Conversion error: ${error.message}\n`);
            console.error("Error in convertPdf outer catch:", error);
            this.showProgress(0); // Reset progress on error
        } finally {
            // Re-enable the convert button
            convertBtn.disabled = false;
            convertBtn.textContent = originalText;
        }
    }

    async getSystemInfo() {
        if (!this.containerReady) {
            this.appendOutput('sysOutput', '❌ Container not ready!\n');
            return;
        }

        try {
            const commands = [
                ['node', ['--version']],
                ['npm', ['--version']],
                ['ls', ['-la', '/']]
            ];

            this.appendOutput('sysOutput', '🖥️ === SYSTEM INFORMATION ===\n');
            
            for (const [cmd, args] of commands) {
                try {
                    const process = await this.webContainer.spawn(cmd, args);
                    const output = await this.readProcessOutput(process); 
                    this.appendOutput('sysOutput', `${cmd} ${args.join(' ')}:\n${output}\n`);
                } catch (error) {
                    this.appendOutput('sysOutput', `❌ ${cmd}: ${error.message}\n`);
                    console.error(`Error getting system info for command '${cmd}':`, error);
                }
            }
            
            this.appendOutput('sysOutput', '=== END SYSTEM INFO ===\n');
            
        } catch (error) {
            this.appendOutput('sysOutput', `❌ Error getting system info: ${error.message}\n`);
            console.error("Error in getSystemInfo outer catch:", error); 
        }
    }

    showProgress(percent) {
        const progressBar = document.querySelector('.progress-bar');
        const progressFill = document.getElementById('progressFill');
        
        if (progressBar && progressFill) {
            progressBar.style.display = 'block';
            progressFill.style.width = `${percent}%`;
            
            if (percent >= 100) {
                setTimeout(() => {
                    progressBar.style.display = 'none';
                }, 3000);
            }
        }
    }

    appendOutput(elementId, text) {
        const output = document.getElementById(elementId);
        if (output) {
            output.textContent += text;
            output.scrollTop = output.scrollHeight;
        }
    }

    showStatus(elementId, message, type) {
        const status = document.getElementById(elementId);
        if (status) {
            status.textContent = message;
            status.className = `status ${type}`;
            status.style.display = 'block';
        }
    }

    enableAllButtons() {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.id !== 'initBtn') {
                btn.disabled = false;
            }
        });
        
        // Enable inputs
        const customCommand = document.getElementById('customCommand');
        const pdfFile = document.getElementById('pdfFile');
        if (customCommand) customCommand.disabled = false;
        if (pdfFile) pdfFile.disabled = false;
        
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
        const customCommand = document.getElementById('customCommand');
        const pdfFile = document.getElementById('pdfFile');
        if (customCommand) customCommand.disabled = true;
        if (pdfFile) pdfFile.disabled = true;
        
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
console.log('🚀 WebContainer Demo loaded');
console.log('📋 Click "Initialize WebContainer" to start the demo');
console.log('📄 This demo showcases PDF2MD integration capabilities with enhanced error handling');