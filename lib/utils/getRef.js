// get a ref

function getRef(definitions, ref) {
  var lastSlash = ref.lastIndexOf('/')

  if (lastSlash === -1) {
    throw new Error('Unable to parse ref ' + ref)
  }

  var name = ref.slice(1 + lastSlash)

  if (!definitions.hasOwnProperty(name)) {
    throw new Error('Unknown type ' + name)
  }

  return definitions[name]
}

module.exports = getRef
