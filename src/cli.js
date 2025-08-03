#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { AnthamaInterpreter } = require('./interpreter');

function showBanner() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🎭 ANTHAMA 🎭                             ║
║              The Kannada Meme Programming Language           ║
║                                                              ║
║  "Guru, idu serious alla... idu meme programming language!"  ║
╚══════════════════════════════════════════════════════════════╝
    `);
}

function showHelp() {
    console.log(`
Usage: anthama <filename.maga>

Examples:
  anthama hello.maga
  anthama drama.maga

Options:
  --help, -h     Show this help message
  --version, -v  Show version

Guru, .maga file kodu, naanu execute maadutini! 😎
    `);
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        showBanner();
        showHelp();
        return;
    }
    
    if (args.includes('--version') || args.includes('-v')) {
        const packageJson = require('../package.json');
        console.log(`Anthama Lang v${packageJson.version}`);
        return;
    }
    
    const filename = args[0];
    
    if (!filename.endsWith('.maga')) {
        console.log('😤 Guru, .maga file kodu! Yak Anna, .maga file alla idu!');
        process.exit(1);
    }
    
    const filePath = path.resolve(filename);
    
    if (!fs.existsSync(filePath)) {
        console.log(`😭 Yak Anna Ooooooo! File "${filename}" sigalla! Check maadi guru!`);
        process.exit(1);
    }
    
    try {
        showBanner();
        console.log(`🚀 Executing: ${filename}\n`);
        
        const code = fs.readFileSync(filePath, 'utf8');
        const interpreter = new AnthamaInterpreter();
        interpreter.execute(code);
        
        console.log('\n✨ Mugitu guru! Program execute aaytu! 🎉');
    } catch (error) {
        console.log(`\n💥 Yak Anna Ooooooo 😭, Error aaytu!`);
        console.log(`Error: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
} 