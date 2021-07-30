// TODO: make embed-able as a single js file
// TODO: animation of the progress through time

const gitGraph = (function () {
  const defaults = {
    colors: [
      "#603AA1",
      "#1C6EF2",
      "#298540",
      "#D47500",
      "#C8102E",
    ],
    gridSize: 40,
    pointSize: 10,
    strokeWidth: 8,
  }

  const createId = () => Math.random().toString(36).toLowerCase()
  const element = (type) => document.createElement(type)
  // [fake commands]  $   git   command    [options]       argument
  const rCommand = /^\$\s*git\s+([^\s]+)\s+(?:(-[\w]+)\s+)?([^$]+)$/
  const setAttributes = (x, z) => z.forEach(([k, v]) => x.setAttribute(k, v))
  const shape = (t) => document.createElementNS("http://www.w3.org/2000/svg", t)
  const use = (e, fn) => fn(e)

  function buildHistory ({branches, head, log, objects, snapshots, tags}, matches) {
    const id = Math.random().toString(36).slice(2, 7).toUpperCase()
    const [command, option, argument] = matches
    let stateChange = true

    switch (command.toLowerCase()) {
      case 'checkout':
        if (option === '-b') {
          branches[argument] = {
            head: null,
            links: branches[head] ? [branches[head].head] : null,
          }
        } else if (!branches[argument]) {
          throw new Error(`Branch '${argument}' not available.`)
        }

        stateChange = false

        head = argument
        break
      case 'commit':
        objects[id] = {
          branch: head,
          comment: argument.replace(/^"|"$/g, ""),
          links: branches[head].head
            ? [branches[head].head]
            : branches[head].links,
        }
        branches[head].head = id
        log.push(id)
        break
      case 'merge':
        objects[id] = {
          branch: head,
          comment: `Merge branch '${argument}' into '${head}'`,
          links: [branches[head].head, branches[argument].head],
        }
        branches[head].head = id
        log.push(id)
        break
      case 'tag':
        if (tags[argument]) {
          objects[tags[argument]].tags = objects[tags[argument]].tags
            .filter((tag) => tag !== argument)
        }

        (function (current) {
          current.tags = (current.tags || [])
            .concat(argument)
        }(objects[branches[head].head]))

        tags[argument] = branches[head].head
        break
      default:
        throw new Error(`Unrecognized git command '${[command, option, argument].filter(Boolean).join(' ')}'`)
        break
    }

    if (stateChange) {
      snapshots.push(JSON.stringify({branches, head, log, objects, tags}))
    }

    return {branches, head, log, objects, snapshots, tags}
  }

  function createGraphElement (sourceElement) {
    const figure = element("figure")
    const state = sourceElement.textContent
      .trim()
      .split('\n')
      .map((line) => rCommand.exec(line.trim()))
      .filter(Boolean)
      .map((results) => results.slice(1))
      .reduce(buildHistory, {
        branches: {},
        head: null,
        log: [],
        objects: {},
        snapshots: [],
        tags: {},
      })

    figure.setAttribute("class", "gitGraph")
    figure.appendChild(shape("svg"))
    sourceElement.after(figure)
    sourceElement.remove()

    return {figure, state}
  }

  function createGraphPieces (acc, sha, index) {
    const object = this.repo.objects[sha]

    const dot = shape("circle")
    const cx = this.options.gridSize * this.branchOrder(object.branch)
    const cy = this.options.gridSize * (this.repo.log.length - index)
    const fill = this.options.colors[this.branchOrder(object.branch) - 1]
    const item = element("li")
    const text = element("text")

    if (object.links) {
      object.links
        .forEach((sha, index) => {
          const parent = acc.filter((el) => el.dataset.sha === sha)[0]
          const line = shape("line")
          const strokeColor = object.links.length === 2
            ? parent.getAttribute("fill")
            : fill

          setAttributes(line, [
            ["x1", cx],
            ["y1", cy],
            ["x2", parent.getAttribute("cx")],
            ["y2", parent.getAttribute("cy")],
            ["stroke", strokeColor],
            ["stroke-width", this.options.strokeWidth],
          ])

          acc.unshift(line)
        })
    }

    if (this.repo.branches[object.branch].head === sha) {
      use(element("span"), (e) => {
        e.setAttribute("class", "branch")
        e.setAttribute("title", "Git branch name")
        e.innerText = object.branch

        item.appendChild(e)
      })
    }

    if (object.tags) {
      object.tags
        .forEach((tag) => {
          use(element("span"), (e) => {
            e.setAttribute("class", "tag")
            e.setAttribute("title", "Git tag")
            e.innerText = tag

            item.appendChild(e)
          })
        })
    }

    setAttributes(dot, [
      ["cx", cx],
      ["cy", cy],
      ["r", this.options.pointSize],
      ["fill", fill],
    ])

    dot.dataset.sha = sha
    text.innerText = object.comment
    item.appendChild(text)
    this.historyElement.appendChild(item)
    acc.push(dot)

    return acc
  }

  function drawGraph (gitCommands, options = {}) {
    options = {...defaults, ...options}

    const {figure, state: {snapshots, ...repo}} = createGraphElement(gitCommands)

    const branchNames = Array.from(new Set(repo.log
      .map((sha) => repo.objects[sha].branch)))
    const branchOrder = (name) => branchNames.indexOf(name) + 1
    const graphHeight = (repo.log.length + 1) * options.gridSize
    const graphWidth = options.gridSize * (branchNames.length + 1)
    const historyContainer = element("div")
    const historyElement = element("ol")
    const visualElement = figure.querySelector("svg")

    historyContainer.style.marginLeft = `${graphWidth}px`
    historyContainer.style.width = `calc(100% - ${graphWidth}px)`
    historyContainer.style.height = graphHeight
    historyElement.style.height = graphHeight
    historyElement.style.padding = `${options.gridSize / 2}px 0`
    visualElement.style.height = graphHeight

    figure.appendChild(historyContainer)
    historyContainer.appendChild(historyElement)

    repo.log
      .reduce(createGraphPieces.bind({repo, branchOrder, options, historyElement}), [])
      .map((el) => visualElement.appendChild(el))
  }

  window.addEventListener("DOMContentLoaded", () => {
    Array.from(document.querySelectorAll('[lang="gitGraph"]'))
      .map(drawGraph)
  })

  return {drawGraph}
}())
