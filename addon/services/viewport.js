import Service from '@ember/service';
import { run } from '@ember/runloop';
import { computed } from '@ember/object';
import $ from 'jquery';

export default Service.extend({
  init() {
    this._super(...arguments);

    this.set('_windowResizehandler', () => {
      run.debounce(this, '_setHeightAndWidth', 100);
    });

    const $el = this.get('_$el');
    $el.on('resize', this.get('_windowResizehandler'));

    this._setHeightAndWidth();
  },

  willDestroy() {
    this._super(...arguments);
    const $el = this.get('_$el');
    $el.off('resize', this.get('_windowResizehandler'));
  },

  el: window,

  height: 0,
  width: 0,
  bootstrapHeight: 0,
  bootstrapWidth: 0,

  isXs: computed.lt('bootstrapWidth', 768),

  isSm: computed('bootstrapWidth', function() {
    const width = this.get('bootstrapWidth');

    return width >= 768 && width < 992;
  }),

  isMd: computed('bootstrapWidth', function() {
    const width = this.get('bootstrapWidth');

    return width >= 992 && width < 1200;
  }),

  isLg: computed.gte('bootstrapWidth', 1200),

  _$el: computed('el', function() {
    return $(this.get('el'));
  }),

  _setHeightAndWidth() {
    if (!this.isDestroyed) {
      const $el = this.get('_$el');

      const viewportWithScrollBar = this.viewportWithScrollBar();

      this.setProperties({
        height: $el.height(),
        width: $el.width(),
        bootstrapWidth: viewportWithScrollBar.width,
        bootstrapHeight: viewportWithScrollBar.height
      });
    }
  },

  viewportWithScrollBar() {
    // width including the scrollbar (for media queries)
    // http://stackoverflow.com/questions/11309859/css-media-queries-and-javascript-window-width-do-not-match
    let e = window;

    let a = 'inner';

    if (!('innerWidth' in window)) {
      a = 'client';
      e = document.documentElement || document.body;
    }
    return {
      width: e[a + 'Width'],
      height: e[a + 'Height']
    };
  }
});
