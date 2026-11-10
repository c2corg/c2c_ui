import type { ScaleBand, ScaleLinear } from 'd3-scale';
import type { Selection } from 'd3-selection';

import d3 from '@/js/libs/d3';

// the value of a datum: a number, or for stacked histograms a category, several categories, or values by category
type YValue = number | string | string[] | Record<string, number> | null | undefined;

interface Bar {
  x: number;
  y: number;
}

interface StackedBar extends Bar {
  category: string;
  yDown: number;
  yUp: number;
  color: string | null;
}

export class Histogram<T, V extends Bar = Bar> {
  protected _data: T[];
  protected _htmlElement: HTMLElement;
  protected _getX: (datum: T) => number;
  protected _xTickLabel: (value: number) => string | number = (value) => value;
  protected _yTickLabel: (value: number) => string | number = (value) => value;
  protected _getY: (datum: T) => YValue = () => 1;
  protected _xUrl: ((value: number) => string) | null = null;

  // set the dimensions and margins of the graph
  protected _margin = { top: 10, right: 30, bottom: 50, left: 40 };
  protected _width: number;
  protected _height: number;

  protected _svg!: Selection<SVGGElement, unknown, null, undefined>;
  protected _xScale!: ScaleBand<number>;
  protected _yScale!: ScaleLinear<number, number>;

  protected _values: V[] = []; //computed version of data

  protected _xDomain: number[] | null = null;

  constructor(data: T[], htmlElement: HTMLElement, getX: (datum: T) => number) {
    this._data = data;
    this._htmlElement = htmlElement;
    this._getX = getX;

    this._width = this._htmlElement.offsetWidth - this._margin.left - this._margin.right;
    this._height = 400 - this._margin.top - this._margin.bottom;
  }

  xDomain(domain: number[]) {
    this._xDomain = domain;
    return this;
  }

  y(yGetter: (datum: T) => YValue) {
    this._getY = yGetter;
    return this;
  }

  xTickLabel(xTickLabelGetter: (value: number) => string | number) {
    this._xTickLabel = xTickLabelGetter;
    return this;
  }

  xUrl(xUrlGetter: ((value: number) => string) | null) {
    this._xUrl = xUrlGetter;
    return this;
  }

  yTickLabel(yTickLabelGetter: (value: number) => string | number) {
    this._yTickLabel = yTickLabelGetter;
    return this;
  }

  draw() {
    d3.then(this._draw.bind(this));
  }

  protected _computeValues() {
    const values: Record<number, Bar> = {};

    for (const d of this._data) {
      const x = this._getX(d);
      const y = this._getY(d);
      if (y !== null && y !== undefined) {
        values[x] = values[x] || { x, y: 0 };
        values[x].y += y as number;
      }
    }

    this._values = Object.values(values) as V[];
  }

  protected _getMaxY(): number {
    return d3.max(this._values, (v: V) => v.y);
  }

  protected _draw() {
    // clean
    this._htmlElement.innerHTML = '';

    this._computeValues();

    const xDomain: number[] = this._xDomain
      ? this._xDomain
      : d3.range(
          d3.min(this._values, (v: V) => v.x),
          d3.max(this._values, (v: V) => v.x) + 1
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

    const axisBottom = this._svg
      .append('g')
      .attr('transform', 'translate(0,' + this._height + ')')
      .call(d3.axisBottom(this._xScale).tickSize(0).tickFormat(this._xTickLabel));

    axisBottom
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '0.5em')
      .attr('dy', '1.5em')
      .attr('transform', 'rotate(-35)');

    if (this._xUrl) {
      const xUrl = this._xUrl;

      axisBottom.selectAll<SVGTextElement, number>('text').each(function (d) {
        const anchor = d3.select(this.parentNode).append('a').attr('xlink:href', xUrl(d));
        anchor.node().appendChild(this);
      });
    }

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
      .attr('x', (d) => this._xScale(d.x)!)
      .attr('width', this._xScale.bandwidth())
      .attr('y', (d) => this._yScale(d.y))
      .attr('height', (d) => this._height - this._yScale(d.y))
      .style('fill', '#F93');
  }
}

