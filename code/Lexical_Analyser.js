const preprocessors = ["#define", "#include", "#ifdef","#ifndef", "#endif", "#if","#else", "#elif", "#pragma", "#error","#warning", "#line", "#undef"]
const keywords = ['true','false','auto','duoble','int','struct','break','else','long','switch','case','enum','register','typedef','char','extern','return','union','const','float','short','unsigned','continue','for','singed','void','default','goto','sizeof','volaitle','do','if','static','while']
const brackets = ['(',')','[',']','{','}']
const operators = {'Arithmetic':['+','-','*','/','%','++','--'],
    'Comparison':['==','!=','>','<','<=','>='],
    'Logical':['&&','||','!'],
    'Assignment':['=','+=','-=','*=','/=','%=','<<=','>>=','&=','^=','|='],
    'Bitwise':['<<','>>','&','^','|','~']
}
const delimiters = [';',',',':']

let result = []

function lexer(){
    result = []
    document.getElementById('output').innerHTML = ""
    let token = ""
    let code = document.getElementById('input').value

    let state = 0
    let col = 0
    let line = 1
    let scope = ['global']
    let scopeNum = 0

    for (let i = 0; i < code.length; i++) {
        col ++
        let char = code[i]
        let nextChar = code[i+1]

        if (isNewLine(char)) {
            line++
            col = 0
            if (state == 0) {
                continue
            }
        }

        if (state == 0 && isSpace(char)) {
            continue
        }

        if (delimiters.includes(char) && token[0] != "'" && token[0] != '"') {
            token = ""
            result.push([char,"Delimiter",col,line,scope[scope.length-1]])
            continue
        }

        if ((char == "{") && (state != 3 && state != 2)) {
            scopeNum++
            scope.push(scopeNum)
        }

        if ((char == "}") && (state != 3 && state != 2)) {
            scope.pop()
        }

        if ((brackets.includes(char)) && (state != 3 && state != 2) ) {
            token = ""
            result.push([char,"Bracket",col,line,scope[scope.length-1]])
            continue
        }



        switch (state) {
            case 0:
                token = ""
                token += char
                if (char == '/') {
                    if (isNewLine(nextChar) || isSpace(nextChar) || isEnd(i,code)) {
                        state = 0
                        result.push([token,"Arithmetic Operator",col,line,scope[scope.length-1]] )
                    }else{state = 1}
                    break
                }else if (isDigit(char)) {
                    if (isFinish(nextChar,i,code)) {
                        state = 0
                        result.push([token,"Integer Literal",col-token.length+1,line,scope[scope.length-1]])
                        break
                    }
                    state = 5
                }else if ((isLetter(char) || char == '_')) {
                    if (isFinish(nextChar,i,code) || isOperator(nextChar)) {
                        if (char == '_') {
                            result.push([token,"Invalid Token",col-token.length+1,line,scope[scope.length-1]])
                        }else{
                        result.push([token,"Identifier",col-token.length+1,line,scope[scope.length-1]])
                        }
                        state = 0
                    }else{state = 8}
                }else if (char == '#') {
                    state = 9
                }else if (char == '<' && !isFinish(nextChar,i,code) && !isOperator(nextChar)) {
                    state = 15
                }else if (char == "*") {
                    if (isNewLine(nextChar) || isSpace(nextChar) || isEnd(i,code)) {
                        state = 0
                        result.push([token,"Arithmetic Operator",col,line,scope[scope.length-1]])
                    }else if (isLetter(nextChar)) {
                        state = 11
                    }else{state = 10}
                }else if (char == '&') {
                    if (isNewLine(nextChar) || isSpace(nextChar) || isEnd(i,code)) {
                        state = 0
                        result.push([token,"Arithmetic Operator",col,line,scope[scope.length-1]])
                    }else if (isLetter(nextChar)) {
                        state = 11
                    }else{state = 10}
                }else if (char == '+' || char == '-' || char == '%' || char == '=' || char == '|' || char == '>' || char == '<' || char == '^' || char == '~' || char =="!") {
                    if (char == '!' && nextChar != '=') {
                        state = 0
                        result.push([token,`Logical Operator`,col-token.length+1,line,scope[scope.length-1]])
                    }else if (isNewLine(nextChar) || isSpace(nextChar) || isEnd(i,code) || isDigit(nextChar) || isLetter(nextChar)) {
                        for (const [key, value] of Object.entries(operators)) {
                            if (value.includes(token)) {
                                result.push([token,`${key} Operator`,col-token.length+1,line,scope[scope.length-1]])
                                state = 0
                                break
                            }
                            if (key == 'Bitwise') {
                                state = 0
                                result.push([token,"Invalid Token",col-token.length+1,line,scope[scope.length-1]])
                            }
                        }
                    }else{state = 12}
                }else if (char == '"' || char == "'") {
                    state = 13
                }else{
                    result.push([token,"Invalid Token",col,line,scope[scope.length-1]])
                }
                break
            
            case 1:
                token += char
                if (char == '/'){
                    state = 2
                    break
                }else if (char == '*') {
                    state = 3
                    break
                }else if(char == '='){
                    state = 0
                    result.push([token,"Assignmet Operator",col,line,scope[scope.length-1]])
                }else{
                    state = 0
                    let values = getToken(++i,token,col,code)
                    i = values[0]
                    token = values[1]
                    col = values[2]
                    result.push([token,"Invalid Token",col-token.length+1,line,scope[scope.length-1]])
                }
                break

            case 2:
                token += char
                if (!isNewLine(nextChar)) {
                    state = 2
                }
                if (isEnd(i,code) || isNewLine(nextChar)) {
                    state = 0
                    result.push([token,"Single-line Comment",col-token.length+1,line,scope[scope.length-1]])
                }
                break

            case 3:
                token += char
                if (char == '*') {
                    state = 4
                }else if (isEnd(i,code)) {
                    result.push([token,"Invalid Token",col,line,scope[scope.length-1]])
                }else {
                    state = 3
                }
                break

            case 4:
                token += char
                if (char == '/') {
                    state = 0
                    result.push([token,"Multi-line Comment","-","-",scope[scope.length-1]])
                }else{
                    state = 3
                }
                break
            
            case 5:
                token += char
                if((isFinish(nextChar,i,code)) && char != '.' && isDigit(char)){
                    state = 0
                    result.push([token,"Integer Literal",col-token.length+1,line,scope[scope.length-1]])
                }else if (!(isFinish(nextChar,i,code)) && char == '.'){
                    state = 6
                }else if(isDigit(char)){
                    state = 5
                }else if ((char == "x" || char == "X") && !(isFinish(nextChar,i,code))) {
                    state = 14
                }else{
                    state = 0
                    let values = getToken(++i,token,col,code)
                    i = values[0]
                    token = values[1]
                    col = values[2]
                    result.push([token,"Invalid Token",col-token.length+1,line,scope[scope.length-1]])
                }
                break
            
            case 6:     
                token += char          
                if(isFinish(nextChar,i,code) && isDigit(char)){
                    state = 0
                    result.push([token,"Real Number Token",col-token.length+1,line,scope[scope.length-1]])
                }else if (isDigit(char)) {
                    state = 7
                }else{
                    state = 0
                    let values = getToken(++i,token,col,code)
                    i = values[0]
                    token = values[1]
                    col = values[2]
                    result.push([token,"Invalid Token",col-token.length+1,line,scope[scope.length-1]])
                }
                break

            case 7:
                token += char
                if((isFinish(nextChar,i,code)) && isDigit(char)){
                    state = 0
                    result.push([token,"Real Number Literal",col-token.length+1,line,scope[scope.length-1]])
                }else if (isDigit(char)) {
                    state = 7
                }else {
                    state = 0
                    let values = getToken(++i,token,col,code)
                    i = values[0]
                    token = values[1]
                    col = values[2]
                    result.push([token,"Invalid Token",col-token.length+1,line,scope[scope.length-1]])
                }
                break

            case 8:
                token += char
                if (isFinish(nextChar,i,code) && (isDigit(char) || isLetter(char) || char == '_') || isOperator(nextChar)) {
                    state = 0
                    if (keywords.includes(token)) {
                        result.push([token,"Keyword",col-token.length+1,line,scope[scope.length-1]])
                    }else{
                        result.push([token,"Identifier",col-token.length+1,line,scope[scope.length-1]])
                    }
                }else if (isDigit(char) || isLetter(char) || char == '_') {
                    state = 8
                }else{
                    state = 0
                    let values = getToken(++i,token,col,code)
                    i = values[0]
                    token = values[1]
                    col = values[2]
                    result.push([token,"Invalid Token",col-token.length+1,line,scope[scope.length-1]])
                }
                break

            case 9:
                token += char
                if (isFinish(nextChar,i,code)) {
                    if (preprocessors.includes(token)) {
                        result.push([token,"Preprocessor",col-token.length+1,line,scope[scope.length-1]])
                    }else{
                        result.push([token,"Invalid Token",col-token.length+1,line,scope[scope.length-1]])
                    }
                    state = 0
                }else if (isLetter(char)) {
                    state = 9
                }else{
                    state = 0
                    let values = getToken(++i,token,col,code)
                    i = values[0]
                    token = values[1]
                    col = values[2]
                    result.push([token,"Invalid Token",col-token.length+1,line,scope[scope.length-1]])
                }
                break
            
            case 10:
                token += char
                if (isLetter(char) || char == '_') {
                    state = 11
                }else if (char == '=') {
                    state = 0
                    result.push([token,"Aritmetic Operator",col-token.length+1,line,scope[scope.length-1]])
                }else if (char == '&'){
                    state = 0
                    result.push([token,"Logical Operator",col-token.length+1,line,scope[scope.length-1]])
                }else{
                    state = 0
                    let values = getToken(++i,token,col,code)
                    i = values[0]
                    token = values[1]
                    col = values[2]
                    result.push([token,"Invalid Token",col-token.length+1,line,scope[scope.length-1]])
                }
                break

            case 11:
                token += char
                if (isFinish(nextChar,i,code)){
                    state = 0
                    if (token[0] == '*') {
                        result.push([token,"Pointer",col-token.length+1,line,scope[scope.length-1]])
                    }else{result.push([token,"Address",col-token.length+1,line,scope[scope.length-1]])}
                }else if (isDigit(char) || isLetter(char) || char == '_') {
                    state = 11

                }else{
                    state = 0
                    let values = getToken(++i,token,col,code)
                    i = values[0]
                    token = values[1]
                    col = values[2]
                    result.push([token,"Invalid Token",col-token.length+1,line,scope[scope.length-1]])
                }
                break

            case 12:
                token += char
                for (const [key, value] of Object.entries(operators)) {
                    if (value.includes(token)) {
                        result.push([token,`${key} Operator`,col-token.length+1,line,scope[scope.length-1]])
                        state = 0
                        break
                    }
                    if (key == 'Bitwise') {
                        state = 0
                        result.push([token,"Invalid Token",col-token.length+1,line,scope[scope.length-1]])
                    }
                }

                break
        
            case 13:
                token += char
                if (token[0] == char) {
                    state = 0
                    if (char == "'") {
                        result.push([token,"Character Literal",col-token.length+1,line,scope[scope.length-1]])
                    }else{result.push([token,"String Literal",col-token.length+1,line,scope[scope.length-1]])}
                }else if (isEnd(i,code)) {
                    result.push([token,"Invalid Token",col-token.length+1,line,scope[scope.length-1]])
                }
            break

            case 14:
                token += char
                if ((isFinish(nextChar,i,code)) && (isDigit(char) || (char.charCodeAt(0) > 96 && char.charCodeAt(0) < 103) || (char.charCodeAt(0) > 64 && char.charCodeAt(0) < 71))){
                    state = 0
                    result.push([token,"Hex Literal",col-token.length+1,line,scope[scope.length-1]])
                }else if (isDigit(char) || (char.charCodeAt(0) > 96 && char.charCodeAt(0) < 103) || (char.charCodeAt(0) > 64 && char.charCodeAt(0) < 71)) {
                    state = 14
                }else{
                    state = 0
                    let values = getToken(++i,token,col,code)
                    i = values[0]
                    token = values[1]
                    col = values[2]
                    result.push([token,"Invalid Token",col-token.length+1,line,scope[scope.length-1]])
                }
                break
            
            case 15:
                token += char
                if (char == '>') {
                    state = 0
                    result.push([token,"Header File",col-token.length+1,line,scope[scope.length-1]])
                }else if (isEnd(i,code)) {
                    result.push([token,"Invalid Token",col-token.length+1,line,scope[scope.length-1]])
                }
                break

        }

    }

    printResult(result)
}

