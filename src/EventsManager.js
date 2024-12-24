export default class EventManager {
  static eventList = {
    firstOpen: 'uniq_visit',
    push: 'push_subscribe',
    web: 'webview_open',
    web_push: 'push_open_webview',
    browser: 'push_open_browser',
  };

  static get getTimeStamp() {
    return new Date().getTime();
  }

  constructor(bodyLink, userId) {
    this.bodyLink = bodyLink;
    this.userId = userId;
  }

  bodyLink = '';
  userId = '';

  static setParams(bodyLink, userID) {
    this.bodyLink = bodyLink;
    this.userId = userID;
  }

  static sendEvent(eventName) {
    fetch(
      `${this.bodyLink}?event=${eventName}&timestamp=${this.getTimeStamp}_${this.userId}`,
    );
  }
}
