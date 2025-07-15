// WebContainer Demo Implementation
// This file demonstrates WebContainer API usage for PDF2MD integration

//import { WebContainer } from 'https://cdn.jsdelivr.net/npm/@webcontainer/api@1.1.0/dist/index.js';

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
                
                output += new TextDecoder().decode(value);
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
            "type": "module",
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
            
            // Read output progressively
            const reader = process.output.getReader();
            
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const output = new TextDecoder().decode(value);
                    this.appendOutput('fileOutput', output);
                }
            } finally {
                reader.releaseLock();
            }
            
            await process.exit;
            this.appendOutput('fileOutput', '\nDependencies installed!\n');
            
        } catch (error) {
            this.appendOutput('fileOutput', `Error installing dependencies: ${error.message}\n`);
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
            await process.exit;
            
            // Create a conversion script template
            const conversionScript = `
const fs = require('fs');
const path = require('path');

// Note: This is a demo script template
// In a real implementation, you would:
// 1. Import @opendocsg/pdf2md
// 2. Read the PDF buffer
// 3. Convert to markdown
// 4. Write output

console.log('PDF2MD conversion script ready');
console.log('Input file: /input.pdf');
console.log('Output file: /output.md');

// Simulate conversion for demo
const mockMarkdown = \`# Converted PDF Document

This is a demonstration of PDF to Markdown conversion using WebContainer.

## Features
- Real-time processing in browser
- No server required
- Secure sandboxed environment

## Status
PDF2MD environment is set up and ready for real conversion.
\`;

fs.writeFileSync('/output.md', mockMarkdown);
console.log('CONVERSION_COMPLETE');
`;

            await this.webContainer.fs.writeFile('/convert.js', conversionScript);
            
            this.appendOutput('pdfOutput', 'PDF2MD environment setup complete!\n');
            document.getElementById('convertPdfBtn').disabled = false;
            
        } catch (error) {
            this.appendOutput('pdfOutput', `Error setting up PDF2MD: ${error.message}\n`);
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

        try {
            this.appendOutput('pdfOutput', `Converting: ${file.name}\n`);
            this.showProgress(0);
            
            // Read file as ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = new Uint8Array(arrayBuffer);
            
            // Write PDF to container
            await this.webContainer.fs.writeFile('/input.pdf', buffer);
            this.showProgress(30);
            
            // Run conversion script
            this.appendOutput('pdfOutput', 'Running conversion script...\n');
            const process = await this.webContainer.spawn('node', ['/convert.js']);
            
            const reader = process.output.getReader();
            
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const output = new TextDecoder().decode(value);
                    this.appendOutput('pdfOutput', output);
                    
                    if (output.includes('CONVERSION_COMPLETE')) {
                        this.showProgress(100);
                    }
                }
            } finally {
                reader.releaseLock();
            }
            
            await process.exit;
            this.showProgress(100);
            
            // Read converted markdown
            const markdown = await this.webContainer.fs.readFile('/output.md', 'utf-8');
            this.appendOutput('pdfOutput', '\n=== CONVERTED MARKDOWN ===\n');
            this.appendOutput('pdfOutput', markdown);
            this.appendOutput('pdfOutput', '\n=== END CONVERSION ===\n');
            
        } catch (error) {
            this.appendOutput('pdfOutput', `Conversion error: ${error.message}\n`);
        }
    }

    async getSystemInfo() {
        if (!this.containerReady) {
            this.appendOutput('sysOutput', 'Container not ready!\n');
            return;
        }

        try {
            const commands = [
                ['uname', ['-a']],
                ['node', ['--version']],
                ['npm', ['--version']],
                ['ls', ['-la', '/']]
            ];

            this.appendOutput('sysOutput', '=== SYSTEM INFORMATION ===\n');
            
            for (const [cmd, args] of commands) {
                try {
                    const process = await this.webContainer.spawn(cmd, args);
                    const output = await this.readProcessOutput(process);
                    this.appendOutput('sysOutput', `${cmd} ${args.join(' ')}: ${output}\n`);
                } catch (error) {
                    this.appendOutput('sysOutput', `${cmd}: ${error.message}\n`);
                }
            }
            
            this.appendOutput('sysOutput', '=== END SYSTEM INFO ===\n');
            
        } catch (error) {
            this.appendOutput('sysOutput', `Error getting system info: ${error.message}\n`);
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