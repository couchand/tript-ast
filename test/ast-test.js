var chai = require('chai')
chai.should()

ast = require('..').default

describe('tript ast', function() {
  describe('LiteralBoolean', function() {
    it('expects a value', function() {
      (function() {
        ast.LiteralBoolean()
      }).should.throw(/value/)
    })

    it('validates booleans', function() {
      ast.LiteralBoolean({
        value: true
      }).should.have.property('value', true)

      ast.LiteralBoolean({
        value: false
      }).should.have.property('value', false)
    })
  })

  describe('LiteralNumber', function() {
    it('expects a value', function() {
      (function() {
        ast.LiteralNumber()
      }).should.throw(/value/)
    })

    it('validates numbers', function() {
      ast.LiteralNumber({
        value: 0
      }).should.have.property('value', 0)

      ast.LiteralNumber({
        value: 42
      }).should.have.property('value', 42)
    })
  })

  describe('And', function() {
    it('expects children', function() {
      (function() {
        ast.And()
      }).should.throw(/children/)
    })

    it('validates empty children', function() {
      ast.And({
        children: []
      }).should.have.property('children').that.has.lengthOf(0)
    })

    // TODO: implement
    it('expects a child expression')//, function() {
    //  (function() {
    //    ast.And({
    //      children: [
    //        {
    //          foo: 'bar'
    //        }
    //      ]
    //    })
    //  }).should.throw(/children/)
    //})

    it('validates non-empty children', function() {
      ast.And({
        children: [
          ast.LiteralBoolean({ value: false })
        ]
      }).should.have.property('children').that.has.lengthOf(1)
    })
  })

  describe('Or', function() {
    it('expects children', function() {
      (function() {
        ast.Or()
      }).should.throw(/children/)
    })

    it('validates empty children', function() {
      ast.Or({
        children: []
      }).should.have.property('children').that.has.lengthOf(0)
    })

    // TODO: implement
    it('expects a child expression')//, function() {
    //  (function() {
    //    ast.Or({
    //      children: [
    //        {
    //          foo: 'bar'
    //        }
    //      ]
    //    })
    //  }).should.throw(/children/)
    //})

    it('validates non-empty children', function() {
      ast.Or({
        children: [
          ast.LiteralBoolean({ value: false })
        ]
      }).should.have.property('children').that.has.lengthOf(1)
    })
  })

  describe('Sum', function() {
    it('expects children', function() {
      (function() {
        ast.Sum()
      }).should.throw(/children/)
    })

    it('validates empty children', function() {
      ast.Sum({
        children: []
      }).should.have.property('children').that.has.lengthOf(0)
    })

    // TODO: implement
    it('expects a child expression')//, function() {
    //  (function() {
    //    ast.Sum({
    //      children: [
    //        {
    //          foo: 'bar'
    //        }
    //      ]
    //    })
    //  }).should.throw(/children/)
    //})

    it('validates non-empty children', function() {
      ast.Sum({
        children: [
          ast.LiteralNumber({ value: 42 })
        ]
      }).should.have.property('children').that.has.lengthOf(1)
    })
  })

  describe('Equal', function() {
    it('expects children', function() {
      (function() {
        ast.Equal()
      }).should.throw(/children/)
    })

    it('validates empty children', function() {
      ast.Equal({
        children: []
      }).should.have.property('children').that.has.lengthOf(0)
    })

    // TODO: implement
    it('expects a child expression')//, function() {
    //  (function() {
    //    ast.Equal({
    //      children: [
    //        {
    //          foo: 'bar'
    //        }
    //      ]
    //    })
    //  }).should.throw(/children/)
    //})

    it('validates non-empty children', function() {
      ast.Equal({
        children: [
          ast.LiteralBoolean({ value: false })
        ]
      }).should.have.property('children').that.has.lengthOf(1)
    })
  })

  describe('Function', function() {
    it('expects a name', function() {
      (function() {
        ast.Function({
          parameters: [],
          body: ast.LiteralBoolean({
            value: true
          })
        })
      }).should.throw(/name/)
    })

    it('expects a body', function() {
      (function() {
        ast.Function({
          name: 'foobar',
          parameters: []
        })
      }).should.throw(/body/)
    })

    it('expects parameters', function() {
      (function() {
        ast.Function({
          name: 'foobar',
          body: ast.LiteralBoolean({
            value: true
          })
        })
      }).should.throw(/parameters/)
    })

    it('validates', function() {
      var body = ast.LiteralBoolean({ value: true })

      var f = ast.Function({
        name: 'foobar',
        parameters: [],
        body: body
      })

      f.should.have.property('name').that.equals('foobar')
      f.should.have.property('parameters').that.has.lengthOf(0)
      f.should.have.property('body').that.equals(body)
    })
  })

  describe('Parameter', function() {
    it('expects a name', function() {
      (function() {
        ast.Parameter({
          type: 'Boolean'
        })
      }).should.throw(/name/)
    })

    it('expects a type', function() {
      (function() {
        ast.Parameter({
          name: 'foobar'
        })
      }).should.throw(/type/)
    })
  })

  describe('Reference', function() {
    it('expects a name', function() {
      (function() {
        ast.Reference()
      }).should.throw(/name/)
    })

    it('validates', function() {
      ast.Reference({
        name: 'foobar'
      }).should.have.property('name').that.equals('foobar')
    })
  })
})
