// TODO: animation of the progress through time

const gitGraph = (function () {
  const createElement = (type) => document.createElement(type)
  const drawGraph = (gitCommands, options = {}) => new Graph(gitCommands, options)
  const mockSHA = () => Math.random().toString(36).slice(2, 7).toLowerCase()
  // [fake commands]  $   git   command    [options]       argument
  const rCommand = /^\$\s*git\s+([^\s]+)\s+(?:(-[\w]+)\s+)?([^$]+)$/
  const setAttributes = (x, l) => l.forEach(([k, v]) => x.setAttribute(k, v))
  const shape = (t) => document.createElementNS("http://www.w3.org/2000/svg", t)
  const use = (e, fn) => fn(e)

  const style = createElement("style")

  style.textContent = `
    body {
      margin: 0 auto;
      max-width: 60em;
    }

    figure.gitGraph, figure.gitGraph * {
      box-sizing: border-box;
    }

    figure.gitGraph {
      margin: 0;
      padding: 0;
      position: relative;
    }

    figure.gitGraph div {
      left: 0;
      overflow: scroll;
      position: absolute;
      top: 0;
    }

    figure.gitGraph ol {
      display: flex;
      flex-direction: column-reverse;
      justify-content: space-around;
      margin: 0;
      padding: 0;
    }

    figure.gitGraph ol li {
      font-family: monospace, sans-serif;
      list-style-type: none;
      white-space: nowrap;
    }

    figure.gitGraph svg {
      box-shadow: 0 0 5px 5px rgba(0, 0, 0, 0.1);
      width: 100%;
    }

    figure.gitGraph .branch {
      border: 1px solid;
      border-radius: 5px;
      margin-right: 1ex;
      padding: 0 1ex;
    }

    figure.gitGraph .tag {
      background: gainsboro;
      border: 1px solid gainsboro;
      border-radius: 5px;
      margin-right: 1ex;
      padding: 0 1ex;
    }
  `

  class Graph {
    constructor (commandsElement, options = {}) {
      this.options = {
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
        ...options
      }

      this.branches = {}
      this.head = null
      this.log = []
      this.objects = {}
      this.snapshots = []
      this.tags = {}

      this.parse(commandsElement.textContent)

      const figure = createElement("figure")

      figure.setAttribute("class", "gitGraph")

      commandsElement.after(figure)
      commandsElement.remove()

      this.render(figure)
    }

    executeCommand (command, option, argument) {
      const id = mockSHA()
      let stateChange = true

      switch (command.toLowerCase()) {
        case 'checkout':
          if (option === '-b') {
            this.branches[argument] = {
              head: null,
              links: this.branches[this.head] ? [this.branches[this.head].head] : null,
            }
          } else if (!this.branches[argument]) {
            throw new Error(`Branch '${argument}' not available.`)
          }

          stateChange = false

          this.head = argument
          break
        case 'commit':
          this.objects[id] = {
            branch: this.head,
            comment: argument.replace(/^"|"$/g, ""),
            links: this.branches[this.head].head
              ? [this.branches[this.head].head]
              : this.branches[this.head].links,
          }
          this.branches[this.head].head = id
          this.log.push(id)
          break
        case 'merge':
          this.objects[id] = {
            branch: this.head,
            comment: `Merge branch '${argument}' into '${this.head}'`,
            links: [this.branches[this.head].head, this.branches[argument].head],
          }
          this.branches[this.head].head = id
          this.log.push(id)
          break
        case 'tag':
          if (this.tags[argument]) {
            this.objects[this.tags[argument]].tags = this.objects[this.tags[argument]].tags
              .filter((tag) => tag !== argument)
          }

          (function (current) {
            current.tags = (current.tags || [])
              .concat(argument)
          }(this.objects[this.branches[this.head].head]))

          this.tags[argument] = this.branches[this.head].head
          break
        default:
          throw new Error(`Unrecognized git command '${[command, option, argument].filter(Boolean).join(' ')}'`)
          break
      }

      if (stateChange) {
        this.snapshots
          .push(JSON.stringify(this))
      }
    }

    parse (input) {
      input
        .trim()
        .split('\n')
        .forEach((line) => {
          const result = rCommand.exec(line.trim())

          if (result) {
            this.executeCommand(...result.slice(1))
          }
        })
    }

    render (figure) {
      const branchNames = Array.from(new Set(this.log
        .map((sha) => this.objects[sha].branch)))
      const branchOrder = (name) => branchNames.indexOf(name) + 1
      const graphHeight = (this.log.length + 1) * this.options.gridSize
      const graphWidth = this.options.gridSize * (branchNames.length + 1)

      const historyContainer = createElement("div")
      const historyElement = createElement("ol")
      const svgGraph = shape("svg")

      historyContainer.style = `
        height: ${graphHeight}px;
        margin-left: ${graphWidth}px;
        width: calc(100% - ${graphWidth}px);
      `

      historyElement.style = `
        height: ${graphHeight}px;
        padding: ${this.options.gridSize / 2}px 0;
      `

      svgGraph.style.height = `${graphHeight}px`

      figure.appendChild(historyContainer)
      figure.appendChild(svgGraph)
      historyContainer.appendChild(historyElement)

      this.log
        .reduce((acc, sha, index) => {
          const object = this.objects[sha]

          const dot = shape("circle")
          const cx = this.options.gridSize * branchOrder(object.branch)
          const cy = this.options.gridSize * (this.log.length - index)
          const fill = this.options.colors[branchOrder(object.branch) - 1]
          const item = createElement("li")
          const text = createElement("text")

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

          if (this.branches[object.branch].head === sha) {
            use(createElement("span"), (e) => {
              e.setAttribute("class", "branch")
              e.setAttribute("title", "Git branch name")
              e.innerText = object.branch

              item.appendChild(e)
            })
          }

          if (object.tags) {
            object.tags
              .forEach((tag) => {
                use(createElement("span"), (e) => {
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
          historyElement.appendChild(item)
          acc.push(dot)

          return acc
        }, [])
        .map((el) => svgGraph.appendChild(el))
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    document.head.appendChild(style)

    Array.from(document.querySelectorAll('[lang="gitGraph"]'))
      .map(drawGraph)
  })

  return {drawGraph}
}())
