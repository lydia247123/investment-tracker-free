#!/usr/bin/env node

/**
 * Investment Tracker 快速启动脚本
 * 自动处理依赖安装和应用程序启动
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkNodeVersion() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion < 16) {
        log(`❌ 错误: 需要 Node.js 16.0.0 或更高版本，当前版本: ${nodeVersion}`, 'red');
        process.exit(1);
    }

    log(`✅ Node.js 版本检查通过: ${nodeVersion}`, 'green');
}

function installDependencies() {
    if (!fs.existsSync('node_modules')) {
        log('📦 安装依赖...', 'yellow');
        try {
            execSync('npm install', { stdio: 'inherit' });
            log('✅ 依赖安装完成', 'green');
        } catch (error) {
            log('❌ 依赖安装失败', 'red');
            process.exit(1);
        }
    } else {
        log('✅ 依赖已存在', 'green');
    }
}

function checkRequiredFiles() {
    const requiredFiles = [
        'main.js',
        'preload.js',
        'investment-tracker.html',
        'package.json'
    ];

    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

    if (missingFiles.length > 0) {
        log('❌ 缺少必需文件:', 'red');
        missingFiles.forEach(file => log(`   - ${file}`, 'red'));
        process.exit(1);
    }

    log('✅ 必需文件检查通过', 'green');
}

function startApp(devMode = false) {
    log('🚀 启动 Investment Tracker...', 'cyan');

    const args = devMode ? ['.'] : ['.'];
    const options = {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: devMode ? 'development' : 'production' }
    };

    try {
        const child = spawn('npm', ['start'], options);

        child.on('error', (error) => {
            log(`❌ 启动失败: ${error.message}`, 'red');
            process.exit(1);
        });

        child.on('close', (code) => {
            log(`应用程序退出，代码: ${code}`, 'yellow');
        });

        // 处理进程终止
        process.on('SIGINT', () => {
            log('\n👋 正在关闭应用程序...', 'yellow');
            child.kill('SIGINT');
        });

    } catch (error) {
        log(`❌ 启动失败: ${error.message}`, 'red');
        process.exit(1);
    }
}

function showHelp() {
    log('Investment Tracker - 快速启动脚本', 'bright');
    log('');
    log('用法:', 'yellow');
    log('  node quick-start.js [选项]', 'white');
    log('');
    log('选项:', 'yellow');
    log('  --dev, -d    开发模式启动', 'white');
    log('  --help, -h   显示帮助信息', 'white');
    log('');
    log('示例:', 'yellow');
    log('  node quick-start.js       # 正常启动', 'white');
    log('  node quick-start.js --dev # 开发模式', 'white');
}

// 主程序
function main() {
    const args = process.argv.slice(2);
    const devMode = args.includes('--dev') || args.includes('-d');
    const showHelpFlag = args.includes('--help') || args.includes('-h');

    if (showHelpFlag) {
        showHelp();
        return;
    }

    log('🎯 Investment Tracker 快速启动', 'bright');
    log('=====================================', 'cyan');

    checkNodeVersion();
    checkRequiredFiles();
    installDependencies();

    if (devMode) {
        log('🔧 开发模式', 'yellow');
    }

    startApp(devMode);
}

// 错误处理
process.on('uncaughtException', (error) => {
    log(`❌ 未捕获的异常: ${error.message}`, 'red');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`❌ 未处理的 Promise 拒绝: ${reason}`, 'red');
    process.exit(1);
});

// 运行主程序
main();