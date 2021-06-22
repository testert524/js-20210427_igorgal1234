const MONTHS_AT_ONE_TIME = 2;
const LAST_DAY_IN_A_WEEK = 7;
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь'];

export default class RangePicker {
  element = null;
  subElements = {};
  selectedFrom = null;

  handleDatePick = event => {
    const target = event.target;

    if (!target.classList.contains('rangepicker__cell')) return;

    if (!this.selectedFrom) {
      this.removeSelected();

      this.selectedFrom = new Date(target.dataset.value);
      this.highlightDates(this.selectedFrom);
    } else {
      const selectedTo = new Date(target.dataset.value);

      if (selectedTo.getTime() < this.selectedFrom.getTime()) {
        this.to = this.selectedFrom;
        this.from = selectedTo;
      } else {
        this.to = selectedTo;
        this.from = this.selectedFrom;
      }

      this.selectedFrom = null;

      this.updateInput();
      this.highlightDates(this.from, this.to);
      this.closeSelector();

      this.element.dispatchEvent(new CustomEvent('date-select'));
    }
  }

  handleControlArrows = event => {
    const className = event.target.className;
    const direction = className.slice(className.lastIndexOf('-') + 1);
    const firstTimeElement = this.subElements.selector.querySelector('time');
    const dateOfFistMonth = new Date(firstTimeElement.getAttribute('datetime'));
    let month = dateOfFistMonth.getMonth();

    if (direction === 'right') {
      month += 1;
    } else if (direction === 'left') {
      month -= 1;
    }

    dateOfFistMonth.setMonth(month);
    this.renderSelector(dateOfFistMonth);
  };

  toggleSelector = event => {
    const selector = this.subElements.selector;

    if (selector.innerHTML.trim() === '') {
      this.renderSelector(this.from);
    }

    this.element.classList.toggle('rangepicker_open');
  }

  handleClickOutside = event => {
    if (event.target.closest('.rangepicker')) return;

    this.closeSelector();
  };

  constructor({
    from = new Date(),
    to = new Date()
  } = {}) {
    this.from = from;
    this.to = to;

    this.render();
    this.initEventListeners();
  }