function isDigit(char){
    return char.charCodeAt(0) > 47 && char.charCodeAt(0) < 58
}

function isLetter(char) {
    return (char.charCodeAt(0) > 64 && char.charCodeAt(0) < 91) || (char.charCodeAt(0) > 96 && char.charCodeAt(0) < 123)
}

function isSpace(char){
    return char == " "
}

function isNewLine(char){
    return char == "\n"
}

function isEnd(i,code){
    if (code[i+1] == undefined) {
        return true
    }else {return false}
    // return len - i == 1
}

function isBracketOrDelimiter(char){
    return brackets.includes(char) || delimiters.includes(char)
}

function isFinish(char,i,code){
    return isNewLine(char) || isSpace(char) || isEnd(i,code) || isBracketOrDelimiter(char)
}

function isOperator(char) {
    return operators.Arithmetic.includes(char) || operators.Assignment.includes(char) || operators.Bitwise.includes(char) || operators.Comparison.includes(char) || operators.Logical.includes(char)   
}

function getToken(i,token,col,code){
    while (!isSpace(code[i]) && !isNewLine(code[i]) && i < code.length) {
        token += code[i]
        i++
        col++
    }
    return [i,token,col]
}

function printResult(){
    let output = document.getElementById('output')

    for (let i = 0; i < result.length; i++) {
        let newRow = document.createElement("tr");
        for (let j = 0; j < result[i].length; j++) {
            let cell = document.createElement("td");
            cell.innerText = result[i][j]
            newRow.appendChild(cell)
        }
        output.appendChild(newRow);
    }
  
}
