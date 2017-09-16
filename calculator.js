function Calculator() {
  this.tokenStream = [];
}

Calculator.prototype.lexer = function (inputString) {
  let tokenTypes = [
    ["NUMBER", /^\d+/],
    ["ADD", /^\+/],
    ["SUB", /^\-/],
    ["MUL", /^\*/],
    ["DIV", /^\//],
    ["LPAREN", /^\(/],
    ["RPAREN", /^\)/]
  ];

  let matched = true;

  while (inputString.length > 0 && matched) {
    matched = false;

    tokenTypes.forEach(tokenRegex => {
      let token = tokenRegex[0],
        regex = tokenRegex[1];

      let result = regex.exec(inputString);

      if (result.length) {
        matched = true;
        this.tokenStream.push({
          name: token,
          value: result[0]
        });
        inputString = inputString.slice(result[0].length);
      }
    });

    if (!matched) {
      throw new Error('Found unparsable token: ' + inputString);
    }
  }
};

Calculator.prototype.peek = function () {
  return this.tokenStream[0] || null;
};

Calculator.prototype.get = function () {
  return this.tokenStream.shift();
};

Calculator.prototype.parseExpression = function () {
  let term = this.parseTerm();
  let a = this.parseA();

  return new TreeNode('Expression', term, a);
};

Calculator.prototype.parseA = function () {
  let nextToken = this.peek();

  if (nextToken && nextToken.name === 'ADD') {
    this.get();
    return new TreeNode('A', '+', this.parseTerm(), this.parseA());
  } else if (nextToken && nextToken.name === 'SUB') {
    this.get();
    return new TreeNode('A', '-', this.parseTerm(), this.parseA());
  } else {
    return new TreeNode('A');
  }
};

Calculator.prototype.parseB = function () {
  let nextToken = this.peek();

  if (nextToken && nextToken.name === 'MUL') {
    this.get();
    return new TreeNode('B', '*', this.parseFactor(), this.parseB());
  } else if (nextToken && nextToken.name === 'DIV') {
    this.get();
    return new TreeNode('B', '/', this.parseFactor(), this.parseB());
  } else {
    return new TreeNode('B');
  }
};

Calculator.prototype.parseTerm = function () {
  let factor = this.parseFactor();
  let b = this.parseB();

  return new TreeNode('Term', factor, b);
};

Calculator.prototype.parseFactor = function () {
  let nextToken = this.peek();

  if (nextToken && nextToken.name === 'LPAREN') {
    this.get();
    let expression = this.parseExpression();
    this.get();
    return new TreeNode('Factor', '(' + expression + ')');
  } else if (nextToken && nextToken.name === 'SUB') {
    this.get();
    return new TreeNode('Factor', '-', this.parseFactor());
  } else if (nextToken && nextToken.name === 'NUMBER') {
    this.get();
    return new TreeNode('NUMBER', nextToken); //???
  }
};

function TreeNode(name, ...children) {
  this.name = name;
  this.children = children;
}

TreeNode.prototype.accept = function(visitor) {
  return visitor.visit(this);
};

function InfixVisitor() {
  this.visit = function(node) {
    if (node.name === "Expression") {
      return node.children[0].accept(this) + node.children[1].accept(this);
    }
    else if (node.name === "A") {
      if(node.children.length > 0) {
        return  node.children[0] + node.children[1].accept(this) + node.children[2].accept(this);
      } else {
        return "";
      }
    }
    else if (node.name === "Term") {

    }
    else if (node.name === "Factor") {

    }
    else if (node.name === "B") {

    }
  }
}

function PostfixVisitor() {
  this.visit = function(node) {
    if (node.name === "Expression") {
      return node.children[0].accept(this) + node.children[1].accept(this);
    }
    else if (node.name === "Term") {
      return node.children[0].accept(this) + node.children[1].accept(this);
    }
    else if (node.name === "A") {
      if(node.children.length > 0) {
        return node.children[1].accept(this) + node.children[2].accept(this) + node.children[0];
      } else {
        return "";
      }
    }
    else if (node.name === "Factor") {
      if(node.children[0] === "(" ){
        return node.children[1].accept(this);
      } else if(node.children[0] ==="-") {
        return "-" + node.children[1].accept(this);
      } else{
        return node.children[0];
      }
    }
    else if (node.name === "B") {
      if(node.children.length > 0) {
        return node.children[1].accept(this) + node.children[2].accept(this) + node.children[0];
      } else {
        return "";
      }
    }
  }
}

function InfixVisitorCalc() {
  this.visit = function(node) {
    switch(node.name) {
      case "Expression":
        // return node.children[0].accept(this) + node.children[1].accept(this);
        var t = node.children[0].accept(this);
        var a = node.children[1].accept(this);
        console.log("t, a", t, a);
        return t+a;
        break;
      case "Term":
        var f = node.children[0].accept(this);
        var b = node.children[1].accept(this);
        console.log("f, b", f, b);
        return f+b;
        break;
      case "A":
        if(node.children.length > 0) {
          var val = node.children[1].accept(this) + node.children[2].accept(this);
          if(node.children[0] == "+") {
            return val;
          } else {
            return 0 - val;
          }

        } else {
          return 1;
        }
      case "Factor": // needs to be done
      case "B":
        if(node.children.length > 0) {
          var val = node.children[1].accept(this) * node.children[2].accept(this);
          if(node.children[0] == "*") {
            return val;
          } else {
            return 1/val;
          }

        } else {
          return 1;
        }
        break;
      default:
        break;
    }
  }
}

var calc = new Calculator("3+4*5");
var tree = calc.parseExpression()
var printOriginalVisitor = new PrintOriginalVisitor()
console.log(tree.accept(printOriginalVisitor));
