const readlineSync = require('readline-sync');

class AnthamaInterpreter {
    constructor() {
        this.variables = {};
        this.lineNumber = 0;
        this.inLoop = false;
        this.loopStack = [];
    }

    execute(code) {
        const lines = code.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        for (let i = 0; i < lines.length; i++) {
            this.lineNumber = i + 1;
            const line = lines[i];
            
            // Skip comments
            if (line.startsWith('//')) {
                continue;
            }
            
            try {
                const skipTo = this.executeLine(line, lines, i);
                if (skipTo !== undefined) {
                    i = skipTo;
                }
            } catch (error) {
                this.throwError(error.message);
            }
        }
    }

    executeLine(line, allLines, currentIndex) {
        // Program start
        if (line === 'namaskara guru') {
            return;
        }

        // Program end
        if (line === 'mugitu guru') {
            return;
        }

        // Variable declaration
        if (line.startsWith('guru idu ')) {
            this.handleVariableDeclaration(line);
            return;
        }

        // Print statement
        if (line.startsWith('helu guru ')) {
            this.handlePrint(line);
            return;
        }

        // Input statement
        if (line.startsWith('kelu guru ')) {
            this.handleInput(line);
            return;
        }

        // If condition
        if (line.startsWith('idre nemdi agi irbaku ')) {
            return this.handleIfCondition(line, allLines, currentIndex);
        }

        // Else condition
        if (line === 'illa andre:') {
            return this.handleElseCondition(allLines, currentIndex);
        }

        // Loop
        if (line.startsWith('suttu guru ')) {
            this.handleLoop(line, allLines, currentIndex);
            return;
        }

        // End loop
        if (line === 'hogu guru') {
            return;
        }

        // Variable assignment
        if (line.includes('=') && line.includes('guru idu ')) {
            this.handleVariableAssignment(line);
            return;
        }

        // Simple variable assignment (without 'guru idu')
        if (line.includes('=') && !line.startsWith('guru idu ')) {
            this.handleSimpleAssignment(line);
            return;
        }

        // If we reach here, it's an unknown command
        this.throwError(`Unknown command: "${line}"`);
    }

    handleVariableDeclaration(line) {
        const match = line.match(/guru idu (\w+) = (.+)/);
        if (!match) {
            this.throwError('Invalid variable declaration syntax');
        }

        const [, varName, value] = match;
        this.variables[varName] = this.evaluateExpression(value);
    }

    handleVariableAssignment(line) {
        const match = line.match(/guru idu (\w+) = (.+)/);
        if (!match) {
            this.throwError('Invalid variable assignment syntax');
        }

        const [, varName, value] = match;
        this.variables[varName] = this.evaluateExpression(value);
    }

    handleSimpleAssignment(line) {
        const match = line.match(/(\w+) = (.+)/);
        if (!match) {
            this.throwError('Invalid assignment syntax');
        }

        const [, varName, value] = match;
        const evaluatedValue = this.evaluateExpression(value);
        this.variables[varName] = evaluatedValue;
    }

    handlePrint(line) {
        const content = line.substring(10); // Remove 'helu guru '
        
        // If it's a quoted string, print it as is
        if (content.startsWith('"') && content.endsWith('"')) {
            console.log(content.slice(1, -1));
        } else {
            // Try to evaluate as expression (variable, arithmetic, etc.)
            const value = this.evaluateExpression(content);
            console.log(value);
        }
    }

    handleInput(line) {
        const prompt = line.substring(10); // Remove 'kelu guru '
        const promptValue = this.evaluateExpression(prompt);
        
        // Extract variable name from the next line (assuming it's a variable declaration)
        const input = readlineSync.question(promptValue);
        
        // Store in a special input variable that can be used
        this.variables['__input__'] = input;
    }

    handleIfCondition(line, allLines, currentIndex) {
        const conditionMatch = line.match(/idre nemdi agi irbaku \((.+)\):/);
        if (!conditionMatch) {
            this.throwError('Invalid if condition syntax');
        }

        const condition = conditionMatch[1];
        const result = this.evaluateCondition(condition);

        if (result) {
            // Execute the if block
            let i = currentIndex + 1;
            while (i < allLines.length) {
                const nextLine = allLines[i];
                
                if (nextLine === 'illa andre:' || nextLine === 'mugitu guru') {
                    break;
                }
                
                this.lineNumber = i + 1;
                this.executeLine(nextLine, allLines, i);
                i++;
            }
            
            // Skip the else block if it exists
            if (i < allLines.length && allLines[i] === 'illa andre:') {
                while (i < allLines.length && allLines[i] !== 'mugitu guru') {
                    i++;
                }
                return i;
            }
        } else {
            // Skip to else or end
            let i = currentIndex + 1;
            while (i < allLines.length) {
                const nextLine = allLines[i];
                
                if (nextLine === 'illa andre:') {
                    // Execute else block
                    i++;
                    while (i < allLines.length) {
                        const elseLine = allLines[i];
                        
                        if (elseLine === 'mugitu guru') {
                            break;
                        }
                        
                        this.lineNumber = i + 1;
                        this.executeLine(elseLine, allLines, i);
                        i++;
                    }
                    return i;
                }
                
                if (nextLine === 'mugitu guru') {
                    return i;
                }
                
                i++;
            }
        }
        
        return undefined;
    }

