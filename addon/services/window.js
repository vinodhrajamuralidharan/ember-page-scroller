import Service from '@ember/service';
import { isEqual } from '@ember/utils';

export default Service.extend({
  // stub this to another Object when testing
  windowObject: window,

  /**
   * Get the value of an unknown property
   * directly from the window object
   * @param  {String} key   property key
   * @return {Any}          property value
   */
  unknownProperty(key) {
    const mockWindow = this.get('windowObject');
    if (typeof mockWindow[key] === 'function') {
      //preserve the context: https://stackoverflow.com/a/44399193/4325661
      return mockWindow[key].bind(mockWindow);
    } else {
      return mockWindow[key];
    }
  },

  /**
   * Set the value of an unknown property
   * on the window object and trigger a
   * property change accordingly
   * @param {String} key  property name
   * @param {Any} value   value to set
   * @return {Any}        the original (passed) value
   */
  setUnknownProperty(key, value) {
    const mockWindow = this.get('windowObject');

    if (key in mockWindow) {
      // Only create/update the key if the new value is not
      // equal to the old value
      if (!isEqual(mockWindow[key], value)) {
        mockWindow[key] = value;
        this.notifyPropertyChange(key);
      }
    } else {
      assert(`Can't set new property ${key} on window using service:window`);
    }
    return value;
  }
});
