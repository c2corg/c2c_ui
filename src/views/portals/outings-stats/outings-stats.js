import d3 from '@/js/libs/d3';

export class Histogram {
  constructor(data, htmlElement, getX) {
    this.data = data;
    this.htmlElement = htmlElement;
    this._getX = getX;
    this._xTickLabel = (value) => value;
    this._yTickLabel = (value) => value;
    this._getY = () => 1;
  }

  getY(foo) {
    this._getY = foo;
    return this;
  }

  xTickLabel(foo) {
    this._xTickLabel = foo;
    return this;
  }

  yTickLabel(foo) {
    this._yTickLabel = foo;
    return this;
  }

  draw() {
    d3.then(this._draw.bind(this));
  }

  _draw() {
    // clean
    this.htmlElement.innerHTML = '';

    let values = {};

    for (const d of this.data) {
      const x = this._getX(d);
      const y = this._getY(d);
      values[x] = values[x] || { x, y: 0 };
      values[x].y += y;
    }

    values = Object.values(values);

    // set the dimensions and margins of the graph
    var margin = { top: 10, right: 30, bottom: 50, left: 40 },
      width = this.htmlElement.offsetWidth - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;

    const x = d3
      .scaleBand()
      .range([0, width])
      .padding(0.1)
      .domain(
        d3.range(
          d3.min(values, (v) => v.x),
          d3.max(values, (v) => v.x) + 1
        )
      );

    const y = d3
      .scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(values, (v) => v.y)]);

    const svg = d3
      .select(this.htmlElement)
      .append('svg')
      .attr('id', 'svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    svg
      .append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x).tickSize(0).tickFormat(this._xTickLabel))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '0.5em')
      .attr('dy', '1.5em')
      .attr('transform', 'rotate(-35)');

    svg.append('g').call(d3.axisLeft(y).tickFormat(this._yTickLabel));

    svg
      .selectAll('.bar')
      .data(values)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.x))
      .attr('width', x.bandwidth())
      .attr('y', (d) => y(d.y))
      .attr('height', (d) => height - y(d.y))
      .style('fill', '#F93');
  }
}
