const fs = require('fs').promises;
const path = require('path');

class Builder {
    constructor(options = {}) {
        this.sourceDir = options.sourceDir || path.join(__dirname, '..', 'src');
        this.buildDir = options.buildDir || path.join(__dirname, '..', 'dist');
        this.minify = options.minify !== false;
        this.version = this.getVersion();
    }

    getVersion() {
        try {
            const packagePath = path.join(__dirname, '..', 'package.json');
            const packageData = require(packagePath);
            return packageData.version || '1.0.0';
        } catch (error) {
            return '1.0.0';
        }
    }

    async build() {
        console.log('🔨 Starting Math Super Game build process...\n');
        
        try {
            await this.cleanBuildDir();
            await this.createBuildDir();
            await this.bundleJavaScript();
            await this.bundleCSS();
            await this.copyAssets();
            await this.generateHTML();
            await this.generateManifest();
            
            console.log('\n✅ Build completed successfully!');
            console.log(`📦 Build output: ${this.buildDir}`);
            
            const stats = await this.getBuildStats();
            this.printBuildStats(stats);
            
        } catch (error) {
            console.error('\n❌ Build failed:', error.message);
            if (process.env.DEBUG) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    async cleanBuildDir() {
        console.log('🧹 Cleaning build directory...');
        try {
            await fs.rmdir(this.buildDir, { recursive: true });
        } catch (error) {
            // Directory might not exist, that's okay
        }
    }

    async createBuildDir() {
        console.log('📁 Creating build directory...');
        await fs.mkdir(this.buildDir, { recursive: true });
        await fs.mkdir(path.join(this.buildDir, 'assets'), { recursive: true });
    }

    async bundleJavaScript() {
        console.log('📦 Bundling JavaScript...');
        
        const jsFiles = await this.findFiles(path.join(this.sourceDir, 'js'), '.js');
        const modules = {};
        
        for (const file of jsFiles) {
            const content = await fs.readFile(file, 'utf8');
            const relativePath = path.relative(path.join(this.sourceDir, 'js'), file);
            const moduleName = relativePath.replace(/\.js$/, '').replace(/\\/g, '/');
            
            modules[moduleName] = this.processJavaScript(content, moduleName);
        }

        const bundleContent = this.createJSBundle(modules);
        const outputPath = path.join(this.buildDir, 'app.js');
        
        await fs.writeFile(outputPath, bundleContent);
        console.log(`   ✓ Created: app.js`);
    }

    processJavaScript(content, moduleName) {
        let processed = content;

        processed = processed.replace(/import\s+(.+?)\s+from\s+['"](.+?)['"];?/g, (match, imports, from) => {
            const resolvedPath = this.resolveModulePath(from, moduleName);
            return `const ${imports} = __modules__['${resolvedPath}'] || {};`;
        });

        processed = processed.replace(/export\s+default\s+(.+?);?$/m, 'return $1;');
        processed = processed.replace(/export\s+\{(.+?)\}/g, 'return { $1 };');

        if (this.minify) {
            processed = this.minifyJS(processed);
        }

        return processed;
    }

    resolveModulePath(importPath, currentModule) {
        if (importPath.startsWith('./')) {
            const currentDir = path.dirname(currentModule);
            return path.join(currentDir, importPath.slice(2)).replace(/\\/g, '/');
        } else if (importPath.startsWith('../')) {
            const currentDir = path.dirname(currentModule);
            return path.resolve(currentDir, importPath).replace(/\\/g, '/');
        }
        return importPath;
    }

    createJSBundle(modules) {
        let bundle = `
(function() {
    'use strict';
    
    const __modules__ = {};
    const __cache__ = {};
    
    function __require__(moduleName) {
        if (__cache__[moduleName]) {
            return __cache__[moduleName];
        }
        
        if (!__modules__[moduleName]) {
            throw new Error('Module not found: ' + moduleName);
        }
        
        const module = { exports: {} };
        const result = __modules__[moduleName].call(module.exports, __require__, module, module.exports);
        
        __cache__[moduleName] = result || module.exports;
        return __cache__[moduleName];
    }
    
`;

        Object.entries(modules).forEach(([name, content]) => {
            bundle += `    __modules__['${name}'] = function(__require__, module, exports) {\n`;
            bundle += `        ${content}\n`;
            bundle += `    };\n\n`;
        });

        bundle += `
    // Initialize the app
    try {
        const app = __require__('app');
        window.mathSuperGameApp = app;
        console.log('Math Super Game loaded successfully');
    } catch (error) {
        console.error('Failed to initialize Math Super Game:', error);
    }
})();
`;

        return bundle;
    }

    minifyJS(code) {
        return code
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '')
            .replace(/\s+/g, ' ')
            .replace(/;\s*}/g, '}')
            .replace(/{\s*/g, '{')
            .replace(/}\s*/g, '}')
            .replace(/,\s*/g, ',')
            .trim();
    }

