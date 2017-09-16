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
}

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
}

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
}

Calculator.prototype.parseTerm = function () {
  let factor = this.parseFactor();
  let b = this.parseB();

  return new TreeNode('Term', factor, b);
}

Calculator.prototype.parseFactor = function () {
  let nextToken = this.peek();

  if (nextToken && nextToken.name === 'LPAREN') {
    this.get();
    let expression = this.parseExpression();
    this.get();
    return new TreeNode('Factor', '(' + expression + ')');
  } else if (nextToken && nextToken.name === 'SUB') {
    this.get();
    return new TreeNode('Factor', '-', this.parseFactor);
  } else if (nextToken && nextToken.name === 'NUMBER') {
    this.get();
    return new TreeNode(nextToken.value);
  }
}

var calculator = new Calculator("(3)");

// make a fake version of parseExpression
var fakeExpressionTreeNode = new TreeNode("Expression", "3");
calculator.parseExpression = function() {
  this.get(); // remove the 3 when parseFactor runs
  return fakeExpressionTreeNode;
}

var output = calculator.parseFactor();
// check that
// output.name == "Factor"
// output.children = ["(", fakeExpressionTreeNode, ")"];
console.log(output);

function TreeNode(name, ...children) {
  this.name = name;
  this.children = children;
}
