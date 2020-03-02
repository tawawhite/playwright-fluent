import { BrowserContextOptions } from './playwright-types';
import * as assertion from '../assertions';
import * as action from '../actions';
import {
  BrowserName,
  ClickOptions,
  defaultClickOptions,
  defaultHoverOptions,
  defaultKeyboardPressOptions,
  defaultLaunchOptions,
  defaultNavigationOptions,
  defaultTypeTextOptions,
  HoverOptions,
  KeyboardKey,
  KeyboardPressOptions,
  LaunchOptions,
  NavigationOptions,
  TypeTextOptions,
  WindowState,
} from '../actions';
import {
  allKnownDevices,
  Device,
  DeviceName,
  getBrowserArgsForDevice,
  getDevice,
} from '../devices';
import { defaultWaitUntilOptions, sleep, WaitUntilOptions, waitUntil } from '../utils';
import { SelectorFluent } from '../selector';
import { Browser, Page, BrowserContext } from 'playwright';

export { WaitUntilOptions, noWaitNoThrowOptions } from '../utils';
export {
  BrowserName,
  ClickOptions,
  HoverOptions,
  KeyboardKey,
  KeyboardPressOptions,
  LaunchOptions,
  NavigationOptions,
  TypeTextOptions,
  WindowState,
} from '../actions';

export { Device, DeviceName, allKnownDevices } from '../devices';

export interface AssertOptions {
  /**
   * Defaults to 30000 milliseconds.
   *
   * @type {number}
   * @memberof AssertOptions
   */
  timeoutInMilliseconds: number;
  /**
   * time during which the Assert must give back the same result.
   * Defaults to 300 milliseconds.
   * You must not setup a duration < 100 milliseconds.
   * @type {number}
   * @memberof AssertOptions
   */
  stabilityInMilliseconds: number;
  /**
   * Will generate 'debug' logs,
   * so that you can understand why the assertion does not give the expected result.
   * Defaults to false
   * @type {boolean}
   * @memberof AssertOptions
   */
  verbose: boolean;
}

export const defaultAssertOptions: AssertOptions = {
  stabilityInMilliseconds: 300,
  timeoutInMilliseconds: 30000,
  verbose: false,
};

export interface ExpectAssertion {
  hasFocus: (options?: Partial<AssertOptions>) => PlaywrightFluent;
  isDisabled: (options?: Partial<AssertOptions>) => PlaywrightFluent;
  isEnabled: (options?: Partial<AssertOptions>) => PlaywrightFluent;
  isVisible: (options?: Partial<AssertOptions>) => PlaywrightFluent;
  isNotVisible: (options?: Partial<AssertOptions>) => PlaywrightFluent;
}

export class PlaywrightFluent implements PromiseLike<void> {
  public async then<TResult1 = void, TResult2 = never>(
    onfulfilled?: ((value: void) => TResult1 | PromiseLike<TResult1>) | null | undefined,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null | undefined,
  ): Promise<TResult1 | TResult2> {
    return await this.executeActions()
      .then(onfulfilled)
      .catch(onrejected);
  }

