function Calculator() {
  this.tokenStream = [];
}

Calculator.prototype.lexer = function (inputString) {
  let tokenTypes = [
    ["NUMBER",    /^\d+/ ],
    ["ADD",       /^\+/  ],
    ["SUB",       /^\-/  ],
    ["MUL",       /^\*/  ],
    ["DIV",       /^\//  ],
    ["LPAREN",    /^\(/  ],
    ["RPAREN",    /^\)/  ]
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
        this.tokenStream.push({ name: token, value: result[0] });
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
