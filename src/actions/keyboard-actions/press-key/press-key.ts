import { Page } from 'playwright';

export interface KeyboardPressOptions {
  /**
   * Time to wait between keydown and keyup in milliseconds.
   * Defaults to 50.
   *
   * @type {number}
   * @memberof KeyboardPressOptions
   */
  delay: number;
}

export type KeyboardKey = 'Tab' | 'Backspace' | 'Enter';

export const defaultKeyboardPressOptions: KeyboardPressOptions = {
  delay: 50,
};
export async function pressKey(
  key: KeyboardKey,
  page: Page | undefined,
  options: KeyboardPressOptions,
): Promise<void> {
  if (!page) {
    throw new Error(`Cannot press key '${key}' because no browser has been launched`);
  }

  await page.keyboard.press(key, options);
}