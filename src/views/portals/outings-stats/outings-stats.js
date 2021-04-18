import d3 from '@/js/libs/d3';

export class Histogram {
  constructor(data, htmlElement, getX) {
    this._data = data;
    this._htmlElement = htmlElement;
    this._getX = getX;
    this._xTickLabel = (value) => value;
    this._yTickLabel = (value) => value;
    this._getY = () => 1;

    // set the dimensions and margins of the graph
    this._margin = { top: 10, right: 30, bottom: 50, left: 40 };
    this._width = this._htmlElement.offsetWidth - this._margin.left - this._margin.right;
    this._height = 400 - this._margin.top - this._margin.bottom;

    this._svg = null;
    this._xScale = null;
    this._yScale = null;

    this._values = null; //computed version of data

    this._xDomain = null;
  }

  xDomain(domain) {
    this._xDomain = domain;
    return this;
  }

  y(yGetter) {
    this._getY = yGetter;
    return this;
  }

  xTickLabel(xTickLabelGetter) {
    this._xTickLabel = xTickLabelGetter;
    return this;
  }

  yTickLabel(yTickLabelGetter) {
    this._yTickLabel = yTickLabelGetter;
    return this;
  }

  draw() {
    d3.then(this._draw.bind(this));
  }

  _computeValues() {
    let values = {};

    for (const d of this._data) {
      const x = this._getX(d);
      const y = this._getY(d);
      if (y !== null && y !== undefined) {
        values[x] = values[x] || { x, y: 0 };
        values[x].y += y;
      }
    }

    this._values = Object.values(values);
  }

  _getMaxY() {
    return d3.max(this._values, (v) => v.y);
  }

  _draw() {
    // clean
    this._htmlElement.innerHTML = '';

    this._computeValues();

    const xDomain = this._xDomain
      ? this._xDomain
      : d3.range(
          d3.min(this._values, (v) => v.x),
          d3.max(this._values, (v) => v.x) + 1
        );

    this._xScale = d3.scaleBand().range([0, this._width]).padding(0.1).domain(xDomain);

    this._yScale = d3.scaleLinear().range([this._height, 0]).domain([0, this._getMaxY()]);

    this._svg = d3
      .select(this._htmlElement)
      .append('svg')
      .attr('id', 'svg')
      .attr('width', this._width + this._margin.left + this._margin.right)
      .attr('height', this._height + this._margin.top + this._margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + this._margin.left + ',' + this._margin.top + ')');

    this._svg
      .append('g')
      .attr('transform', 'translate(0,' + this._height + ')')
      .call(d3.axisBottom(this._xScale).tickSize(0).tickFormat(this._xTickLabel))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '0.5em')
      .attr('dy', '1.5em')
      .attr('transform', 'rotate(-35)');

    this._svg.append('g').call(d3.axisLeft(this._yScale).tickFormat(this._yTickLabel));

    this.drawRectangles();
    this.drawLegend();
  }

  drawLegend() {}

  drawRectangles() {
    this._svg
      .selectAll('.bar')
      .data(this._values)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => this._xScale(d.x))
      .attr('width', this._xScale.bandwidth())
      .attr('y', (d) => this._yScale(d.y))
      .attr('height', (d) => this._height - this._yScale(d.y))
      .style('fill', '#F93');
  }
}

export class StackedHistogram extends Histogram {
  constructor(data, htmlElement, getX, getCategories) {
    super(data, htmlElement, getX);
    this._getCategories = getCategories;
    this._getCategoryLabel = (category) => category;
    this._color = () => '#F93';
    this._categoryComparator = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    this._categories = null;
  }

  _computeValues() {
    let values = {};
    let all_categories = new Set();
    let xs = new Set();

    for (const d of this._data) {
      const x = this._getX(d);
      const y = this._getY(d);
      let categories = this._getCategories(d);

      for (let category of categories) {
        if (!!category) {
          const key = `${x}_${category}`;

          values[key] = values[key] || { x, category, y: 0, yDown: 0, yUp: 0, color: null };
          values[key].y += y / categories.length;

          all_categories.add(category);
          xs.add(x);
        }
      }
    }

    this._categories = [...all_categories].sort(this._categoryComparator);

    const firstCategory = this._categories[0],
      lastCategory = this._categories[this._categories.length - 1];

    // compute lower and upper bounds of the stack
    for (let x of xs) {
      let yDown = 0;

      for (let category of this._categories) {
        const key = `${x}_${category}`;

        if (values[key]) {
          values[key].color = this._color(category, firstCategory, lastCategory);
          values[key].yDown = yDown;
          values[key].yUp = yDown + values[key].y;

          yDown = values[key].yUp;
        }
      }
    }

    this._values = Object.values(values);
  }

  categoryLabel(categoryLabelGetter) {
    this._getCategoryLabel = categoryLabelGetter;
    return this;
  }

  _getMaxY() {
    return d3.max(this._values, (v) => v.yUp);
  }

  categoryComparator(categoryComparator) {
    this._categoryComparator = categoryComparator;
    return this;
  }

  color(colorGetter) {
    this._color = colorGetter;
    return this;
  }

  drawLegend() {
    // Add one dot in the legend for each name.
    var size = 8;
    const colors = {};
    const categories = [...this._categories].reverse();

    for (let category of this._categories) {
      colors[category] = this._color(category, this._categories[0], this._categories[this._categories.length - 1]);
    }

    const legend = this._svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(10,5)')
      .style('font-size', '10px');

    const legendBox = legend
      .append('rect')
      .style('fill', 'white')
      .style('stroke', 'grey')
      .style('stroke-width', '1px')
      .attr('rx', '2px')
      .attr('ry', '2px')
      .style('opacity', 0.75);

    legend
      .selectAll('mydots')
      .data(categories)
      .enter()
      .append('rect')
      .attr('y', (d, i) => i * (size + 5))
      .attr('width', size)
      .attr('height', size)
      .style('fill', (d) => colors[d]);

    legend
      .selectAll('mylabels')
      .data(categories)
      .enter()
      .append('text')
      .attr('x', size * 1.2)
      .attr('y', (d, i) => i * (size + 5) + size / 2)
      .text(this._getCategoryLabel)
      .attr('text-anchor', 'left')
      .style('alignment-baseline', 'middle');

    const bbox = legend.node().getBBox();
    const legendPadding = 3;

    legendBox
      .attr('x', bbox.x - legendPadding)
      .attr('y', bbox.y - legendPadding)
      .attr('height', bbox.height + 2 * legendPadding)
      .attr('width', bbox.width + 2 * legendPadding);
  }

  drawRectangles() {
    this._svg
      .selectAll('.bar')
      .data(this._values)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => this._xScale(d.x))
      .attr('width', this._xScale.bandwidth())
      .attr('y', (d) => this._yScale(d.yUp))
      .attr('height', (d) => this._yScale(d.yDown) - this._yScale(d.yUp))
      .style('fill', (d) => d.color);
  }
}
