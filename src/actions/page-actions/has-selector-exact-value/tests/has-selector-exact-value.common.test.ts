import * as SUT from '../index';
import { defaultWaitUntilOptions } from '../../../../utils';
import { Page } from 'playwright';

describe('has-selector-exact-value', (): void => {
  beforeEach((): void => {
    jest.setTimeout(30000);
  });

  test('should return an error when page has not been initalized', async (): Promise<void> => {
    // Given
    const page: Page | undefined = undefined;

    // When
    // Then
    const expectedError = new Error(
      "Cannot check exact value of 'foobar' because no browser has been launched",
    );
    await SUT.hasSelectorExactValue(
      'foobar',
      'value',
      page,
      defaultWaitUntilOptions,
    ).catch((error): void => expect(error).toMatchObject(expectedError));
  });
});
