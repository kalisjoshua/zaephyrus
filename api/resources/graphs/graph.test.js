const {createGraph} = require("./graph.js")

describe("createGraph", () => {
  test("create instance", () => {
    const inst = createGraph('b=main&c=&t=v1.0.0&t=latest&t=release-candidate&t=stable&b=another&c=testing something out some really long commit first line subject not advisable to do this in real life&b=main&c=hotfix&c=new feature')

    expect(inst).toMatchSnapshot()
  })
})
