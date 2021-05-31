import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {
  element = null;
  subElements = {};
  data = [];
  loadStart = 0;
  loadLength = 30;


  constructor(headersConfig, {
    url = '',
    isSortLocally = false,
    sorted = {}
  } = {}) {
    this.url = url;
    this.isSortLocally = isSortLocally;
    this.headerConfig = headersConfig;
    this.pointerdownHandler = this._pointerdownHandler.bind(this);
    this.scrollHandler = this._scrollHandler.bind(this);

    this.sorted = sorted;
    if (!sorted.id) {
      this.sorted.id = headersConfig.find(item => item.sortable).id || '';
    }
    this.sorted.order = sorted.order || 'asc';

    this.init();
    this.sortableCell = Array.from(this.subElements.header.children).find(item => item.dataset.id === this.sorted.id);
    this.initEventListeners();
  }

  init() {
    const element = document.createElement('div');

    element.innerHTML = this.template;
    this.element = element.firstElementChild;

    this.subElements = this.getSubElements(this.element);

    this.initHeader();
  }

  async loadData(addResultToData = false) {
    if (!this.url) return;

    this.setLoadingInd();

    const url = new URL(this.url, BACKEND_URL);

    if (this.sorted.id) {
      url.searchParams.set('_sort', this.sorted.id);
    }

    url.searchParams.set('_order', this.sorted.order);
    url.searchParams.set('_start', this.loadStart.toString());
    url.searchParams.set('_end', (this.loadStart + this.loadLength).toString());

    let loadedData = [];
    try {
      loadedData = await fetch(url.href);
      loadedData = await loadedData.json();
    } catch (err) {
      console.log(err);
    }

    if (addResultToData) {
      this.data = this.data.concat(loadedData);
    } else {
      this.data = loadedData;
    }
    this.removeLoadingInd();
  }

  setLoadingInd() {
    this.subElements.loading.style.display = 'block';
  }

  removeLoadingInd() {
    this.subElements.loading.style.display = 'none';
  }

  sort() {
    this.isSortLocally ? this.sortOnClient() : this.sortOnServer();
  }

  sortOnClient () {
    this.sortData();
    this.renderHeaderAndBody();
  }

  sortOnServer (id, order) {
    this.loadStart = 0;
    this.render();
  }

  async render() {
    await this.loadData();
    this.renderHeaderAndBody();
  }

  renderHeaderAndBody() {
    if (this.data.length) {
      this.renderHeader();
      this.renderBody();
    } else {
      this.subElements.emptyPlaceholder.style.display = 'block';
    }
  }

  getSubElements(parentElement) {
    const elements = parentElement.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  get template() {
    return `
      <div data-element="productsContainer" class="products-list__container">
        <div class="sortable-table">
            <div data-element="header" class="sortable-table__header sortable-table__row"></div>
            <div data-element="body" class="sortable-table__body"></div>
            <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
            <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
              <div>
                <p>No products satisfies your filter criteria</p>
                <button type="button" class="button-primary-outline">Reset all filters</button>
              </div>
            </div>
        </div>
      </div>
    `;
  }

  initHeader() {
    this.subElements.header.innerHTML = this.headerConfig.map((cell) => {
      return `
        <div class="sortable-table__cell"
            data-id="${cell.id}"
            data-sortable="${cell.sortable}"
            data-order=""
            data-sort-type="${cell.sortType}">
            <span>${cell.title}</span>
        </div>
      `;
    }).join('');
  }

  renderBody() {
    const rows = this.getBodyRows();

    this.subElements.body.innerHTML = '';
    this.subElements.body.append(...rows);
  }

  getBodyRows() {
    return this.data.map((rowData) => {
      const row = this.getBodyRow(rowData);

      row.innerHTML = this.getBodyRowContent(rowData);

      return row;
    });
  }

  getBodyRow(rowData) {
    const rowLink = document.createElement('a');
    rowLink.setAttribute('href', `/products/${rowData.id}`);
    rowLink.className = 'sortable-table__row';
    return rowLink;
  }

  getBodyRowContent(rowData) {
    return Array.from(this.headerConfig).map((cellConfig) => {
      if (cellConfig.hasOwnProperty('template')) {
        return cellConfig.template(rowData[cellConfig.id]);
      } else {
        return `<div class="sortable-table__cell">${rowData[cellConfig.id]}</div>`;
      }
    }).join('');
  }

  get sortArrow() {
    return `
        <span data-element="arrow" class="sortable-table__sort-arrow">
          <span class="sort-arrow"></span>
        </span>`;
  }

  renderHeader() {
    const arrow = this.subElements.header.querySelector('[data-element = arrow]');
    Array.from(this.subElements.header.children).forEach(item => item.dataset.order = '');

    this.sortableCell.dataset.order = this.sorted.order;

    if (arrow) {
      this.sortableCell.append(arrow);
    } else {
      this.sortableCell.insertAdjacentHTML('beforeend', this.sortArrow);
    }
  }

  sortData() {
    this.data = Array.from(this.data).sort((productA, productB) => {
      const id = this.sorted.id;
      const order = this.sorted.order;
      const a = productA[id];
      const b = productB[id];
      let result = null;

      switch (this.sortableCell.dataset.sortType) {
      case 'number':
        result = a - b;
        break;
      case 'string':
        result = a.localeCompare(b, ['ru-u-kf-upper', 'en-u-kf-upper']);
        break;
      }

      if (order === 'asc') {
        return result;
      } else if (order === 'desc') {
        return -result;
      }
    });
  }

  initEventListeners () {
    this.element.addEventListener('pointerdown', this.pointerdownHandler);
    window.addEventListener('scroll', this.scrollHandler);
  }

  async _scrollHandler(event) {
    let scrollHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    );

    const firePointer = scrollHeight - document.documentElement.clientHeight;

    if (window.pageYOffset === firePointer) {
      this.loadStart += this.loadLength;
      await this.loadData(true);
      this.renderHeaderAndBody();
    }
  }

  _pointerdownHandler(event) {
    const target = event.target.closest('.sortable-table__cell');

    if (target && target.dataset.sortable === 'true') {
      event.preventDefault();

      this.sortableCell = target;
      this.sorted.id = target.dataset.id;
      this.sorted.order = (target.dataset.order === 'desc') ? 'asc' : 'desc';

      this.sort();
    }
  }

  remove () {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }
}
