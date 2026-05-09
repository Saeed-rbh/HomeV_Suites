const fs = require('fs');
const path = require('path');

function replacePrisma(dir, level) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replacePrisma(fullPath, level + 1);
        } else if (fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Remove PrismaClient imports
            const importRegex1 = /const\s*\{\s*PrismaClient\s*\}\s*=\s*require\(['"]@prisma\/client['"]\);\s*/g;
            if (importRegex1.test(content)) {
                content = content.replace(importRegex1, '');
                modified = true;
            }

            // Replace prisma instantiations with require
            const requirePath = level === 1 ? "'../db'" : "'../../db'";
            const initRegex1 = /const\s+prisma\s*=\s*new\s+PrismaClient\(\s*\{?.*?\}?\s*\);?/g;
            if (initRegex1.test(content)) {
                content = content.replace(initRegex1, `const prisma = require(${requirePath});`);
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Modified:', fullPath);
            }
        }
    }
}

console.log('Replacing Prisma imports in controllers...');
replacePrisma(path.join(__dirname, 'controllers'), 1);
console.log('Replacing Prisma imports in services...');
replacePrisma(path.join(__dirname, 'services'), 1);
console.log('Replacing Prisma imports in utils (if any)...');
replacePrisma(path.join(__dirname, 'utils'), 1);
