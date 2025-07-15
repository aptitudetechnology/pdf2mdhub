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
                    
                    try {
                        const output = new TextDecoder().decode(value);
                        this.appendOutput('fileOutput', output);
                    } catch (decodeError) {
                        // --- ADD DEBUGGING HERE ---
                        console.error("TextDecoder decode error caught in installDependencies:", decodeError);
                        console.error("Problematic 'value' type:", typeof value);
                        if (value instanceof Uint8Array) {
                            console.error("Is value a Uint8Array?", true);
                            console.error("Uint8Array byteLength:", value.byteLength);
                            // Log a slice of the Uint8Array to see its raw bytes
                            console.error("Uint8Array content (first 50 bytes):", value.slice(0, 50));
                        } else {
                            console.error("Is value a Uint8Array?", false);
                            console.error("Problematic 'value' itself:", value);
                        }
                        this.appendOutput('fileOutput', `[ERROR: Decoding failed for npm output segment. Type: ${typeof value}]\n`);
                    }
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