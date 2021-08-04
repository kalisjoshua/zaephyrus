const {createGraph} = require("./graph.js")

describe("createGraph", () => {
  test("create instance", () => {
    const inst = createGraph('b=main&c=&t=v1.0.0&t=latest&t=release-candidate&t=stable&b=another&c=Sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus&b=main&c=hotfix&c=new feature')

    // console.log(inst)

    // expect(inst).toMatchSnapshot()
  })
})
