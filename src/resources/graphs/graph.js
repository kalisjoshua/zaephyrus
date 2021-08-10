const attrs = (obj) => Reflect
  .ownKeys(obj)
  .sort()
  .reduce((acc, key) => `${acc} ${key}="${obj[key]}"`, '')
const int = (s) => parseInt(s, 10)
const textToQS = (text) => text
  .trim()
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => line.split(" "))
  .reduce((acc, [[command], ...rest]) => `${acc}&${command}=${rest.join(" ")}`,"")
  .replace(/^&|"/g, "")

class Graph {
  constructor (commands = '', options = {grid: 40}) {
    const rAnimate = /&a(?:nimate)?=(auto|hover|true)$/

    this.options = {
      animate: (rAnimate.exec(commands) || []).slice(1).shift() || false,
      colors: [
        "#603AA1",
        "#1C6EF2",
        "#298540",
        "#D47500",
        "#C8102E",
      ],
      fontSize: 14,
      gridSize: options.grid,
      pointSize: options.grid / 4,
      strokeWidth: options.grid / 5,
      ...options
    }

    this.branches = {}
    this.head = null
    this.log = []
    this.objects = {}
    this.snapshots = []
    this.tags = {}

    commands
      .replace(/^\?/, "")
      .replace(rAnimate, "")
      .split('&')
      .map((line) => line.split('='))
      .forEach((command) => this.execute(command))
  }

  execute ([command, argument]) {
    const id = Math.random().toString(36).slice(2, 7).toLowerCase()
    let stateChange = true

    switch (command.toLowerCase()[0]) {
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
          comment: `merge branch '${argument}' into '${this.head}'`,
          // TODO: links will need to map over all merge heads and add links for each
          links: [this.branches[this.head].head, this.branches[argument].head],
        }
        this.branches[this.head].head = id
        this.log.push(id)
        break
      case 't':
        if (this.tags[argument]) {
          const ref = this.objects[this.tags[argument]]

          ref.tags = ref.tags
            .filter((tag) => tag !== argument)
        }

        if (this.branches[this.head].head) {
          (function (current) {
            current.tags = (current.tags || [])
              .concat(argument)
          }(this.objects[this.branches[this.head].head]))
        } else {
          // throw new Error(`A tag must be added to a commit; there is no commit available to tag.`)
          // TODO: need to figure out how to send this error back or not have it be an error...
        }

        this.tags[argument] = this.branches[this.head].head
        break
      default:
        throw new Error(`Unrecognized git command '${command}'`)
        break
    }

    if (stateChange && this.options.animate) {
      this.snapshots
        .push(this.keyFrame())
    }
  }

  keyFrame () {
    const branchNames = Array.from(new Set(this.log
      .map((sha) => this.objects[sha].branch)))
    const branchOrder = (name) => branchNames.indexOf(name) + 1

    return this.log
      .flatMap((sha, index) => {
        const object = this.objects[sha]

        object.svgProps = {
          cx: this.options.gridSize * branchOrder(object.branch),
          cy: this.options.gridSize * (this.log.length - index),
          fill: this.options.colors[branchOrder(object.branch) - 1],
        }
        object.svgElement = this.svgCircle({...object.svgProps})

        return [
          object,
          ...object.links
            .map((sha) => this.svgLine({
              x1: this.objects[sha].svgProps.cx,
              y1: this.objects[sha].svgProps.cy,
              x2: object.svgProps.cx,
              y2: object.svgProps.cy,
              stroke: object.links.length === 1
                ? object.svgProps.fill
                : this.objects[sha].svgProps.fill,
            })),
          this.renderMeta(sha, object, {
            x: (branchNames.length + 1) * this.options.gridSize,
            y: parseInt(object.svgProps.cy + this.options.pointSize / 3, 10),
          }),
        ]
      })
      .map((item) => item.svgElement || item)
      .sort()
      .reverse()
      .join('\n')
  }

  render () {
    const animatePaused = this.options.animate === "hover" ? "running" : "paused"
    const animateTrigger = this.options.animate === "hover" ? ":hover" : ""
    const classString = "zaephyrus--graph"
    const graphHeight = (this.log.length + 1) * this.options.gridSize
    const graphWidth = 960

    let graphs

    switch (this.snapshots.length) {
      case 0:
        graphs = this.keyFrame()
        break
      case 1:
        graphs = this.snapshots[0]
        break
      default:
        graphs = this.snapshots
          .map((snapshot) => `
            <g class="${classString}__keyframe">
              <rect fill="white" height="${graphHeight}" width="${graphWidth}" x="0" y="0" />
              ${snapshot}
            </g>`)
          .join("\n")
        break
    }

    return `
    <svg ${attrs({
      class: classString,
      viewBox: `0 0 ${graphWidth} ${graphHeight}`,
      xmlns: "http://www.w3.org/2000/svg",
    })}>
      <defs>
        <style type="text/css"><![CDATA[
          svg.${classString} {
            --duration: calc(1.3s * ${this.snapshots.length});
            --delay: calc(var(--duration) / ${this.snapshots.length});

            background: white;
            height: ${graphHeight}px;
            width: ${graphWidth}px;
          }

          svg.${classString} text {
            font-family: monospace;
            font-size: ${this.options.fontSize}px;
          }

          svg.${classString} > .${classString}__keyframe {
            opacity: 0;
          }

          svg.${classString}:hover > .${classString}__keyframe {
            animation-play-state: ${animatePaused};
          }

          svg.${classString} > .${classString}__keyframe:last-of-type {
            opacity: 1;
          }

          svg.${classString}${animateTrigger} > .${classString}__keyframe:last-of-type {
            opacity: 0;
          }

          svg.${classString}${animateTrigger} > .${classString}__keyframe:first-of-type {
            opacity: 1;
          }

          ${!this.options.animate ? '' : this.snapshots.map((_, index) => `
          svg.${classString}${animateTrigger} > .${classString}__keyframe:nth-of-type(${index + 1}) {
            animation: slideshow var(--duration) calc(var(--delay) * ${index}) ease infinite;
          }`).join("\n")}

          @keyframes slideshow {
            0% { opacity: 1; }
            ${int(1 / this.snapshots.length * 100) - 1}% { opacity: 1; }
            ${int(1 / this.snapshots.length * 100)}% { opacity: 0; }
            100% { opacity: 0; }
          }
        ]]></style>
      </defs>

      ${graphs}
    </svg>`
  }

  renderMeta (sha, object, config) {
    const text = object.comment
    const maxLength = 50
    const truncated = text.slice(0, maxLength)
    const wordCount = truncated.split(' ').length
    const displayText = text
      .split(' ')
      .slice(0, wordCount)
      .concat(truncated !== text ? '...' : '')
      .join(' ')
      .trim()

    const branch = this.branches[object.branch].head !== sha
      ? false
      : this.svgRect(object.branch, {
        fill: "white",
        stroke: object.svgProps.fill,
        ...config
      })
    const tags = (object.tags || [])
      .map((tag) => this.svgRect(tag, {
        ...config,
        fill: "gainsboro",
      }))

    if (branch) {
      tags.unshift(branch)
    }

    const parts = tags
      .concat(this.svgText(displayText, config))
      .reduce((list, item, index) => {
        if (!index) return [item]

        const offset = list[index - 1]
          .match(/width="(\d+).*?x="(\d+)/)
          .slice(1, 3)
          .reduce((a, b) => int(a) + int(b))
        const spacing = int(this.options.fontSize / 2)

        return list
          .concat(item.replace(/\bx="\d+"/, `x="${offset + spacing}"`))
      }, [])
      .flatMap((item) => {
        const {title, width, x, y} = item
          // match all the attributes of the element
          .match(/\b\w+="[^"]+"/g)
          // create the key value pairs
          .map((attr) => attr.replace(/"/g, "").split("="))
          // create an object of all attributes
          .reduce((acc, [k, v]) => ({...acc, [k]: v}), {})

        return [
          item,
          title && this.svgText(title, {
            "text-anchor": "middle",
            x: int(x) + int(width / 2),
            y: int(y) + int(this.options.fontSize * 1.1),
          }),
        ]
        return title
          ? [item, this.svgText(title, {x, y})]
          : item
      })

    return `
      <title>${text}</title>
      ${parts.join('\n')}
    `
  }

  svgCircle (config) {

    return `<circle${attrs({r: this.options.pointSize, ...config})}></circle>`
  }

  svgLine (config) {

    return `<line${attrs({"stroke-width": this.options.strokeWidth, ...config})}></line>`
  }

  svgRect (text, config) {
    const scaling = [.9, .8, .7, .6][int(text.length / int(this.options.fontSize / 2))]
    const width = int(text.length * this.options.fontSize * scaling)

    return `<rect${attrs({
      height: int(this.options.fontSize * 1.5),
      rx: int(this.options.fontSize / 2),
      title: text,
      width,
      ...config,
      y: config.y - int(this.options.fontSize * 1.1),
    })}></rect>`
  }

  svgText (text, config) {

    return `<text${attrs(config)}>${text}</text>`
  }
}

module.exports = {
  createGraph: (commands, options) => new Graph(commands, options).render(),
  textToQS,
}
