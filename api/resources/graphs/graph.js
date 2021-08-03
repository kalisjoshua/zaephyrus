// TODO: animation of the progress through time using css keyframes

const GRID = 40
const attrs = (obj) => Reflect
  .ownKeys(obj)
  .sort()
  .reduce((acc, key) => `${acc} ${key}="${obj[key]}"`, '')
const use = (e, fn) => fn(e)

class Graph {
  constructor (commands = '', options = {}) {
    this.options = {
      colors: [
        "#603AA1",
        "#1C6EF2",
        "#298540",
        "#D47500",
        "#C8102E",
      ],
      gridSize: GRID,
      pointSize: GRID / 4,
      strokeWidth: GRID / 5,
      ...options
    }

    this.branches = {}
    this.head = null
    this.log = []
    this.objects = {}
    this.snapshots = []
    this.tags = {}

    commands
      .replace(/^\?/, '')
      .split('&')
      .map((line) => line.split('='))
      .forEach((command) => this.execute(command))
  }

  circle (config) {

    return `<circle${attrs({r: this.options.pointSize, ...config})}></circle>`
  }

  execute ([command, argument]) {
    const id = Math.random().toString(36).slice(2, 7).toLowerCase()
    let stateChange = true

    switch (command.toLowerCase()) {
      case 'b':
        this.branches[argument] = this.branches[argument] || {
          head: null,
          links: this.branches[this.head] ? [this.branches[this.head].head] : [],
        }

        stateChange = false

        this.head = argument
        break
      case 'c':
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
      case 'm':
        this.objects[id] = {
          branch: this.head,
          comment: `Merge branch '${argument}' into '${this.head}'`,
          links: [this.branches[this.head].head, this.branches[argument].head],
        }
        this.branches[this.head].head = id
        this.log.push(id)
        break
      case 't':
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
        throw new Error(`Unrecognized git command '${command}'`)
        break
    }

    // if (stateChange) {
    //   this.snapshots
    //     .push(JSON.stringify(this))
    // }
  }

  line (config) {

    return `<line${attrs({"stroke-width": this.options.strokeWidth, ...config})}></line>`
  }

  render (figure) {
    const branchNames = Array.from(new Set(this.log
      .map((sha) => this.objects[sha].branch)))
    const branchOrder = (name) => branchNames.indexOf(name) + 1
    const graphHeight = (this.log.length + 1) * this.options.gridSize
    // const graphWidth = this.options.gridSize * (branchNames.length + 1)
    const graphWidth = 960

    const elements = this.log
      .flatMap((sha, index) => {
        const object = this.objects[sha]

        object.svgProps = {
          cx: this.options.gridSize * branchOrder(object.branch),
          cy: this.options.gridSize * (this.log.length - index),
          fill: this.options.colors[branchOrder(object.branch) - 1],
        }
        object.links = object.links
          .map((sha) => this.line({
            x1: this.objects[sha].svgProps.cx,
            y1: this.objects[sha].svgProps.cy,
            x2: object.svgProps.cx,
            y2: object.svgProps.cy,
            stroke: object.links.length === 1
              ? object.svgProps.fill
              : this.objects[sha].svgProps.fill,
          }))
        object.svgElement = this.circle({...object.svgProps})

        return [object, ...object.links]
      })
      .map((item) => item.svgElement || item)
      .sort()
      .reverse()
      .join('\n')

    const svgAttrs = attrs({
       style: `height: ${graphHeight}px; width: ${graphWidth}px;`,
       viewBox: `0 0 ${graphWidth} ${graphHeight}`,
       xmlns: "http://www.w3.org/2000/svg",
    })

    return `
    <svg ${svgAttrs}>
      <defs>
        <style type="text/css"><![CDATA[
          svg {}
        ]]></style>
      </defs>

      <g>${elements}</g>
    </svg>`
  }
}

module.exports = {
  createGraph: (commands, options) => new Graph(commands, options).render()
}