  render() {
    const wrapper = document.createElement('div');

    wrapper.innerHTML = this.renderSkeleton(this.from, this.to);
    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);
  }

  initEventListeners() {
    const selector = this.subElements.selector;
    const arrowsClasses = '.rangepicker__selector-control-left, .rangepicker__selector-control-right';
    const controlArrows = Array.from(selector.querySelectorAll(arrowsClasses));

    if (controlArrows.length) {
      controlArrows.forEach(arrow => {
        arrow.addEventListener('click', this.handleControlArrows, true);
      });
    }

    this.subElements.input.addEventListener('click', this.toggleSelector);
    this.subElements.selector.addEventListener('click', this.handleDatePick);
    document.addEventListener('click', this.handleClickOutside, true);
  }

  closeSelector() {
    this.element.classList.remove('rangepicker_open');
  }

  updateInput() {
    this.subElements.from.innerHTML = this.toDotSeparation(this.from);
    this.subElements.to.innerHTML = this.toDotSeparation(this.to);
  }

  renderSelector(initialDate) {
    const selector = this.subElements.selector;

    selector.innerHTML = this.renderSelectorSkeleton();
    selector.insertAdjacentHTML('beforeend', this.renderMonths(initialDate));

    if (this.selectedFrom) {
      this.highlightDates(this.selectedFrom);
    } else {
      this.highlightDates(this.from, this.to);
    }

    this.initEventListeners();
  }

  highlightDates(from, to) {
    const fromTS = from.getTime();
    let toTS = null;
    const datesButtons = this.getDatesButtons();
    const firstButtonTS = Date.parse(datesButtons[0].dataset.value);
    const lastButtonTS = Date.parse(datesButtons[datesButtons.length - 1].dataset.value);

    if (to) {
      toTS = to.getTime();

      if (toTS < firstButtonTS || fromTS > lastButtonTS) return;
    } else {
      if (fromTS < firstButtonTS || fromTS > lastButtonTS) return;
    }

    datesButtons.forEach(button => {
      let buttonDateTS = Date.parse(button.dataset.value);

      if (buttonDateTS === fromTS) {
        button.classList.add('rangepicker__selected-from');
      }

      if (!to) return;

      if (buttonDateTS === toTS) {
        button.classList.add('rangepicker__selected-to');
      }

      if (buttonDateTS > fromTS && buttonDateTS < toTS) {
        button.classList.add('rangepicker__selected-between');
      }
    });
  }

  getDatesButtons() {
    return Array.from(this.subElements.selector.querySelectorAll('.rangepicker__cell'));
  }

  renderMonths(firstMonthDate) {
    const months = [];

    for (let i = 0; i < MONTHS_AT_ONE_TIME; i++) {
      let date = new Date(firstMonthDate.getFullYear(), (firstMonthDate.getMonth() + i), firstMonthDate.getDate());

      months.push(this.renderOneMoth(date));
    }

    return months.join('');
  }

  renderOneMoth(date) {
    return `
      <div class="rangepicker__calendar">
        <div class="rangepicker__month-indicator">
          <time datetime="${this.toDateTime(date)}">${MONTHS[date.getMonth()]}</time>
        </div>
        <div class="rangepicker__day-of-week">
            ${this.renderDays()}
        </div>
        <div class="rangepicker__date-grid">
            ${this.renderDatesButtons(date)}
        </div>
      </div>`;
  }

  renderDays() {
    return DAYS.map(day => {
      return `<div>${day}</div>`;
    }).join('');
  }

  renderDatesButtons(initialDate) {
    const date = new Date(initialDate.getTime());
    const boundaryValues = this.getBoundaryValues(date);
    const startFrom = boundaryValues.firstDay === 0 ? LAST_DAY_IN_A_WEEK : boundaryValues.firstDay;
    const dateButtons = [];

    for (let i = 1; i <= boundaryValues.lastDate; i++) {
      date.setDate(i);
      dateButtons.push(`
            <button type="button"
                class="rangepicker__cell"
                data-value="${date.toISOString()}"
                style="${i === 1 ? '--start-from: ' + startFrom : ''}">
                ${i}
            </button>
        `);
    }

    return dateButtons.join('');
  }

  getBoundaryValues(initialDate) {
    const date = new Date(initialDate.getTime());

    date.setDate(1);
    const firstDay = date.getDay();

    date.setMonth((date.getMonth() + 1), 0);
    const lastDate = date.getDate();

    return {firstDay, lastDate};
  }

  renderSkeleton(from, to) {
    return `
      <div class="rangepicker">
        <div class="rangepicker__input" data-element="input">
          <span data-element="from">${this.toDotSeparation(from)}</span> -
          <span data-element="to">${this.toDotSeparation(to)}</span>
        </div>
         <div class="rangepicker__selector" data-element="selector"></div>
      </div>`;
  }

  renderSelectorSkeleton() {
    return `
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left"></div>
      <div class="rangepicker__selector-control-right"></div>`;
  }

  toDotSeparation(dateToTransform) {
    const month = this.toTwoDigits(dateToTransform.getMonth() + 1);
    const date = this.toTwoDigits(dateToTransform.getDate());

    return `${date}.${month}.${dateToTransform.getFullYear()}`;
  }

  toDateTime(date) {
    const month = this.toTwoDigits(date.getMonth() + 1);

    return `${date.getFullYear()}-${month}`;
  }

  toTwoDigits(value) {
    return ('0' + value).slice(-2);
  }

  removeSelected() {
    const datesButtons = this.getDatesButtons();
    const selectedClasses = ['rangepicker__selected-from', 'rangepicker__selected-between', 'rangepicker__selected-to'];

    datesButtons.forEach(button => button.classList.remove.apply(button.classList, selectedClasses));
  }

  getSubElements(element) {
    const subElements = element.querySelectorAll('[data-element]');

    return Array.from(subElements).reduce((result, el) => {
      result[el.dataset.element] = el;

      return result;
    }, {});
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
    document.removeEventListener('click', this.handleClickOutside, true);
  }
}
