import { getHandleOf } from '../get-handle-of';
import { WaitUntilOptions } from '../../../utils';
import { hasHandleExactValue } from '../../handle-actions';
import { Page } from 'playwright';

export async function hasSelectorExactValue(
  selector: string,
  expectedValue: string,
  page: Page | undefined,
  options: WaitUntilOptions,
): Promise<boolean> {
  if (!page) {
    throw new Error(
      `Cannot check exact value of '${selector}' because no browser has been launched`,
    );
  }

  const handle = await getHandleOf(selector, page, options);
  const result = await hasHandleExactValue(handle, expectedValue);
  return result;
}
