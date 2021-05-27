import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ColumnChart {
  element = null;
  subElements = {};
  chartHeight = 50;

  constructor({
    url = '',
    range = {
      from: new Date(),
      to: new Date(),
    },
    label = '',
    value = '',
    link = '#',
    formatHeading = data => data
  } = {}) {
    this.url = url;
    this.range = range;
    this.label = label;
    this.value = formatHeading(value);
    this.link = link;

    this.render();
    this.initEventListeners();
  }

  async render() {
    this._renderElement();
    const data = await this._loadData(this.range.from, this.range.to);
    this.subElements = this._getSubElements(this.element);
    this._renderChart(Object.values(data));
    this._removeLoadingInd();
  }

  async update(from, to) {
    this._setLoadingInd();
    const data = await this._loadData(from, to);
    this._renderChart(Object.values(data));
    this._removeLoadingInd();

    return data;
  }

  initEventListeners () {
    // NOTE: в данном методе добавляем обработчики событий, если они есть
  }

  remove () {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    // NOTE: удаляем обработчики событий, если они есть
  }

  async _loadData(from, to) {
    const url = new URL(this.url, 'https://course-js.javascript.ru');

    url.searchParams.set('from', from);
    url.searchParams.set('to', to);

    let data = await fetch(url.href);

    return await data.json();
  }

  _getSubElements(parentElement) {
    const elements = parentElement.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, element) => {
      accum[element.dataset.element] = element;

      return accum;
    }, {});
  }

  _setLoadingInd() {
    this.element.classList.add('column-chart_loading');
  }

  _removeLoadingInd() {
    this.element.classList.remove('column-chart_loading');
  }

  _renderElement() {
    const element = document.createElement('div'); // (*)

    element.innerHTML = `
    <div class="column-chart column-chart_loading" style="--chart-height: ${this.chartHeight}">
      <div class="column-chart__title">
        Total ${this.label}
        <a href="${this.link}" class="column-chart__link">View all</a>
      </div>
      <div class="column-chart__container">
        <div data-element="header" class="column-chart__header">${this.value}</div>
        <div data-element="body" class="column-chart__chart">
        </div>
      </div>
    </div>
    `;

    this.element = element.firstElementChild;
  }

  _renderChart(data = []) {
    if (data.length === 0) {
      return;
    }

    const columnChart = this.subElements.body;
    const header = this.subElements.header;
    const dataProps = this._getColumnProps(data);

    header.innerHTML = data.reduce((sum, dataValue) => sum + dataValue);
    columnChart.innerHTML = "";

    for (const dataProp of dataProps) {
      let column = `<div style="--value: ${dataProp.value}" data-tooltip="${dataProp.percent}"></div>`;
      columnChart.insertAdjacentHTML('beforeend', column);
    }
  }

  _getColumnProps(data) {
    const maxValue = Math.max(...data);
    const scale = this.chartHeight / maxValue;

    return data.map(item => {
      return {
        percent: (item / maxValue * 100).toFixed(0) + '%',
        value: String(Math.floor(item * scale))
      };
    });
  }
}