  private _lastError?: Error;
  public lastError(): Error | undefined {
    return this._lastError;
  }
  private async executeActions(): Promise<void> {
    try {
      this._lastError = undefined;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (this.actions.length === 0) {
          break;
        }
        const action = this.actions.shift();
        action && (await action());
      }
    } catch (error) {
      this._lastError = error;
      this.actions = [];
      throw error;
    } finally {
      this.actions = [];
    }
  }

  constructor(browser?: Browser, page?: Page) {
    if (browser && page) {
      this.browser = browser;
      this.page = page;
    }
  }

  private browser: Browser | undefined;
  private browserContext: BrowserContext | undefined;
  public currentBrowser(): Browser | undefined {
    return this.browser;
  }
  private page: Page | undefined;
  public currentPage(): Page | undefined {
    return this.page;
  }

  private actions: (() => Promise<void>)[] = [];

  private launchOptions: LaunchOptions = defaultLaunchOptions;
  private emulatedDevice: Device | undefined = undefined;

  private showMousePosition = false;
  private async launchBrowser(name: BrowserName): Promise<void> {
    const contextOptions: BrowserContextOptions = { viewport: null };
    if (this.emulatedDevice) {
      contextOptions.viewport = this.emulatedDevice.viewport;
      contextOptions.userAgent = this.emulatedDevice.userAgent;
      this.launchOptions.args = this.launchOptions.args || [];
      this.launchOptions.args.push(
        ...getBrowserArgsForDevice(this.emulatedDevice).andBrowser(name),
      );
    }

    this.browser = await action.launchBrowser(name, this.launchOptions);
    this.browserContext = await this.browser.newContext(contextOptions);
    this.page = await this.browserContext.newPage();
    if (this.showMousePosition) {
      await action.showMousePosition(this.page);
    }
  }

  public withOptions(options: Partial<LaunchOptions>): PlaywrightFluent {
    const updatedOptions: LaunchOptions = {
      ...this.launchOptions,
      ...options,
    };
    this.launchOptions = updatedOptions;
    return this;
  }

  public withBrowser(name: BrowserName): PlaywrightFluent {
    const action = (): Promise<void> => this.launchBrowser(name);
    this.actions.push(action);
    return this;
  }

  private async closeBrowser(): Promise<void> {
    await action.closeBrowser(this.currentBrowser());
  }

  public close(): PlaywrightFluent {
    const action = (): Promise<void> => this.closeBrowser();
    this.actions.push(action);
    return this;
  }

  private async gotoUrl(url: string, options: NavigationOptions): Promise<void> {
    await action.navigateTo(url, options, this.currentPage());
  }
  public navigateTo(
    url: string,
    options: Partial<NavigationOptions> = defaultNavigationOptions,
  ): PlaywrightFluent {
    const navigationOptions: NavigationOptions = {
      ...defaultNavigationOptions,
      ...options,
    };
    const action = (): Promise<void> => this.gotoUrl(url, navigationOptions);
    this.actions.push(action);
    return this;
  }

  private async hoverOnSelector(selector: string, options: HoverOptions): Promise<void> {
    await action.hoverOnSelector(selector, this.currentPage(), options);
  }
  private async hoverOnSelectorObject(
    selector: SelectorFluent,
    options: HoverOptions,
  ): Promise<void> {
    await action.hoverOnSelectorObject(selector, this.currentPage(), options);
  }
  public hover(
    selector: string | SelectorFluent,
    options: Partial<HoverOptions> = defaultHoverOptions,
  ): PlaywrightFluent {
    const hoverOptions: HoverOptions = {
      ...defaultHoverOptions,
      ...options,
    };
    if (typeof selector === 'string') {
      const action = (): Promise<void> => this.hoverOnSelector(selector, hoverOptions);
      this.actions.push(action);
      return this;
    }

    {
      const action = (): Promise<void> => this.hoverOnSelectorObject(selector, hoverOptions);
      this.actions.push(action);
      return this;
    }
  }
  private async clickOnSelector(selector: string, options: ClickOptions): Promise<void> {
    await action.clickOnSelector(selector, this.currentPage(), options);
  }
  private async clickOnSelectorObject(
    selector: SelectorFluent,
    options: ClickOptions,
  ): Promise<void> {
    await action.clickOnSelectorObject(selector, this.currentPage(), options);
  }
  public click(
    selector: string | SelectorFluent,
    options: Partial<ClickOptions> = defaultClickOptions,
  ): PlaywrightFluent {
    const clickOptions: ClickOptions = {
      ...defaultClickOptions,
      ...options,
    };
    if (typeof selector === 'string') {
      const action = (): Promise<void> => this.clickOnSelector(selector, clickOptions);
      this.actions.push(action);
      return this;
    }

    {
      const action = (): Promise<void> => this.clickOnSelectorObject(selector, clickOptions);
      this.actions.push(action);
      return this;
    }
  }

  /**
   * Emulate device
   *
   * @param {DeviceName} deviceName
   * @returns {PlaywrightFluent}
   * @memberof PlaywrightController
   */
  public emulateDevice(deviceName: DeviceName): PlaywrightFluent {
    const device = getDevice(deviceName);
    if (!device) {
      throw new Error(
        `device '${deviceName}' is unknown. It must be one of : [${allKnownDevices
          .map((d) => d.name)
          .join(';')}] `,
      );
    }
    this.emulatedDevice = device;
    return this;
  }

  /**
   * Show mouse position with a non intrusive cursor
   *
   * @returns {PlaywrightFluent}
   * @memberof PlaywrightController
   */
  public withCursor(): PlaywrightFluent {
    this.showMousePosition = true;
    return this;
  }

  private async typeTextInFocusedElement(text: string, options: TypeTextOptions): Promise<void> {
    await action.typeText(text, this.currentPage(), options);
  }

  /**
   * Type text in the element that has current focus.
   *
   * @param {string} text
   * @param {Partial<TypeTextOptions>} [options=defaultTypeTextOptions]
   * @returns {PlaywrightFluent}
   * @memberof PlaywrightController
   */
  public typeText(
    text: string,
    options: Partial<TypeTextOptions> = defaultTypeTextOptions,
  ): PlaywrightFluent {
    const typeTextOptions: TypeTextOptions = {
      ...defaultTypeTextOptions,
      ...options,
    };

    const action = (): Promise<void> => this.typeTextInFocusedElement(text, typeTextOptions);
    this.actions.push(action);
    return this;
  }

  private async pressOnKey(key: KeyboardKey, options: KeyboardPressOptions): Promise<void> {
    await action.pressKey(key, this.currentPage(), options);
  }
  public pressKey(
    key: KeyboardKey,
    options: Partial<KeyboardPressOptions> = defaultKeyboardPressOptions,
  ): PlaywrightFluent {
    const pressKeyOptions: KeyboardPressOptions = {
      ...defaultKeyboardPressOptions,
      ...options,
    };
    const action = (): Promise<void> => this.pressOnKey(key, pressKeyOptions);
    this.actions.push(action);
    return this;
  }

  public wait(durationInMilliseconds: number): PlaywrightFluent {
    this.actions.push(async (): Promise<void> => await sleep(durationInMilliseconds));
    return this;
  }

  /**
   * Wait until predicate becomes true,
   * and always return true during 300 ms.
   * The waiting mechanism can be modified by setting options
   *
   * @param {() => Promise<boolean>} predicate
   * @param {Partial<WaitUntilOptions>} [options=defaultWaitUntilOptions]
   * @returns {PlaywrightFluent}
   * @memberof PlaywrightController
   */
  public waitUntil(
    predicate: () => Promise<boolean>,
    options: Partial<WaitUntilOptions> = defaultWaitUntilOptions,
  ): PlaywrightFluent {
    const waitUntilOptions: WaitUntilOptions = {
      ...defaultWaitUntilOptions,
      ...options,
    };

    this.actions.push(
      async (): Promise<void> => {
        const defaultErrorMessage = `Predicate still resolved to false after ${waitUntilOptions.timeoutInMilliseconds} ms.`;
        await waitUntil(predicate, defaultErrorMessage, waitUntilOptions);
      },
    );
    return this;
  }

  public async getCurrentUrl(): Promise<string> {
    return await action.getCurrentUrl(this.currentPage());
  }

  public async getCurrentWindowState(): Promise<WindowState> {
    return await action.getWindowState(this.currentPage());
  }

  public async getValueOf(
    selector: string,
    options: Partial<WaitUntilOptions> = defaultWaitUntilOptions,
  ): Promise<string | undefined | null> {
    const waitOptions: WaitUntilOptions = {
      ...defaultWaitUntilOptions,
      ...options,
    };
    const result = await action.getValueOfSelector(selector, this.currentPage(), waitOptions);
    return result;
  }

  /**
   * Create a Selector object to be able to target a DOM element
   * that is embedded in a complex dom hierarchy or dom array
   *
   * @param {string} selector
   * @returns {SelectorFluent}
   * @memberof PlaywrightController
   */
  public selector(selector: string): SelectorFluent {
    return new SelectorFluent(selector, this);
  }
  public async hasFocus(
    selector: string | SelectorFluent,
    options: Partial<WaitUntilOptions> = defaultWaitUntilOptions,
  ): Promise<boolean> {
    return await assertion.hasFocus(selector, this.currentPage(), options);
  }

  private async expectThatSelectorHasFocus(
    selector: string | SelectorFluent,
    options: Partial<AssertOptions> = defaultAssertOptions,
  ): Promise<void> {
    await assertion.expectThatSelectorHasFocus(selector, this.currentPage(), options);
  }

  private async expectThatSelectorIsVisible(
    selector: string | SelectorFluent,
    options: Partial<AssertOptions> = defaultAssertOptions,
  ): Promise<void> {
    await assertion.expectThatSelectorIsVisible(selector, this.currentPage(), options);
  }

  private async expectThatSelectorIsNotVisible(
    selector: string | SelectorFluent,
    options: Partial<AssertOptions> = defaultAssertOptions,
  ): Promise<void> {
    await assertion.expectThatSelectorIsNotVisible(selector, this.currentPage(), options);
  }

  public async isNotVisible(
    selector: string | SelectorFluent,
    options: Partial<WaitUntilOptions> = defaultWaitUntilOptions,
  ): Promise<boolean> {
    return await assertion.isNotVisible(selector, this.currentPage(), options);
  }

  public async isVisible(
    selector: string | SelectorFluent,
    options: Partial<WaitUntilOptions> = defaultWaitUntilOptions,
  ): Promise<boolean> {
    return await assertion.isVisible(selector, this.currentPage(), options);
  }

  private async expectThatSelectorIsEnabled(
    selector: string | SelectorFluent,
    options: Partial<AssertOptions> = defaultAssertOptions,
  ): Promise<void> {
    await assertion.expectThatSelectorIsEnabled(selector, this.currentPage(), options);
  }

  public async isEnabled(
    selector: string | SelectorFluent,
    options: Partial<WaitUntilOptions> = defaultWaitUntilOptions,
  ): Promise<boolean> {
    return await assertion.isEnabled(selector, this.currentPage(), options);
  }

  private async expectThatSelectorIsDisabled(
    selector: string | SelectorFluent,
    options: Partial<AssertOptions> = defaultAssertOptions,
  ): Promise<void> {
    await assertion.expectThatSelectorIsDisabled(selector, this.currentPage(), options);
  }

  public async isDisabled(
    selector: string | SelectorFluent,
    options: Partial<WaitUntilOptions> = defaultWaitUntilOptions,
  ): Promise<boolean> {
    return await assertion.isDisabled(selector, this.currentPage(), options);
  }

  public expectThat(selector: string | SelectorFluent): ExpectAssertion {
    return {
      hasFocus: (options: Partial<AssertOptions> = defaultAssertOptions): PlaywrightFluent => {
        this.actions.push(() => this.expectThatSelectorHasFocus(selector, options));
        return this;
      },
      isDisabled: (options: Partial<AssertOptions> = defaultAssertOptions): PlaywrightFluent => {
        this.actions.push(() => this.expectThatSelectorIsDisabled(selector, options));
        return this;
      },
      isEnabled: (options: Partial<AssertOptions> = defaultAssertOptions): PlaywrightFluent => {
        this.actions.push(() => this.expectThatSelectorIsEnabled(selector, options));
        return this;
      },
      isVisible: (options: Partial<AssertOptions> = defaultAssertOptions): PlaywrightFluent => {
        this.actions.push(() => this.expectThatSelectorIsVisible(selector, options));
        return this;
      },
      isNotVisible: (options: Partial<AssertOptions> = defaultAssertOptions): PlaywrightFluent => {
        this.actions.push(() => this.expectThatSelectorIsNotVisible(selector, options));
        return this;
      },
    };
  }
}
