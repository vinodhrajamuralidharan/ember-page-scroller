import Service from '@ember/service';
import { inject as service } from '@ember/service';
import EmberObject, { computed } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import $ from 'jquery';
import { run } from '@ember/runloop';
import { merge } from '@ember/polyfills';

export default Service.extend({
  viewport: service(),
  window: service(),

  _minimumDuration: 50,

  _anchors: EmberObject.create(),

  _maximumDuration: computed('_minimumDuration', function() {
    return this.get('_minimumDuration') * 4;
  }),

  _headerHeight: computed('viewport.width', function() {
    // unary plus is used here
    // https://developer.mozilla.org/hu/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators#Unary_plus_()
    const $header = $('#addon-bg-header .navbar');

    return +($header.css('position') === 'fixed' && $header.outerHeight(true));
  }),

  _velocity: computed('viewport.height', '_minimumDuration', function() {
    const maxDistance = this.get('viewport.height') / 2;

    return maxDistance / this.get('_minimumDuration');
  }),

  scrollStopEventNames: [
    'scroll',
    'mousedown',
    'DOMMouseScroll',
    'mousewheel',
    'keyup',
    'touchstart'
  ],

  to: function(name, position, options, callback) {
    scheduleOnce(
      'afterRender',
      this,
      this.afterRenderTo,
      name,
      position,
      options,
      callback
    );
  },

  // html and body needed as well
  // chrome supports body
  // firefox body
  // ie God knows
  $page: $('html, body'),

  /**
   * Removing events when service has been destroyed
   * @return {undefined}
   */
  willDestroy() {
    this.get('$page').off(
      this.scrollStopEventNames.join(' '),
      this.onScrollStop
    );
  },

  afterRenderTo(name, position, options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = null;
    }

    /**
     * Cancel the page's animation and remove
     * event listeners for onScrollStop callback
     * @return {undefined}
     */
    this.onScrollStop = run.bind(this, function() {
      const $page = this.get('$page');

      const scrollStopEventNames = this.scrollStopEventNames;

      const onScrollStop = this.onScrollStop;

      $page.stop();
      if (callback) {
        callback();
      }
      return $page.off(scrollStopEventNames.join(' '), onScrollStop);
    });

    const $page = this.get('$page');

    const scrollStopEventNames = this.scrollStopEventNames;

    const onScrollStop = this.onScrollStop;

    const $anchor = this.get(`_anchors.${name}.$el`);

    const anchorOptions = this.get(`_anchors.${name}.options`);

    const instanceOptions = {};

    const minimumDuration = this.get('_minimumDuration');

    const maximumDuration = this.get('_maximumDuration');

    let scrollTopDestination;

    let scrollTopOrigin;

    let distance;

    let duration;

    let $stayOnTopElement;

    merge(instanceOptions, anchorOptions || {});
    merge(instanceOptions, options || {});

    if ($anchor && $anchor.length) {
      scrollTopDestination =
        $anchor.offset().top -
        this.get('_headerHeight') -
        (instanceOptions.adjustment || 0);

      if (instanceOptions.stayOnTopOf) {
        $stayOnTopElement = $(instanceOptions.stayOnTopOf);
        if ($stayOnTopElement.length) {
          const windowObject = this.get('window.windowObject');
          if (windowObject) {
            scrollTopDestination = Math.min(
              scrollTopDestination,
              $stayOnTopElement.offset().top - $(windowObject).height()
            );
          }
        }
      }
      scrollTopOrigin = $page.scrollTop();
      distance = scrollTopDestination - scrollTopOrigin;

      if (
        instanceOptions.teleport === 'always' ||
        (instanceOptions.teleport === 'smart' && distance < 0)
      ) {
        $page.scrollTop(scrollTopDestination);
      } else {
        duration = Math.abs(distance) / this.get('_velocity');

        if (duration < minimumDuration) {
          duration = minimumDuration;
        }

        if (duration > maximumDuration) {
          duration = maximumDuration;
        }

        // Allows user to cancel scroll
        // to prevent jittering
        $page.on(scrollStopEventNames.join(' '), onScrollStop);
        const scrollPosition = scrollTopDestination - (position === 'bottom' ? (document.documentElement.clientHeight - 50) : 0);
        $page.animate(
          { scrollTop: scrollPosition },
          duration || 50,
          'swing',
          onScrollStop
        );
      }
    }
  }
});
