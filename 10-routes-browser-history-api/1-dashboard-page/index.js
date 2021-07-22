import RangePicker from './components/range-picker/src/index.js';
import SortableTable from './components/sortable-table/src/index.js';
import ColumnChart from './components/column-chart/src/index.js';
import header from './bestsellers-header.js';

import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru/';

export default class Page {
  element = null;
  subElements = {};
  range = {
    from: new Date(),
    to: new Date(),
  };

  constructor() {
    this.range.from.setMonth(this.range.from.getMonth() - 1);

    this.rangePicker = new RangePicker(this.range);

    this.ordersChart = new ColumnChart({
      range: this.range,
      url: 'api/dashboard/orders',
      label: 'Orders',
      link: '/sales'
    });

    this.salesChart = new ColumnChart({
      range: this.range,
      url: 'api/dashboard/sales',
      label: 'Sales',
      formatHeading: data => `$${data}`
    });

    this.customersChart = new ColumnChart({
      range: this.range,
      url: 'api/dashboard/customers',
      label: 'Customers'
    });

    this.sortableTable = new SortableTable(header, {
      range: this.range,
      url: 'api/dashboard/bestsellers',
      isSortLocally: true,
      isInfiniteScroll: false
    });
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.template;
    this.element = wrapper.firstElementChild;

    this.subElements = {
      rangePicker: this.rangePicker.element,
      ordersChart: this.ordersChart.element,
      salesChart: this.salesChart.element,
      customersChart: this.customersChart.element,
      sortableTable: this.sortableTable.element
    };

    this.renderSubElements();

    this.initEventListeners();

    return this.element;
  }

  get template() {
    return `
        <div class="dashboard full-height flex-column">
            <div class="content__top-panel">
              <h2 class="page-title">Dashboard</h2>
            </div>
            <div class="dashboard__charts">
            </div>
            <h3 class="block-title">Best sellers</h3>
        </div>`;
  }

  renderSubElements() {
    const {rangePicker, ordersChart, salesChart, customersChart, sortableTable} = this.subElements;

    const dashboardCharts = this.element.querySelector('.dashboard__charts');
    const topPanel = this.element.querySelector('.content__top-panel');

    ordersChart.classList.add('dashboard__chart_orders');
    salesChart.classList.add('dashboard__chart_sales');
    customersChart.classList.add('dashboard__chart_customers');

    topPanel.append(rangePicker);
    dashboardCharts.append(ordersChart, salesChart, customersChart);
    this.element.append(sortableTable);
  }

  update() {
    this.ordersChart.update(this.range);
    this.salesChart.update(this.range);
    this.customersChart.update(this.range);
    this.sortableTable.update(this.range);
  }

  initEventListeners() {
    this.element.addEventListener('date-select', event => {
      this.range = event.detail.selected;

      this.update();
    });
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
  }
}
