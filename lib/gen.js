// generate AST helpers based on the Tript schema

var fs = require('fs')
var path = require('path')

var ast = require('shift-ast')
var codegen = require('shift-codegen')

var schema = require('tript-schema')

var getRef = require('./utils/getRef')
var flattenRefs = require('./utils/flattenRefs')

function throwIf(expression, message) {
  return new ast.IfStatement({
    test: expression,
    consequent: new ast.ThrowStatement({
      expression: new ast.NewExpression({
        callee: new ast.IdentifierExpression({
          name: 'Error'
        }),
        arguments: [
          new ast.LiteralStringExpression({
            value: message
          })
        ]
      })
    })
  })
}

function propRef(prop) {
  return new ast.StaticMemberExpression({
    object: new ast.IdentifierExpression({
      name: 'props'
    }),
    property: prop
  })
}

function logicalInverse(expr) {
  return new ast.UnaryExpression({
    operator: '!',
    operand: expr
  })
}

function notInstanceOf(item, type) {
  return logicalInverse(new ast.BinaryExpression({
    operator: 'instanceof',
    left: item,
    right: new ast.StaticMemberExpression({
      object: new ast.IdentifierExpression({
        name: 'types'
      }),
      property: type
    })
  }))
}

function typeNot(item, typeDef) {
  var type = typeDef.type

  if (type === 'object') {
    return notInstanceOf(item, typeName(typeDef) + 'Node')
  }

  if (type === 'array') {
    return logicalInverse(new ast.CallExpression({
      callee: new ast.StaticMemberExpression({
        object: new ast.IdentifierExpression({
          name: 'Array'
        }),
        property: 'isArray'
      }),
      arguments: [item]
    }))
  }

  return new ast.BinaryExpression({
    operator: '!==',
    left: new ast.UnaryExpression({
      operator: 'typeof',
      operand: item
    }),
    right: new ast.LiteralStringExpression({
      value: type
    })
  })
}

function matches(item, pattern) {
  return new ast.CallExpression({
    callee: new ast.StaticMemberExpression({
      object: item,
      property: 'match'
    }),
    arguments: [
      new ast.LiteralStringExpression({
        value: pattern
      })
    ]
  })
}

function resolveType(typeDef) {
  var next = typeDef

  while (next['$ref']) {
    next = getRef(schema.definitions, next['$ref'])
  }

  return next
}

function typeNotIn(item, types) {
  function kernel(prev, options) {
    if (options.length === 0) {
      return prev
    }

    return kernel(
      new ast.BinaryExpression({
        operator: '&&',
        left: prev,
        right: typeNot(item, options[0])
      }),
      options.slice(1)
    )
  }

  if (types.length === 0) {
    throw new Error('Expected at least one type')
  }

  return kernel(
    typeNot(item, types[0]),
    types.slice(1)
  )
}

function typeName(ty) {
  return ty.properties.type.enum[0]
}

function typeCheck(prop, typeDef) {
  var item = propRef(prop)
  var type = resolveType(typeDef)

  if (!type || !(type.type || type.oneOf)) {
    throw new Error('Unable to find type ' + JSON.stringify(type))
  }

  if (type.oneOf) {
    var candidateTypes = flattenRefs(schema.definitions, type)
    var candidateTypeNames = candidateTypes.map(function(ty) {
      return typeName(ty)
    })

    return [
      throwIf(
        typeNotIn(item, candidateTypes),
        'Expected property ' + prop + ' to be one of [' + candidateTypeNames + ']'
      )
    ]
  }

  var checks = [throwIf(
    typeNot(item, type),
    'Expected property ' + prop + ' to be of type ' + type.type
  )]

  if (type.type === 'array') {
    // TODO: check element type
  }

  if (type.pattern) {
    checks.push(throwIf(
      logicalInverse(matches(item, type.pattern)),
      'Expected property ' + prop + ' to match pattern "' + type.pattern + '"'
    ))
  }

  return checks
}

function selfAssign(name) {
  return new ast.ExpressionStatement({
    expression: new ast.AssignmentExpression({
      binding: new ast.StaticMemberExpression({
        object: new ast.ThisExpression(),
        property: name
      }),
      expression: propRef(prop)
    })
  })
}

function checkNew(name) {
  return new ast.IfStatement({
    test: notInstanceOf(
      new ast.ThisExpression(),
      name
    ),
    consequent: new ast.ReturnStatement({
      expression: new ast.NewExpression({
        callee: new ast.StaticMemberExpression({
          object: new ast.IdentifierExpression({
            name: 'types'
          }),
          property: name
        }),
        arguments: [
          new ast.IdentifierExpression({
            name: 'props'
          })
        ]
      })
    })
  })
}

function generateConstructor(name, ty, includeType) {
  var checks = []
  var assigns = []

  for (prop in ty.properties) {
    if (prop === 'type' && !includeType) {
      continue
    }

    var propType = ty.properties[prop]

    checks = checks.concat(typeCheck(prop, propType))
    assigns.push(selfAssign(prop))
  }

  for (var i = 0, e = ty.required.length; i < e; i += 1) {
    if (prop === 'type' && !includeType) {
      continue
    }
  }

  return new ast.Method({
    name: new ast.BindingIdentifier({
      name: name + 'Node'
    }),
    isGenerator: false,
    params: new ast.FormalParameters({
      items: [
        new ast.BindingIdentifier({
          name: 'props'
        })
      ]
    }),
    body: new ast.FunctionBody({
      directives: [],
      statements: [checkNew(name + 'Node')].concat(checks, assigns)
    })
  })
}

var expressionTypes = flattenRefs(schema.definitions, schema.definitions.expression)

var constructors = [
  generateConstructor('Function', schema),
  generateConstructor('Parameter', schema.definitions.parameter, true)
]

for (var i = 0, e = expressionTypes.length; i < e; i += 1) {
  var ty = expressionTypes[i]
  var name = typeName(ty)

  constructors.push(generateConstructor(name, ty))
}

var code = codegen.default(new ast.Module({
  directives: [],
  items: [
    new ast.VariableDeclarationStatement({
      declaration: new ast.VariableDeclaration({
        kind: 'const',
        declarators: [
          new ast.VariableDeclarator({
            binding: new ast.BindingIdentifier({
              name: 'types'
            }),
            init: new ast.ObjectExpression({
              properties: constructors
            })
          })
        ]
      })
    }),
    new ast.ExportDefault({
      body: new ast.IdentifierExpression({
        name: 'types'
      })
    })
  ]
}), new codegen.FormattedCodeGen())

fs.writeFileSync(path.join(__dirname, '..', 'gen', 'index.js'), code)
