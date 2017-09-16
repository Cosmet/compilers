function Calculator(inputString) {
  this.tokenStream = this.lexer(inputString);

}

Calculator.prototype.lexer = function (inputString) {
  var tokenTypes = [
    ["NUMBER", /^\d+/],
    ["ADD", /^\+/],
    ["SUB", /^\-/],
    ["MUL", /^\*/],
    ["DIV", /^\//],
    ["LPAREN", /^\(/],
    ["RPAREN", /^\)/]
  ];

  var tokens = [];
  var matched = true;

  while (inputString.length > 0 && matched) {
    matched = false;
    tokenTypes.forEach(tokenRegex => {
      var token = tokenRegex[0];
      var regex = tokenRegex[1];

      var result = regex.exec(inputString);

      if (result !== null) {
        matched = true;
        tokens.push({
          name: token,
          value: result[0]
        });
        inputString = inputString.slice(result[0].length);
      }
    })

    if (!matched) {
      throw new Error("Found unparseable token: " + inputString);
    }

  }

  return tokens;

}

Calculator.prototype.peek = function () {
  return this.tokenStream[0];
}

Calculator.prototype.get = function () {
  return this.tokenStream.shift();
}


function TreeNode(name, ...children) {
  this.name = name;
  this.children = children;
}

// Expression => Term A
Calculator.prototype.parseExpression = function () {
  var term = this.parseTerm();
  var a = this.parseA();

  return new TreeNode("Expression", term, a);
}

// Expression => Term A
Calculator.prototype.parseTerm = function () {
  var factor = this.parseFactor();
  var b = this.parseB();

  return new TreeNode("Term", factor, b);
}

/*
    A => + Term A
    A => - Term A
    A => epsilon
*/
Calculator.prototype.parseA = function () {
  var nextToken = this.peek();

  if (nextToken && nextToken.name === "ADD") {
    this.get(); // pulls plus sign off token stream
    return new TreeNode("A", "+", this.parseTerm(), this.parseA()); // 1+2+3+4+5
  } else if (nextToken && nextToken.name == "SUB") {
    this.get();
    return new TreeNode("A", "-", this.parseTerm(), this.parseA());
  } else {
    return new TreeNode("A")
  }
}

// B => * F B
// B => / F B
// B => epsilon
Calculator.prototype.parseB = function () {
  var nextToken = this.peek();

  if (nextToken && nextToken.name === "MUL") {
    this.get(); // pulls plus sign off token stream
    return new TreeNode("B", "*", this.parseFactor(), this.parseB()); // 1+2+3+4+5
  } else if (nextToken && nextToken.name == "DIV") {
    this.get();
    return new TreeNode("B", "/", this.parseFactor(), this.parseB());
  } else {
    return new TreeNode("B")
  }
}

// Factor
/* Factor => Number
      ( Expression )
          - Factor
*/

Calculator.prototype.parseFactor = function () {
  var nextToken = this.peek();

  if (nextToken.name === "NUMBER") {
    return new TreeNode("Factor", this.get().value);
  } else if (nextToken.name === "LPAREN") {
    // tokenStream => [ "(", EXPRESSION...., ")"]
    this.get();
    var expr = this.parseExpression();
    this.get();
    return new TreeNode("Factor", "(", expr, ")");
  } else if (nextToken.name === "SUB") {
    return new TreeNode("Factor", "-", this.parseFactor());
  } else {
    throw new Error("Expected to find a factor.");
  }
}


TreeNode.prototype.accept = function (visitor) {
  return visitor.visit(this);
}


function PrintOriginalVisitor() {}

PrintOriginalVisitor.prototype.visit = function (node) {
  switch (node.name) {
    case "Expression":
      var term = node.children[0].accept(this);
      var a = node.children[1].accept(this);
      return term + a;
      break;
    case "Term":
      var factor = node.children[0].accept(this);
      var b = node.children[1].accept(this);
      return factor + b;
      break;
    case "A":
      // +/-, or nothing which means this is epsilon A
      if (node.children.length > 0) {
        return node.children[0] + node.children[1].accept(this) + node.children[2].accept(this);
        // +                     3                  ""
      } else {
        // epsilon
        return "";
      }
      break;
    case "B":
      if (node.children.length > 0) {
        return node.children[0] + node.children[1].accept(this) + node.children[2].accept(this);
        // +                     3                  ""
      } else {
        // epsilon
        return "";
      }
      break;
    case "Factor":
      if (node.children[0] === "(") {
        // (E)
        return "(" + node.children[1].accept(this) + ")";
      } else if (node.children[0] === "-") {
        return "-" + node.children[1].accept(this);
      } else {
        return node.children[0];
      }
      break;
  }
}



function RPNVisitor() {}

RPNVisitor.prototype.visit = function (node) {
  switch (node.name) {
    case "Expression":
      return node.children[0].accept(this) + " " + node.children[1].accept(this);
      break;
    case "Term":
      return node.children[0].accept(this) + " " + node.children[1].accept(this);
      break;
    case "A": // + T A ---> TA+  3+2  3 2 +
      if (node.children.length > 0) {
        return node.children[1].accept(this) + " " + node.children[2].accept(this) + " " + node.children[0];
      } else {
        return "";
      }
      break;
    case "B":
      if (node.children.length > 0) {
        return node.children[1].accept(this) + " " + node.children[2].accept(this) + " " + node.children[0];
      } else {
        return "";
      }
      break;
    case "Factor":
      if (node.children[0] === "(") {
        return node.children[1].accept(this);
      } else if (node.children[0] === "-") {
        return "-" + node.children[1].accept(this);
      } else {
        return node.children[0];
      }
      break;
  }
}

function CalcVisitor() {

}

CalcVisitor.prototype.visit = function (node) {
  var myselfTheVisitor = this;
  switch (node.name) {
    case "Expression":
      // E -> TA
      var t = node.children[0].accept(this);
      var a = node.children[1].accept(this);
      return t + a;
      break;
    case "Term":
      var f = node.children[0].accept(this);
      var b = node.children[1].accept(this);
      return f * b;
      break;
    case "A":
      // A -> + T A
      if (node.children.length > 0) {
        var val = node.children[1].accept(this) + node.children[2].accept(this);
        if (node.children[0] === "+") {
          return val;
        } else if (node.children[0] === "-") {
          return -1 * val;
        }
      } else {
        // epsilon
        return 0;
      }
      break;
    case "B":
      // A -> + T A
      if (node.children.length > 0) {
        var val = node.children[1].accept(this) * node.children[2].accept(this);
        if (node.children[0] === "*") {
          return val;
        } else if (node.children[0] === "/") {
          return 1 / val;
        }
      } else {
        // epsilon
        return 1;
      }
      break;
      break;
    case "Factor":
      if (node.children[0] === "(") {
        return node.children[1].accept(this); // expressionv alue
      } else if (node.children[0] === "-") {
        return -1 * node.children[1].accept(this);
      } else {
        return Number(node.children[0]);
      }

      break;
  }
}



var calc = new Calculator("1+2+(3*4)");
var expressionNode = calc.parseExpression();

var printVisitor = new PrintOriginalVisitor();
var outputPrintVisitor = expressionNode.accept(printVisitor);
console.log(outputPrintVisitor);

var rpnVisitor = new RPNVisitor();
var outputRPNVisitor = expressionNode.accept(rpnVisitor);
console.log("rpn" + outputRPNVisitor);
