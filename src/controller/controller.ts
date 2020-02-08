import * as action from '../actions';
import {
  BrowserName,
  defaultLaunchOptions,
  defaultNavigationOptions,
  LaunchOptions,
  NavigationOptions,
} from '../actions';
import { Browser, Page, BrowserContext } from 'playwright';

export { BrowserName, NavigationOptions, LaunchOptions } from '../actions';

export class PlaywrightController implements PromiseLike<void> {
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
  private async launchBrowser(name: BrowserName): Promise<void> {
    this.browser = await action.launchBrowser(name, this.launchOptions);
    this.browserContext = await this.browser.newContext();
    this.page = await this.browserContext.newPage();
  }

  public withOptions(options: Partial<LaunchOptions>): PlaywrightController {
    const updatedOptions: LaunchOptions = {
      ...this.launchOptions,
      ...options,
    };
    this.launchOptions = updatedOptions;
    return this;
  }

  public withBrowser(name: BrowserName): PlaywrightController {
    const action = (): Promise<void> => this.launchBrowser(name);
    this.actions.push(action);
    return this;
  }

  private async closeBrowser(): Promise<void> {
    await action.closeBrowser(this.currentBrowser());
  }

  public close(): PlaywrightController {
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
  ): PlaywrightController {
    const navigationOptions: NavigationOptions = {
      ...defaultNavigationOptions,
      ...options,
    };
    const action = (): Promise<void> => this.gotoUrl(url, navigationOptions);
    this.actions.push(action);
    return this;
  }
  public async getCurrentUrl(): Promise<string> {
    return await action.getCurrentUrl(this.currentPage());
  }
}