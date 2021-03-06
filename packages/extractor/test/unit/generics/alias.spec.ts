describe('first type parameter', () => {
  it('the name', () => {
    const edd = ctx.extract2(/* ts */ `
      export type Foo<T> = {}
    `)
    expect(edd.types.getAlias('(a).Foo').typeParameters).toMatchSnapshot()
  })

  it('the primitive type default', () => {
    const edd = ctx.extract2(/* ts */ `
      export type Foo<T = string> = {}
    `)
    expect(edd.types.getAlias('(a).Foo').typeParameters).toMatchSnapshot()
  })

  it('the alias object type default is added to the type index and refererenced', () => {
    const edd = ctx.extract2(/* ts */ `
      export type Bar = { a: 1 }
      export type Foo<T = Bar> = {}
    `)
    expect(edd.types.getAlias('(a).Foo').typeParameters).toMatchSnapshot()
    expect(edd.types.getAlias('(a).Bar')).toMatchSnapshot()
  })

  it('the interface object type default is added to the type index and refererenced', () => {
    const edd = ctx.extract2(/* ts */ `
      export interface Bar { a: 1 }
      export type Foo<T = Bar> = {}
    `)
    expect(edd.types.getAlias('(a).Foo').typeParameters).toMatchSnapshot()
    expect(edd.types.getInterface('(a).Bar')).toMatchSnapshot()
  })
})

describe('standard library generic instances have type arguments captured and generic target set as external', () => {
  it('Record', () => {
    const edd = ctx.extract2(/*ts*/ `
      export type A = Record<string,number>
    `)
    expect(edd.exports.first('A')).toMatchSnapshot()
  })
})

describe('bugs', () => {
  it('generic instance within union type', () => {
    const edd = ctx.extract2(/*ts*/ `
      export type A = 1 | Record<string, 2>
    `)
    expect(edd.types.getAlias('(a).A')).toMatchSnapshot()
  })
})
