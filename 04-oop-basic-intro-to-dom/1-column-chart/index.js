export default class ColumnChart {
  constructor({
    data = [],
    label = '',
    value = '',
    link = '#',
    formatHeading = () => value
  } = {}) {
    this.data = data;
    this.label = label;
    this.value = formatHeading(value);
    this.link = link;
    this.chartHeight = 50;

    this.render();
    this.initEventListeners();
  }

  render() {
    this._renderElement();
    this._setLoadingInd(this.data);
    this._renderChart(this.data);
  }

  update(newData = []) {
    this._setLoadingInd(newData);
    this._renderChart(newData);
  }

  initEventListeners () {
    // NOTE: в данном методе добавляем обработчики событий, если они есть
  }

  remove () {
    this.element.remove();
  }

  destroy() {
    this.remove();
    // NOTE: удаляем обработчики событий, если они есть
  }

  _setLoadingInd(data) {
    if (data.length === 0) {
      this.element.classList.add('column-chart_loading');
    } else {
      this.element.classList.remove('column-chart_loading');
    }
  }

  _renderElement() {
    const element = document.createElement('div'); // (*)

    element.innerHTML = `
    <div class="column-chart ${this.data.length === 0 ? 'column-chart_loading' : ''}" style="--chart-height: ${this.chartHeight}">
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

    const columnChart = this.element.querySelector('.column-chart__chart');
    const dataProps = this._getColumnProps(data);

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