    async bundleCSS() {
        console.log('🎨 Bundling CSS...');
        
        const cssFiles = await this.findFiles(path.join(this.sourceDir, 'css'), '.css');
        let bundleContent = '';
        
        const processOrder = [
            'base/variables.css',
            'base/typography.css',
            'components/blocks.css',
            'components/buttons.css',
            'components/modals.css',
            'main.css'
        ];

        for (const orderFile of processOrder) {
            const fullPath = path.join(this.sourceDir, 'css', orderFile);
            if (await this.fileExists(fullPath)) {
                const content = await fs.readFile(fullPath, 'utf8');
                bundleContent += `/* ${orderFile} */\n`;
                bundleContent += await this.processCSS(content);
                bundleContent += '\n\n';
            }
        }

        for (const file of cssFiles) {
            const relativePath = path.relative(path.join(this.sourceDir, 'css'), file);
            if (!processOrder.includes(relativePath)) {
                const content = await fs.readFile(file, 'utf8');
                bundleContent += `/* ${relativePath} */\n`;
                bundleContent += await this.processCSS(content);
                bundleContent += '\n\n';
            }
        }

        if (this.minify) {
            bundleContent = this.minifyCSS(bundleContent);
        }

        const outputPath = path.join(this.buildDir, 'styles.css');
        await fs.writeFile(outputPath, bundleContent);
        console.log(`   ✓ Created: styles.css`);
    }

    async processCSS(content) {
        let processed = content;

        processed = processed.replace(/@import\s+url\(['"](.+?)['"]\);?/g, '');

        processed = processed.replace(/url\((?!['"]?(?:data:|https?:|\/\/))/g, 'url(assets/');

        return processed;
    }

    minifyCSS(css) {
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .replace(/;\s*}/g, '}')
            .replace(/{\s*/g, '{')
            .replace(/}\s*/g, '}')
            .replace(/,\s*/g, ',')
            .replace(/:\s*/g, ':')
            .replace(/;\s*/g, ';')
            .trim();
    }

    async copyAssets() {
        console.log('📄 Copying assets...');
        
        const assetsDir = path.join(this.sourceDir, 'assets');
        const outputAssetsDir = path.join(this.buildDir, 'assets');
        
        if (await this.fileExists(assetsDir)) {
            await this.copyDirectory(assetsDir, outputAssetsDir);
            console.log(`   ✓ Copied assets directory`);
        } else {
            console.log(`   ⚠ No assets directory found`);
        }
    }

    async copyDirectory(src, dest) {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src, { withFileTypes: true });
        
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            
            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }

    async generateHTML() {
        console.log('📝 Generating HTML...');
        
        const templatePath = path.join(__dirname, '..', 'index.html');
        let htmlContent = await fs.readFile(templatePath, 'utf8');

        htmlContent = htmlContent.replace(
            /<link rel="stylesheet" href="src\/css\/main\.css">/,
            '<link rel="stylesheet" href="styles.css">'
        );

        htmlContent = htmlContent.replace(
            /<script type="module" src="src\/js\/app\.js"><\/script>/,
            '<script src="app.js"></script>'
        );

        htmlContent = htmlContent.replace(
            /<title>(.+?)<\/title>/,
            `<title>$1 v${this.version}</title>`
        );

        const metaTags = `
    <meta name="version" content="${this.version}">
    <meta name="build-date" content="${new Date().toISOString()}">
    <meta name="generator" content="Math Super Game Builder">`;
        
        htmlContent = htmlContent.replace(
            /<meta name="viewport"[^>]*>/,
            `$&${metaTags}`
        );

        const outputPath = path.join(this.buildDir, 'index.html');
        await fs.writeFile(outputPath, htmlContent);
        console.log(`   ✓ Created: index.html`);
    }

    async generateManifest() {
        console.log('📋 Generating build manifest...');
        
        const manifest = {
            version: this.version,
            buildDate: new Date().toISOString(),
            files: {},
            stats: await this.getBuildStats()
        };

        const files = await this.findFiles(this.buildDir);
        for (const file of files) {
            const relativePath = path.relative(this.buildDir, file);
            const stats = await fs.stat(file);
            manifest.files[relativePath] = {
                size: stats.size,
                modified: stats.mtime
            };
        }

        const manifestPath = path.join(this.buildDir, 'manifest.json');
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`   ✓ Created: manifest.json`);
    }

    async getBuildStats() {
        const stats = {
            totalFiles: 0,
            totalSize: 0,
            byType: {}
        };

        if (await this.fileExists(this.buildDir)) {
            const files = await this.findFiles(this.buildDir);
            
            for (const file of files) {
                const fileStats = await fs.stat(file);
                const ext = path.extname(file);
                
                stats.totalFiles++;
                stats.totalSize += fileStats.size;
                
                if (!stats.byType[ext]) {
                    stats.byType[ext] = { count: 0, size: 0 };
                }
                stats.byType[ext].count++;
                stats.byType[ext].size += fileStats.size;
            }
        }

        return stats;
    }

    printBuildStats(stats) {
        console.log('\n📊 Build Statistics:');
        console.log(`   Files: ${stats.totalFiles}`);
        console.log(`   Total size: ${this.formatBytes(stats.totalSize)}`);
        
        Object.entries(stats.byType).forEach(([ext, data]) => {
            console.log(`   ${ext || 'no extension'}: ${data.count} files, ${this.formatBytes(data.size)}`);
        });
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async findFiles(dir, extension = '') {
        const files = [];
        
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    const subFiles = await this.findFiles(fullPath, extension);
                    files.push(...subFiles);
                } else if (!extension || entry.name.endsWith(extension)) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Directory might not exist
        }
        
        return files;
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    if (args.includes('--no-minify')) {
        options.minify = false;
    }
    
    if (args.includes('--output')) {
        const outputIndex = args.indexOf('--output');
        options.buildDir = args[outputIndex + 1];
    }
    
    const builder = new Builder(options);
    builder.build().catch(console.error);
}

module.exports = Builder;