export class StackedHistogram<T> extends Histogram<T, StackedBar> {
  protected _getCategoryLabel: (category: string) => string = (category) => category;
  protected _color: (category: string, firstCategory: string, lastCategory: string) => string = () => '#F93';
  protected _categoryComparator: (a: string, b: string) => number = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  protected _categories: string[] = [];
  protected _categoryUrl: ((category: string) => string) | null = null;
  protected _dataUrl: ((x: number, category: string) => string) | null = null;

  protected _computeValues() {
    const values: Record<string, StackedBar> = {};
    const all_categories = new Set<string>();
    const xs = new Set<number>();

    for (const d of this._data) {
      const x = this._getX(d);
      const y = this._getY(d);

      if (!!y) {
        let y_as_object: Record<string, number> = {};

        if (typeof y === 'string') {
          // simply use y as a category, and set value to 1
          y_as_object[y] = 1;
        } else if (Array.isArray(y)) {
          // Use item of array as category, and value as 1/length for each category
          for (const category of y) {
            y_as_object[category] = 1 / y.length;
          }
        } else if (typeof y === 'object') {
          y_as_object = y;
        }

        for (const category in y_as_object) {
          if (!!category && y_as_object[category] !== 0) {
            const key = `${x}_${category}`;

            values[key] = values[key] || { x, category, y: 0, yDown: 0, yUp: 0, color: null };
            values[key].y += y_as_object[category];

            all_categories.add(category);
            xs.add(x);
          }
        }
      }
    }

    this._categories = [...all_categories].sort(this._categoryComparator);

    const firstCategory = this._categories[0],
      lastCategory = this._categories[this._categories.length - 1];

    // compute lower and upper bounds of the stack
    for (const x of xs) {
      let yDown = 0;

      for (const category of this._categories) {
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

  categoryUrl(_categoryUrlGetter: ((category: string) => string) | null) {
    this._categoryUrl = _categoryUrlGetter;
    return this;
  }

  categoryLabel(categoryLabelGetter: (category: string) => string) {
    this._getCategoryLabel = categoryLabelGetter;
    return this;
  }

  protected _getMaxY(): number {
    return d3.max(this._values, (v: StackedBar) => v.yUp);
  }

  categoryComparator(categoryComparator: (a: string, b: string) => number) {
    this._categoryComparator = categoryComparator;
    return this;
  }

  color(colorGetter: (category: string, firstCategory: string, lastCategory: string) => string) {
    this._color = colorGetter;
    return this;
  }

  dataUrl(dataUrlGetter: ((x: number, category: string) => string) | null) {
    this._dataUrl = dataUrlGetter;
    return this;
  }

  drawLegend() {
    // Add one dot in the legend for each name.
    const size = 8;
    const colors: Record<string, string> = {};
    const categories = [...this._categories].reverse();

    for (const category of this._categories) {
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

    const labels = legend.selectAll('mylabels').data(categories).enter();
    const categoryUrl = this._categoryUrl;

    (categoryUrl ? labels.append('a').attr('xlink:href', categoryUrl) : labels)
      .append('text')
      .attr('x', size * 1.2)
      .attr('y', (d, i) => i * (size + 5) + size / 2)
      .text(this._getCategoryLabel)
      .attr('text-anchor', 'left')
      .style('alignment-baseline', 'middle');

    const bbox = legend.node()!.getBBox();
    const legendPadding = 3;

    legendBox
      .attr('x', bbox.x - legendPadding)
      .attr('y', bbox.y - legendPadding)
      .attr('height', bbox.height + 2 * legendPadding)
      .attr('width', bbox.width + 2 * legendPadding);
  }

  drawRectangles() {
    const rectangles = this._svg.selectAll('.bar').data(this._values).enter();
    const dataUrl = this._dataUrl;

    (dataUrl ? rectangles.append('a').attr('xlink:href', (value) => dataUrl(value.x, value.category)) : rectangles)
      .append('rect')
      .attr('x', (d) => this._xScale(d.x)!)
      .attr('width', this._xScale.bandwidth())
      .attr('y', (d) => this._yScale(d.yUp))
      .attr('height', (d) => this._yScale(d.yDown) - this._yScale(d.yUp))
      .style('fill', (d) => d.color);
  }
}
