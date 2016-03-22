// flatten refs

var getRef = require('./getRef')

function flattenRefs(definitions, top) {
  function findRefs(type) {
    if (type.oneOf) {
      return Array.prototype.concat.apply([], type.oneOf.map(findRefs))
    }

    if (type['$ref']) {
      var definition = getRef(definitions, type['$ref'])
      return findRefs(definition)
    }

    return [type]
  }

  return findRefs(top)
}

module.exports = flattenRefs