    handleElseCondition(allLines, currentIndex) {
        // Skip the else block since it should have been handled in if condition
        let i = currentIndex + 1;
        while (i < allLines.length && allLines[i] !== 'mugitu guru') {
            i++;
        }
        return i;
    }

    handleLoop(line, allLines, currentIndex) {
        const conditionMatch = line.match(/suttu guru \((.+)\):/);
        if (!conditionMatch) {
            this.throwError('Invalid loop syntax');
        }

        const condition = conditionMatch[1];
        let loopCount = 0;
        const maxIterations = 1000; // Prevent infinite loops

        while (loopCount < maxIterations) {
            // Re-evaluate condition each time
            if (!this.evaluateCondition(condition)) {
                break;
            }
            // Execute loop body
            let i = currentIndex + 1;
            while (i < allLines.length) {
                const nextLine = allLines[i];
                
                if (nextLine === 'hogu guru') {
                    break;
                }
                
                this.lineNumber = i + 1;
                const skipTo = this.executeLine(nextLine, allLines, i);
                if (skipTo !== undefined) {
                    i = skipTo;
                } else {
                    i++;
                }
            }
            
            loopCount++;
        }

        if (loopCount >= maxIterations) {
            this.throwError('Loop too many times! Yak Anna, infinite loop aaytu!');
        }
    }

    parseValue(value) {
        value = value.trim();
        
        // Boolean values
        if (value === 'sari') return true;
        if (value === 'thappu') return false;
        if (value === 'kaali') return null;
        
        // String values
        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1);
        }
        
        // Number values
        if (!isNaN(value)) {
            return parseFloat(value);
        }
        
        // Variable reference
        if (this.variables.hasOwnProperty(value)) {
            return this.variables[value];
        }
        
        return value;
    }

    evaluateExpression(expr) {
        expr = expr.trim();
        
        // Handle string literals
        if (expr.startsWith('"') && expr.endsWith('"')) {
            return expr.slice(1, -1);
        }
        
        // Handle variable references
        if (this.variables.hasOwnProperty(expr)) {
            return this.variables[expr];
        }
        
        // Handle arithmetic expressions
        if (expr.includes('+') || expr.includes('-') || expr.includes('*') || expr.includes('/')) {
            const result = this.evaluateArithmetic(expr);
            return result;
        }
        
        // Try to parse as number
        if (!isNaN(expr)) {
            return parseFloat(expr);
        }
        
        // If it's a single word that might be a variable, return it as is
        return expr;
    }

    evaluateArithmetic(expr) {
        // Simple arithmetic evaluation for basic operations
        if (expr.includes('+')) {
            const [left, right] = expr.split('+').map(part => part.trim());
            return this.evaluateExpression(left) + this.evaluateExpression(right);
        }
        if (expr.includes('-')) {
            const [left, right] = expr.split('-').map(part => part.trim());
            return this.evaluateExpression(left) - this.evaluateExpression(right);
        }
        if (expr.includes('*')) {
            const [left, right] = expr.split('*').map(part => part.trim());
            return this.evaluateExpression(left) * this.evaluateExpression(right);
        }
        if (expr.includes('/')) {
            const [left, right] = expr.split('/').map(part => part.trim());
            return this.evaluateExpression(left) / this.evaluateExpression(right);
        }
        
        return this.evaluateExpression(expr);
    }

    evaluateCondition(condition) {
        // Handle comparison operators
        const operators = ['==', '!=', '>', '<', '>=', '<='];
        
        for (const op of operators) {
            if (condition.includes(op)) {
                const [left, right] = condition.split(op).map(part => part.trim());
                const leftVal = this.evaluateExpression(left);
                const rightVal = this.evaluateExpression(right);
                
                let result;
                switch (op) {
                    case '==':
                        result = leftVal == rightVal;
                        break;
                    case '!=':
                        result = leftVal != rightVal;
                        break;
                    case '>':
                        result = leftVal > rightVal;
                        break;
                    case '<':
                        result = leftVal < rightVal;
                        break;
                    case '>=':
                        result = leftVal >= rightVal;
                        break;
                    case '<=':
                        result = leftVal <= rightVal;
                        break;
                }
                return result;
            }
        }
        
        // If no operator found, treat as boolean
        return this.parseValue(condition);
    }

    throwError(message) {
        const errorMessages = [
            `Yak Anna Ooooooo 😭, Line ${this.lineNumber} alli thappu ide!`,
            `Guru, Line ${this.lineNumber} alli problem ide! Check maadi!`,
            `Ayyo! Line ${this.lineNumber} alli error aaytu!`,
            `Bombat illa guru! Line ${this.lineNumber} alli thappu ide!`
        ];
        
        const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        throw new Error(`${randomError} ${message}`);
    }
}

module.exports = { AnthamaInterpreter }; 