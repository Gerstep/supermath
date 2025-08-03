import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DevServer {
    constructor(options = {}) {
        this.port = options.port || 3000;
        this.host = options.host || 'localhost';
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
            next();
        });

        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });

        this.app.use(express.static(path.join(__dirname, '..')));
        this.app.use('/src', express.static(path.join(__dirname, '..', 'src')));
        this.app.use('/tests', express.static(path.join(__dirname, '..', 'tests')));
    }

    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'index.html'));
        });

        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'running',
                timestamp: new Date().toISOString(),
                version: this.getVersion(),
                environment: 'development'
            });
        });

        this.app.get('/api/files', (req, res) => {
            const srcDir = path.join(__dirname, '..', 'src');
            const files = this.getFileStructure(srcDir);
            res.json(files);
        });

        this.app.get('/test-runner', (req, res) => {
            const testRunnerPath = path.join(__dirname, '..', 'tests');
            
            if (!fs.existsSync(testRunnerPath)) {
                return res.status(404).send('Test runner not found');
            }

            const html = this.generateTestRunnerHTML();
            res.send(html);
        });

        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.version
            });
        });

        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `Route ${req.method} ${req.url} not found`,
                timestamp: new Date().toISOString()
            });
        });

        this.app.use((error, req, res, next) => {
            console.error('Server Error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
                timestamp: new Date().toISOString()
            });
        });
    }

    getVersion() {
        try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
            return packageJson.version;
        } catch (error) {
            return '0.0.0';
        }
    }

    getFileStructure(dir, basePath = '') {
        const files = [];
        
        try {
            const items = fs.readdirSync(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const relativePath = path.join(basePath, item);
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    files.push({
                        name: item,
                        type: 'directory',
                        path: relativePath,
                        children: this.getFileStructure(fullPath, relativePath)
                    });
                } else {
                    files.push({
                        name: item,
                        type: 'file',
                        path: relativePath,
                        size: stats.size,
                        modified: stats.mtime
                    });
                }
            }
        } catch (error) {
            console.warn(`Cannot read directory ${dir}:`, error.message);
        }
        
        return files;
    }

    generateTestRunnerHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Math Super Game - Test Runner</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .test-passed { background: #d4edda; border-color: #c3e6cb; }
        .test-failed { background: #f8d7da; border-color: #f5c6cb; }
        button { padding: 10px 20px; margin: 5px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .results { margin-top: 20px; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Math Super Game - Test Runner</h1>
        <p>Development server test interface</p>
        <button onclick="runAllTests()">Run All Tests</button>
        <button onclick="runUnitTests()">Unit Tests</button>
        <button onclick="runIntegrationTests()">Integration Tests</button>
        <button onclick="clearResults()">Clear Results</button>
    </div>
    
    <div id="results" class="results"></div>
    
    <script>
        async function runAllTests() {
            showResults('Running all tests...');
            // Mock test runner - in a real implementation, this would run actual tests
            const results = {
                unit: { passed: 15, failed: 2, total: 17 },
                integration: { passed: 8, failed: 1, total: 9 },
                e2e: { passed: 5, failed: 0, total: 5 }
            };
            
            setTimeout(() => {
                displayTestResults(results);
            }, 2000);
        }
        
        async function runUnitTests() {
            showResults('Running unit tests...');
            setTimeout(() => {
                displayTestResults({ unit: { passed: 15, failed: 2, total: 17 } });
            }, 1000);
        }
        
        async function runIntegrationTests() {
            showResults('Running integration tests...');
            setTimeout(() => {
                displayTestResults({ integration: { passed: 8, failed: 1, total: 9 } });
            }, 1500);
        }
        
        function showResults(message) {
            document.getElementById('results').innerHTML = '<p>' + message + '</p>';
        }
        
        function displayTestResults(results) {
            let html = '<h2>Test Results</h2>';
            
            Object.entries(results).forEach(([type, result]) => {
                const status = result.failed === 0 ? 'test-passed' : 'test-failed';
                html += \`
                    <div class="test-section \${status}">
                        <h3>\${type.charAt(0).toUpperCase() + type.slice(1)} Tests</h3>
                        <p>Passed: \${result.passed} | Failed: \${result.failed} | Total: \${result.total}</p>
                        <p>Success Rate: \${Math.round((result.passed / result.total) * 100)}%</p>
                    </div>
                \`;
            });
            
            document.getElementById('results').innerHTML = html;
        }
        
        function clearResults() {
            document.getElementById('results').innerHTML = '';
        }
    </script>
</body>
</html>
        `;
    }

    start() {
        return new Promise((resolve, reject) => {
            const server = this.app.listen(this.port, this.host, (error) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(`\n🚀 Math Super Game Development Server`);
                    console.log(`📍 Local:    http://${this.host}:${this.port}`);
                    console.log(`📊 Status:   http://${this.host}:${this.port}/api/status`);
                    console.log(`🧪 Tests:    http://${this.host}:${this.port}/test-runner`);
                    console.log(`📁 Files:    http://${this.host}:${this.port}/api/files`);
                    console.log(`\n🎮 Ready to play Math Super Game!\n`);
                    resolve(server);
                }
            });

            server.on('error', (error) => {
                if (error.code === 'EADDRINUSE') {
                    console.error(`❌ Port ${this.port} is already in use`);
                    console.error(`   Try a different port: node dev-server.js --port 3001`);
                } else {
                    console.error('❌ Server error:', error.message);
                }
                reject(error);
            });

            process.on('SIGTERM', () => {
                console.log('\n👋 Shutting down development server...');
                server.close(() => {
                    console.log('✅ Server closed');
                    process.exit(0);
                });
            });

            process.on('SIGINT', () => {
                console.log('\n👋 Shutting down development server...');
                server.close(() => {
                    console.log('✅ Server closed');
                    process.exit(0);
                });
            });
        });
    }
}

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const options = {};
    
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace('--', '');
        const value = args[i + 1];
        
        if (key === 'port') {
            options.port = parseInt(value, 10);
        } else if (key === 'host') {
            options.host = value;
        }
    }
    
    const server = new DevServer(options);
    server.start().catch(console.error);
}

export default DevServer;